
## Quick Identity Detection Commands

```bash
# Quick check for Workload Identity (OIDC)
kubectl get serviceaccount -n akv2k8s -o jsonpath='{range .items[*]}{.metadata.name}: {.metadata.annotations.azure\.workload\.identity/client-id}{"\n"}{end}'

# Quick check for AAD Pod Identity (deprecated)
kubectl get pods -n akv2k8s -o jsonpath='{range .items[*]}{.metadata.name}: {.metadata.annotations.aadpodidbinding}{"\n"}{end}'

# Quick check for Service Principal via Secret
kubectl get pods -n akv2k8s -o jsonpath='{range .items[*]}{.metadata.name}: {.spec.containers[0].env[?(@.name=="AZURE_CLIENT_ID")].value}{"\n"}{end}'

# Quick check for Service Principal Secret references
kubectl get deployment,daemonset -n akv2k8s -o jsonpath='{range .items[*]}{.metadata.name}: {.spec.template.spec.containers[0].env[?(@.valueFrom.secretKeyRef)].valueFrom.secretKeyRef.name}{"\n"}{end}'

# Quick check for User-Assigned Managed Identity via client-id env var
kubectl get pods -n akv2k8s -o jsonpath='{range .items[*]}{.metadata.name}: {.spec.containers[0].env[?(@.name=="AZURE_CLIENT_ID")].value}{"\n"}{end}'

# Quick check for User-Assigned Managed Identity annotation on nodes (for kubelet identity)
kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name}: {.metadata.annotations.azure\.workload\.identity/client-id}{"\n"}{end}'

# Check for Azure AD Application ID in environment variables
kubectl get pods -n akv2k8s -o jsonpath='{range .items[*]}{.metadata.name}: {.spec.containers[0].env[?(@.name=="AAD_SERVICE_PRINCIPAL_CLIENT_ID")].value}{"\n"}{end}'

# Check for MSI endpoint override (indicates User-Assigned MI)
kubectl get pods -n akv2k8s -o jsonpath='{range .items[*]}{.metadata.name}: {.spec.containers[0].env[?(@.name=="MSI_ENDPOINT")].value}{"\n"}{end}'

# Check for Azure credentials in mounted secrets
kubectl get pods -n akv2k8s -o jsonpath='{range .items[*]}{.metadata.name}: {.spec.volumes[?(@.secret)].secret.secretName}{"\n"}{end}'

# Check for federated credentials (Workload Identity)
kubectl get serviceaccount -n akv2k8s -o jsonpath='{range .items[*]}{.metadata.name}: {.metadata.annotations.azure\.workload\.identity/service-account-token-expiration}{"\n"}{end}'

# Check for projected service account tokens (Workload Identity indicator)
kubectl get pods -n akv2k8s -o jsonpath='{range .items[*]}{.metadata.name}: {.spec.volumes[?(@.projected.sources[0].serviceAccountToken)].name}{"\n"}{end}'

# Check deployment/daemonset for identity-related environment variables
kubectl get deployment,daemonset -n akv2k8s -o jsonpath='{range .items[*]}{.kind}/{.metadata.name}: AZURE_CLIENT_ID={.spec.template.spec.containers[0].env[?(@.name=="AZURE_CLIENT_ID")].value}, AZURE_TENANT_ID={.spec.template.spec.containers[0].env[?(@.name=="AZURE_TENANT_ID")].value}{"\n"}{end}'

# Check for legacy AAD Pod Identity CRDs
kubectl get azureidentity,azureidentitybinding -A -o jsonpath='{range .items[*]}{.kind}/{.metadata.name} in {.metadata.namespace}{"\n"}{end}' 2>/dev/null || echo "No AAD Pod Identity CRDs found"
```

## Consolidated One-Liner Check

```bash
# Comprehensive identity check in one command
kubectl get serviceaccount,pods,deployment,daemonset -n akv2k8s -o json | jq -r '
  .items[] | 
  select(.kind == "ServiceAccount") | 
  "SA/" + .metadata.name + ": WI_CLIENT=" + (.metadata.annotations."azure.workload.identity/client-id" // "none") + 
  " WI_USE=" + (.metadata.labels."azure.workload.identity/use" // "none")
  ,
  .items[] | 
  select(.kind == "Pod") | 
  "Pod/" + .metadata.name + ": AAD_BINDING=" + (.metadata.annotations.aadpodidbinding // "none") + 
  " AZURE_CLIENT_ID=" + (.spec.containers[0].env[]? | select(.name=="AZURE_CLIENT_ID") | .value // "none")
'
```

## Identity Method Indicators Summary

### **Workload Identity (OIDC) - Recommended**
- ServiceAccount annotation: `azure.workload.identity/client-id`
- ServiceAccount label: `azure.workload.identity/use: "true"`
- Projected service account token volumes in pods

### **AAD Pod Identity - Deprecated**
- Pod annotation: `aadpodidbinding`
- Presence of `azureidentity` and `azureidentitybinding` CRDs

### **Service Principal with Secret**
- Environment variables: `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`
- Secret references in container env vars

### **User-Assigned Managed Identity**
- Environment variable: `AZURE_CLIENT_ID` (without secret)
- Node annotation: `azure.workload.identity/client-id`
- MSI endpoint override

### **System-Assigned Managed Identity (Kubelet)**
- No identity-specific annotations/labels/env vars
- Default fallback when no other identity is configured

### **Certificate-based Authentication**
- Mounted certificate files
- `AZURE_CLIENT_CERTIFICATE_PATH` environment variable

The absence of all identity-specific configurations indicates the use of the kubelet's system-assigned managed identity.