# Kubernetes Image Pull Debugging Guide
## Troubleshooting After SPN to Managed Identity Migration

### Overview
This guide helps debug image pull errors that occur after migrating from Service Principal (SPN) to Managed Identity authentication in AKS clusters.

---

## 1. Check Current Authentication Method

### 1.1 Verify Cluster Identity Type
```bash
# Check what identity type your AKS cluster is using
az aks show --resource-group <resource-group-name> --name <cluster-name> --query "identity"

# Check if managed identity is enabled
az aks show --resource-group <resource-group-name> --name <cluster-name> --query "identity.type"

# Get the managed identity details
az aks show --resource-group <resource-group-name> --name <cluster-name> --query "identityProfile"
```

### 1.2 Check Node Identity
```bash
# Connect to your cluster
az aks get-credentials --resource-group <resource-group-name> --name <cluster-name>

# Check what identity the nodes are using
kubectl get nodes -o wide

# Describe a node to see identity information
kubectl describe node <node-name> | grep -i identity

# Check kubelet configuration on nodes (if you have access)
kubectl get nodes -o yaml | grep -A 10 -B 10 identity
```

---

## 2. Examine Image Pull Errors

### 2.1 Check Pod Status and Events
```bash
# List all pods with image pull errors
kubectl get pods --all-namespaces | grep -E "ImagePullBackOff|ErrImagePull"

# Get detailed information about failing pods
kubectl describe pod <pod-name> -n <namespace>

# Check events for image pull errors
kubectl get events --all-namespaces --sort-by='.lastTimestamp' | grep -i "pull\|image"

# Filter events for specific namespaces (QS and IS2 in your case)
kubectl get events -n <qs-namespace> --sort-by='.lastTimestamp'
kubectl get events -n <is2-namespace> --sort-by='.lastTimestamp'
```

### 2.2 Check Container Registry Access
```bash
# Check if pods can access the registry
kubectl run debug-pod --image=busybox --rm -it --restart=Never -- sh
# Inside the pod, try:
# nslookup <your-registry-name>.azurecr.io
# exit

# Test registry connectivity from a debug pod
kubectl run registry-test --image=alpine --rm -it --restart=Never -- sh
# Inside: wget -O- https://<your-registry-name>.azurecr.io/v2/
```

---

## 3. Compare Authentication Between Environments

### 3.1 Check ACR Integration Status
```bash
# Check if ACR integration is enabled for your AKS cluster
az aks check-acr --resource-group <resource-group-name> --name <cluster-name> --acr <acr-name>

# List ACR repositories to verify access
az acr repository list --name <acr-name>

# Check ACR login server
az acr show --resource-group <acr-resource-group> --name <acr-name> --query "loginServer"
```

### 3.2 Compare Identity Assignments Between Dev and UAT
```bash
# Get managed identity information for DEV environment
az aks show --resource-group <dev-rg> --name <dev-cluster-name> --query "identityProfile.kubeletidentity"

# Get managed identity information for UAT environment  
az aks show --resource-group <uat-rg> --name <uat-cluster-name> --query "identityProfile.kubeletidentity"

# Check role assignments for the kubelet managed identity (DEV)
DEV_KUBELET_IDENTITY=$(az aks show --resource-group <dev-rg> --name <dev-cluster-name> --query "identityProfile.kubeletidentity.objectId" -o tsv)
az role assignment list --assignee $DEV_KUBELET_IDENTITY --all

# Check role assignments for the kubelet managed identity (UAT)
UAT_KUBELET_IDENTITY=$(az aks show --resource-group <uat-rg> --name <uat-cluster-name> --query "identityProfile.kubeletidentity.objectId" -o tsv)
az role assignment list --assignee $UAT_KUBELET_IDENTITY --all
```

---

## 4. Verify ACR Permissions

### 4.1 Check Required Role Assignments
```bash
# Get your ACR resource ID
ACR_RESOURCE_ID=$(az acr show --resource-group <acr-rg> --name <acr-name> --query "id" --output tsv)

# Check if kubelet identity has AcrPull role on ACR (UAT)
az role assignment list --scope $ACR_RESOURCE_ID --assignee $UAT_KUBELET_IDENTITY

# Create role assignment if missing (UAT)
az role assignment create --assignee $UAT_KUBELET_IDENTITY --scope $ACR_RESOURCE_ID --role acrpull

# Verify the assignment was created
az role assignment list --scope $ACR_RESOURCE_ID --assignee $UAT_KUBELET_IDENTITY --query "[].{principalName:principalName,roleDefinitionName:roleDefinitionName}"
```

### 4.2 Check Network Access
```bash
# Test network connectivity to ACR from cluster
kubectl run network-test --image=busybox --rm -it --restart=Never -- nslookup <acr-name>.azurecr.io

# Check if private endpoints are configured
az acr show --resource-group <acr-rg> --name <acr-name> --query "networkRuleSet"

# Test HTTPS connectivity
kubectl run curl-test --image=curlimages/curl --rm -it --restart=Never -- curl -I https://<acr-name>.azurecr.io
```

---

## 5. Check Image Pull Secrets and Service Accounts

### 5.1 Examine Service Accounts
```bash
# Check default service account in problematic namespaces
kubectl get serviceaccount default -n <qs-namespace> -o yaml
kubectl get serviceaccount default -n <is2-namespace> -o yaml

# Check for image pull secrets
kubectl get secrets --all-namespaces | grep -E "docker|registry"

# Compare service accounts between dev and UAT
kubectl get serviceaccount --all-namespaces -o yaml > uat-serviceaccounts.yaml
```

