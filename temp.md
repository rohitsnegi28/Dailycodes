If PE + RBAC look “correct” in Portal but you still see 403, it’s almost always one of these:

1. Wrong role (management-plane vs data-plane)
Folks often assign Reader or Key Vault Reader (management plane) which cannot read secrets. For secrets you need a data-plane role like:

Key Vault Secrets User (get + list)

Key Vault Secrets Officer (broader)

Or a custom role that includes Microsoft.KeyVault/vaults/secrets/read



2. Assigned to the wrong principal
Use the UAMI’s principalId (a.k.a. objectId), not just the clientId, when checking assignments.


3. Wrong scope
Assign at the vault resource (or higher scope with inheritance). Double-check inheritance isn’t blocked.


4. Your app is doing list
Some agents (Secret Store CSI Driver / External Secrets) call list first. If your role only allows get, you’ll still get 403.


5. Private endpoint DNS (less likely if SP worked before, but quick to verify)
The vault name should resolve to a private IP via privatelink.vaultcore.azure.net.




---

Fast, precise checks (copy/paste with placeholders)

A) Confirm which roles the UAMI actually has at the vault

KV_NAME=<YOUR_KV_NAME>
UAMI_RG=<UAMI_RESOURCE_GROUP>
UAMI_NAME=<UAMI_NAME>

VAULT_ID=$(az keyvault show -n $KV_NAME --query id -o tsv)
# get UAMI ids
read CLIENT_ID PRINCIPAL_ID <<<$(az identity show -g $UAMI_RG -n $UAMI_NAME --query "[clientId,principalId]" -o tsv)
echo "UAMI clientId=$CLIENT_ID  principalId=$PRINCIPAL_ID"

# list role assignments for THIS identity at the VAULT scope
az role assignment list --assignee $PRINCIPAL_ID --scope $VAULT_ID \
  --query "[].{role:roleDefinitionName,scope:scope,roleId:roleDefinitionId}" -o table

👉 If you don’t see Key Vault Secrets User/Officer (or a custom role), that’s the issue.

B) If you see a custom role or you’re unsure it’s data-plane, inspect its permissions

ROLE_DEF_ID=<roleDefinitionId from the previous command>
ROLE_NAME=$(az role definition list --ids $ROLE_DEF_ID --query "[0].roleName" -o tsv)
echo "Role: $ROLE_NAME"
az role definition list --ids $ROLE_DEF_ID --query "[0].permissions[0].dataActions"

You should see Microsoft.KeyVault/vaults/secrets/read (and possibly /delete, /recover, etc.).
If the dataActions array is empty, that role will 403 on secrets.

C) If you need to grant the correct data-plane role

# Grant Key Vault Secrets User (get + list) at vault scope
az role assignment create \
  --assignee $PRINCIPAL_ID \
  --role "Key Vault Secrets User" \
  --scope $VAULT_ID

(Wait a few minutes for propagation.)

D) Quick DNS sanity (optional)

# inside any pod
kubectl exec -it -n <NAMESPACE> <POD> -- sh -c "nslookup ${KV_NAME}.vault.azure.net"
# Expect CNAME to <KV_NAME>.privatelink.vaultcore.azure.net -> Private IP (10.x/172.16/192.168.x)

E) See exactly what Key Vault thinks (Diagnostic logs)

If available, enable Key Vault Diagnostic setting → AuditEvent → Log Analytics and check the record:

identity: should show your UAMI principal/object id

result: Forbidden + reason (e.g., AccessDenied vs ForbiddenByFirewall)



---

TL;DR what I suspect in your case

Because SP “used to work” and now WI gets 403, the most common cause is role mismatch: you granted something like Reader/Key Vault Reader (management plane) to the UAMI. Switch to Key Vault Secrets User (data-plane) at the vault scope and it’ll unblock. If you already have that role, run the commands above and paste the outputs for (A) and (B); we’ll pinpoint the exact field that’s off.

