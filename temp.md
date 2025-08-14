"""# AKS Workload Identity → Azure Key Vault (End-to-End Runbook)

> A single, copy-pasteable guide to wire your pods (Kubernetes ServiceAccounts) to a **User-Assigned Managed Identity (UAMI)** via **AKS Workload Identity**, authorize against **Azure Key Vault** using **Azure RBAC**, and **debug** issues.  
> All sensitive values are placeholders — replace anything in `<>`.

---

## 0) Fill These Variables (once)

```bash
# ====== REQUIRED (you fill) ======
NAMESPACE="<YOUR_NAMESPACE>"                       # e.g. webui-internal
DEPLOYMENT="<YOUR_DEPLOYMENT_NAME>"                # e.g. app-mlc-fasat-web
SERVICE_ACCOUNT="<YOUR_SERVICEACCOUNT>"            # e.g. default
UAMI_RG="<UAMI_RESOURCE_GROUP>"                    # RG of your user-assigned managed identity
UAMI_NAME="<UAMI_NAME>"                            # name of the UAMI ("secrets identity")
KV_NAME="<YOUR_KEYVAULT_NAME>"                     # e.g. mif-cc-fasat-dev2-akv
AKS_RG="<AKS_RESOURCE_GROUP>"                      # AKS resource group
AKS_NAME="<AKS_CLUSTER_NAME>"                      # AKS cluster name
# Optional (for diagnostics / DNS checks)
DNS_RG="<DNS_RESOURCE_GROUP>"
LOG_ANALYTICS_WORKSPACE_RESOURCE_ID="<LAW_RESOURCE_ID>"
# =================================
```

### Derive These (CLI computes them)

```bash
# Managed Identity (UAMI) IDs
read UAMI_CLIENT_ID UAMI_PRINCIPAL_ID <<<$(az identity show -g "$UAMI_RG" -n "$UAMI_NAME" --query "[clientId,principalId]" -o tsv)

# Key Vault resource ID
VAULT_ID=$(az keyvault show -n "$KV_NAME" --query id -o tsv)

# AKS OIDC issuer (must match Federated Credential issuer)
ISSUER=$(az aks show -g "$AKS_RG" -n "$AKS_NAME" --query oidcIssuerProfile.issuerUrl -o tsv)

echo "UAMI_CLIENT_ID=$UAMI_CLIENT_ID"
echo "UAMI_PRINCIPAL_ID=$UAMI_PRINCIPAL_ID"
echo "VAULT_ID=$VAULT_ID"
echo "ISSUER=$ISSUER"
```

---

## 1) Wire Kubernetes (ServiceAccount + Pod Template + Env)

> These are idempotent; safe to run again.

```bash
# 1.1 Annotate the ServiceAccount with the UAMI clientId
kubectl annotate sa "$SERVICE_ACCOUNT" -n "$NAMESPACE" \
  azure.workload.identity/client-id="$UAMI_CLIENT_ID" --overwrite

# 1.2 Make the Deployment run as that SA, opt in to Workload Identity, and ensure token mount
kubectl patch deploy "$DEPLOYMENT" -n "$NAMESPACE" \
  -p '{"spec":{"template":{"spec":{"serviceAccountName":"'"$SERVICE_ACCOUNT"'","automountServiceAccountToken":true}}}}'

kubectl patch deploy "$DEPLOYMENT" -n "$NAMESPACE" \
  -p '{"spec":{"template":{"metadata":{"labels":{"azure.workload.identity/use":"true"}}}}}'

# 1.3 Help the Azure SDK pick your UAMI (clientId)
kubectl set env deployment/"$DEPLOYMENT" -n "$NAMESPACE" AZURE_CLIENT_ID="$UAMI_CLIENT_ID"

# 1.4 Restart to apply
kubectl rollout restart deploy/"$DEPLOYMENT" -n "$NAMESPACE"
kubectl rollout status  deploy/"$DEPLOYMENT" -n "$NAMESPACE"
```

### Quick Verifications (K8s wiring)

```bash
# SA shows the annotation?
kubectl get sa "$SERVICE_ACCOUNT" -n "$NAMESPACE" -o yaml | grep -A1 'azure.workload.identity/client-id'

# Pod template has SA, label, and token automount?
kubectl get deploy "$DEPLOYMENT" -n "$NAMESPACE" \
  -o jsonpath='{.spec.template.spec.serviceAccountName}{"\\n"}{.spec.template.metadata.labels}{"\\n"}{.spec.template.spec.automountServiceAccountToken}{"\\n"}' ; echo

# Env var set?
kubectl set env deployment/"$DEPLOYMENT" -n "$NAMESPACE" --list | grep AZURE_CLIENT_ID
```

---

## 2) Federated Credential (on the **UAMI**)

> Entra will only exchange the pod’s SA token for the UAMI **if** the FC matches **issuer/subject/audience**.

```bash
# 2.1 List FCs on the UAMI
az identity federated-credential list -g "$UAMI_RG" -n "$UAMI_NAME" -o table

# 2.2 Inspect one FC (replace <FC_NAME>)
az identity federated-credential show -g "$UAMI_RG" -n "$UAMI_NAME" \
  --federated-credential-name <FC_NAME> \
  --query "{issuer:properties.issuer,subject:properties.subject,audience:properties.audience}"
```

✅ Expect:
- `issuer` = `$ISSUER`  
- `subject` = `system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>` (e.g. `system:serviceaccount:webui-internal:default`)  
- `audience` includes `api://AzureADTokenExchange`

**If mismatch, (re)create with exact values:**

```bash
# (Optional) Delete the incorrect FC (no patch support in some CLI versions)
az identity federated-credential delete -g "$UAMI_RG" -n "$UAMI_NAME" \
  --federated-credential-name <FC_NAME> 2>/dev/null || true

# Create FC with the exact issuer/subject/audience
az identity federated-credential create \
  -g "$UAMI_RG" -n "$UAMI_NAME" \
  --federated-credential-name <FC_NAME> \
  --issuer "$ISSUER" \
  --subject "system:serviceaccount:$NAMESPACE:$SERVICE_ACCOUNT" \
  --audience api://AzureADTokenExchange
```

---

## 3) Key Vault Authorization (Azure RBAC, **data-plane**)

> Access Policies must be disabled (you’re using **Azure RBAC**).

```bash
# 3.1 Vault uses RBAC?
az keyvault show -n "$KV_NAME" --query properties.enableRbacAuthorization -o tsv
# expect: true

# 3.2 List role assignments at the vault scope for the **UAMI principalId**
az role assignment list --assignee "$UAMI_PRINCIPAL_ID" --scope "$VAULT_ID" \
  --query "[].{role:roleDefinitionName,scope:scope}" -o table
# expect: "Key Vault Secrets User"  scope = /subscriptions/.../vaults/<KV_NAME>

# 3.3 (If missing) assign Key Vault Secrets User at vault scope (idempotent)
az role assignment create --assignee "$UAMI_PRINCIPAL_ID" \
  --role "Key Vault Secrets User" --scope "$VAULT_ID"
```

> Notes  
> • Use **UAMI principalId** for RBAC; use **UAMI clientId** for SA annotation and `AZURE_CLIENT_ID`.  
> • If your code **lists** secrets, **Secrets User** is sufficient (has `get` + `list`). If you used a **custom role**, ensure it includes `Microsoft.KeyVault/vaults/secrets/read` and list.

---

## 4) Minimal, Decisive Checks (Auth, Identity, & Root-Cause)

### 4.1 Workload Identity token & intended UAMI present in the pod

```bash
# Pick a pod of the deployment (adjust selector to your labels if needed)
POD=$(kubectl get pods -n "$NAMESPACE" -l app="$DEPLOYMENT" -o jsonpath='{.items[0].metadata.name}')
echo "$POD"

# OIDC token projected? (should show azure-identity-token)
kubectl exec -n "$NAMESPACE" "$POD" -- ls /var/run/secrets/azure/tokens || true

# The UAMI you intend?
kubectl exec -n "$NAMESPACE" "$POD" -- printenv AZURE_CLIENT_ID || true
```

> If the pod has multiple containers, add `-c <CONTAINER_NAME>` to the `kubectl exec` commands.

### 4.2 Ground Truth: What Key Vault Saw (most useful)

> Enable AuditEvent once, then query results in **Log Analytics**.

```bash
# Enable KV diagnostics (one-time). Skip if already configured.
az monitor diagnostic-settings create \
  --resource "$VAULT_ID" \
  --name kv-audit \
  --workspace "$LOG_ANALYTICS_WORKSPACE_RESOURCE_ID" \
  --logs '[{"category":"AuditEvent","enabled":true}]'
```

**KQL to run in the workspace → Logs:**

```kusto
AzureDiagnostics
| where ResourceProvider == "MICROSOFT.KEYVAULT" and Category == "AuditEvent"
| where OperationName contains "Secret"
| project TimeGenerated, OperationName, ResultType, ResultDescription,
          identity_principalId_g, identity_claim_appid_g, identity_claim_sub_s, CallerIPAddress
| top 50 by TimeGenerated desc
```

Interpretation:
- `identity_claim_appid_g` → **clientId** (should equal **UAMI_CLIENT_ID**)
- `identity_principalId_g` → **principalId** (should equal **UAMI_PRINCIPAL_ID**)
- `identity_claim_sub_s` → **K8s SA subject** (should be `system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>`)
- `ResultDescription`:
  - `AccessDenied` → **RBAC** issue (role/scope/principal)
  - `ForbiddenByFirewall` / `IpNotAllowed` → **Network/DNS** (Private Endpoint/DNS path)

### 4.3 (Optional) DNS Yes/No Without Pulling New Images

> From **any existing pod** in the same namespace (no interactive shell needed):

```bash
kubectl exec -n "$NAMESPACE" "$POD" -- getent hosts "$KV_NAME.vault.azure.net" || \
kubectl exec -n "$NAMESPACE" "$POD" -- host "$KV_NAME.vault.azure.net" || \
kubectl exec -n "$NAMESPACE" "$POD" -- ping -c1 "$KV_NAME.vault.azure.net"
```

- **Private IP (10.x/172.16/192.168)** → Private Endpoint/DNS path OK  
- **Public IP (~20.x) or NXDOMAIN** → DNS/zone link issue (even if SP worked previously)

> Your app should use the **public** FQDN: `https://<KV_NAME>.vault.azure.net`. DNS will CNAME it to the `privatelink` host that resolves to the **private IP**.

---

## 5) Common Pitfalls (Quick Checklist)

- FC **subject** must **exactly** equal `system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>`.
- SA **annotation** & pod **label** missing → token not projected.
- `AZURE_CLIENT_ID` not set → SDK may not pick your UAMI.
- KV role assigned to **wrong principal** (e.g., used `clientId` instead of `principalId`) or **wrong scope** (RG only).
- KV **Public network access = Disabled** but **Private DNS** not linked to **AKS VNet** (A record for `<KV_NAME>` missing/incorrect).
- App calling the wrong host (use `https://<KV_NAME>.vault.azure.net`, **not** `privatelink` FQDN directly).

---

## 6) If It Still Fails — Single-Line Fixes per Root Cause

- **RBAC (`AccessDenied`)**  
  ```bash
  az role assignment create --assignee "$UAMI_PRINCIPAL_ID" --role "Key Vault Secrets User" --scope "$VAULT_ID"
  ```

- **Network (`ForbiddenByFirewall` / `IpNotAllowed`)**  
  In Portal: Private DNS zone `privatelink.vaultcore.azure.net` →  
  • **Record sets**: A-record `<KV_NAME>` → **PE private IP**  
  • **Virtual network links**: ensure the **AKS nodes’ VNet** is linked

- **SDK not selecting UAMI**  
  ```bash
  kubectl set env deployment/"$DEPLOYMENT" -n "$NAMESPACE" AZURE_CLIENT_ID="$UAMI_CLIENT_ID"
  kubectl rollout restart deploy/"$DEPLOYMENT" -n "$NAMESPACE"
  ```

---

## 7) Optional: One-Shot Smoke Pod (to validate WI injection only)

```bash
kubectl run wi-smoke -n "$NAMESPACE" --image=busybox --restart=Never --command \
  -- sh -c 'sleep 600' \
  --overrides '{
    "apiVersion":"v1",
    "metadata":{"labels":{"azure.workload.identity/use":"true"}},
    "spec":{
      "serviceAccountName":"'"$SERVICE_ACCOUNT"'",
      "automountServiceAccountToken": true,
      "containers":[{"name":"box","image":"busybox","args":["sh","-c","sleep 600"],
        "env":[{"name":"AZURE_CLIENT_ID","value":"'"$UAMI_CLIENT_ID"'"}]}]
    }}'

# Token must exist:
kubectl exec -n "$NAMESPACE" wi-smoke -- ls /var/run/secrets/azure/tokens || true
kubectl delete pod wi-smoke -n "$NAMESPACE" --ignore-not-found
```

---

### TL;DR Execution Order

1. **Section 0 & Derive** → fill variables, compute IDs.  
2. **Section 1** → annotate SA, patch Deployment, set env, restart.  
3. **Section 2** → verify (or recreate) Federated Credential (issuer/subject/audience).  
4. **Section 3** → confirm RBAC on **vault** to **UAMI principalId** (Secrets User).  
5. **Section 4** → decisive checks: pod token/env + KV AuditEvent; optional DNS yes/no.  
6. Fix per **Section 6** based on the exact result (`AccessDenied` vs `ForbiddenByFirewall`).
```

# Save the file
file_path = '/mnt/data/aks_workload_identity_keyvault_runbook.md'
with open(file_path, 'w') as f:
    f.write(md_content)

file_path