### 5.2 Check Pod Service Account Usage
```bash
# Check what service account your failing pods are using
kubectl get pod <failing-pod-name> -n <namespace> -o yaml | grep -A 5 serviceAccount

# Check if the service account has the right permissions
kubectl auth can-i create pods --as=system:serviceaccount:<namespace>:<service-account-name>
```

---

## 6. Diagnose Kubelet Configuration

### 6.1 Check Kubelet Logs
```bash
# Get kubelet logs from a node (if you have node access)
kubectl get nodes
kubectl describe node <node-name>

# If you have SSH access to nodes, check kubelet logs
# ssh to node and run: journalctl -u kubelet -f

# Alternative: Use a privileged pod to access node logs
kubectl apply -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: node-debugger
spec:
  nodeName: <node-name>
  hostPID: true
  hostIPC: true
  hostNetwork: true
  containers:
  - name: debug
    image: busybox
    command: ["sleep", "3600"]
    securityContext:
      privileged: true
    volumeMounts:
    - name: host
      mountPath: /host
  volumes:
  - name: host
    hostPath:
      path: /
EOF

# Access the pod and check logs
kubectl exec -it node-debugger -- chroot /host journalctl -u kubelet --no-pager -l
```

---

## 7. Force Refresh and Troubleshooting Steps

### 7.1 Refresh Cluster Credentials
```bash
# Update AKS cluster credentials
az aks get-credentials --resource-group <resource-group-name> --name <cluster-name> --overwrite-existing

# Restart kubelet on nodes (this will cause brief downtime)
kubectl get nodes
# Cordon and drain nodes one by one, then restart them
kubectl cordon <node-name>
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data
# Restart the node through Azure portal or CLI
kubectl uncordon <node-name>
```

### 7.2 Test Image Pull Manually
```bash
# Create a test pod to verify image pull works
kubectl run test-image-pull --image=<your-acr-name>.azurecr.io/<image-name>:<tag> --rm -it --restart=Never

# Check the pod status
kubectl describe pod test-image-pull

# Clean up
kubectl delete pod test-image-pull --ignore-not-found
```

---

## 8. Environment Comparison Checklist

Create a comparison table by running these commands in both environments:

```bash
# Environment Info Script
echo "=== ENVIRONMENT COMPARISON ==="
echo "Environment: [DEV/UAT]"
echo "Cluster Name: $(kubectl config current-context)"
echo

echo "=== Identity Configuration ==="
az aks show --resource-group <rg> --name <cluster> --query "identity.type"
az aks show --resource-group <rg> --name <cluster> --query "identityProfile.kubeletidentity.objectId"

echo "=== ACR Integration ==="
az aks check-acr --resource-group <rg> --name <cluster> --acr <acr-name>

echo "=== Role Assignments ==="
IDENTITY_ID=$(az aks show --resource-group <rg> --name <cluster> --query "identityProfile.kubeletidentity.objectId" -o tsv)
az role assignment list --assignee $IDENTITY_ID --query "[].{scope:scope,role:roleDefinitionName}"

echo "=== Failing Pods Count ==="
kubectl get pods --all-namespaces | grep -c -E "ImagePullBackOff|ErrImagePull"

echo "=== Network Connectivity ==="
kubectl run connectivity-test --image=busybox --rm -it --restart=Never -- nslookup <acr-name>.azurecr.io
```

---

## 9. Common Solutions

### 9.1 Fix Missing Role Assignment
```bash
# Assign AcrPull role to kubelet managed identity
KUBELET_IDENTITY=$(az aks show --resource-group <rg> --name <cluster> --query "identityProfile.kubeletidentity.objectId" -o tsv)
ACR_ID=$(az acr show --resource-group <acr-rg> --name <acr-name> --query "id" -o tsv)
az role assignment create --assignee $KUBELET_IDENTITY --scope $ACR_ID --role acrpull
```

### 9.2 Re-enable ACR Integration
```bash
# Attach ACR to AKS cluster using managed identity
az aks update --resource-group <rg> --name <cluster> --attach-acr <acr-name>
```

### 9.3 Restart Affected Workloads
```bash
# Restart deployments in affected namespaces
kubectl rollout restart deployment --all -n <qs-namespace>
kubectl rollout restart deployment --all -n <is2-namespace>

# Check rollout status
kubectl rollout status deployment --all -n <qs-namespace>
kubectl rollout status deployment --all -n <is2-namespace>
```

---

## 10. Prevention and Best Practices

1. **Always test managed identity setup** in a dev environment first
2. **Verify role assignments** before applying Terraform changes
3. **Use `az aks check-acr`** command to verify ACR integration
4. **Monitor cluster events** after authentication changes
5. **Document identity configurations** in your Terraform code
6. **Set up alerts** for image pull failures

---

## Quick Debug Commands Summary

```bash
# Quick status check
kubectl get pods --all-namespaces | grep -E "ImagePullBackOff|ErrImagePull"
az aks check-acr --resource-group <rg> --name <cluster> --acr <acr-name>

# Check identity and permissions
az aks show --resource-group <rg> --name <cluster> --query "identityProfile"
IDENTITY_ID=$(az aks show --resource-group <rg> --name <cluster> --query "identityProfile.kubeletidentity.objectId" -o tsv)
az role assignment list --assignee $IDENTITY_ID

# Fix common issue
az role assignment create --assignee $IDENTITY_ID --scope $(az acr show --name <acr-name> --query "id" -o tsv) --role acrpull
```

Use this guide to systematically identify and resolve the authentication differences between your dev and UAT environments.