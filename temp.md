 All the steps for diagnosing and verifying the identity used by akv2k8s.
Diagnosing and Verifying akv2k8s Identity in AKS
This document provides a complete guide to determine which Azure identity an akv2k8s installation is using in Azure Kubernetes Service (AKS). The process involves a step-by-step elimination to identify the method and then verification to ensure it's configured correctly.
There are three possible identity configurations for akv2k8s:
 * Azure Workload Identity: The modern, recommended approach that binds a Kubernetes Service Account to an Azure AD identity.
 * AAD Pod Identity: The legacy approach that uses labels to associate pods with an Azure AD identity.
 * Kubelet Managed Identity (Fallback): The default behavior where akv2k8s uses the underlying AKS node's managed identity.
Step 1: Check for Workload Identity
First, inspect the akv2k8s service accounts for the specific annotation that enables Workload Identity.
# Replace 'akv2k8s' if your installation uses a different namespace
kubectl describe serviceaccount -n akv2k8s

What to look for:
Examine the Annotations section for the akv2k8s-controller and akv2k8s-env-injector service accounts.
 * ✅ If Workload Identity is used, you will see the azure.workload.identity/client-id annotation:
   Name:                akv2k8s-controller
Namespace:           akv2k8s
Labels:              <none>
Annotations:         azure.workload.identity/client-id: 12345678-abcd-1234-ab12-123456abcdef
Image pull secrets:  <none>
Mountable secrets:   <none>
Tokens:              <none>
Events:              <none>

 * ❌ If Workload Identity is NOT used, this annotation will be missing:
   Name:                akv2k8s-akv2k8s-controller
Namespace:           akv2k8s
Labels:              app.kubernetes.io/instance=akv2k8s-akv2k8s
                     ...
Annotations:         meta.helm.sh/release-name: akv2k8s-akv2k8s
                     meta.helm.sh/release-namespace: akv2k8s

Conclusion: If the annotation is present, you are using Workload Identity. If not, proceed to the next step.
Step 2: Check for AAD Pod Identity
If Workload Identity is not configured, check the akv2k8s pods for the label used by AAD Pod Identity.
# Replace 'akv2k8s' if your installation uses a different namespace
kubectl get pods -n akv2k8s --show-labels

What to look for:
Examine the LABELS column for the controller and injector pods.
 * ✅ If AAD Pod Identity is used, you will see the aadpodidbinding label:
   NAME                                  READY   STATUS    RESTARTS   AGE   LABELS
akv2k8s-controller-5b795b4874-fzxtm   1/1     Running   0          40h   aadpodidbinding=akv2k8s-identity-binding,app...

 * ❌ If AAD Pod Identity is NOT used, this label will be missing:
   NAME                                  READY   STATUS    RESTARTS   AGE   LABELS
akv2k8s-controller-5b795b4874-fzxtm   1/1     Running   0          40h   app.kubernetes.io/component=controller,app...

Conclusion: If the label is present, you are using AAD Pod Identity. If not, your system is using the fallback identity.
Step 3: Confirming the Kubelet Managed Identity
If you have completed the first two steps and found no specific configurations, akv2k8s is using the Kubelet Managed Identity. Here is how to verify its setup is correct.
Part A: Verify Configuration in Azure
First, find the identity and then check its permissions on the Key Vault.
1. Find the Kubelet Identity's Object ID
The Kubelet Identity is the user-assigned managed identity associated with the cluster's Virtual Machine Scale Set (VMSS).
# Replace with your resource group and cluster name
az aks show -g <your-resource-group> -n <your-cluster-name> --query identityProfile.kubeletidentity.objectId -o tsv

This command will output the Object ID (also called Principal ID) of the identity.
2. Check Key Vault Access Policies
Confirm this identity has get and list permissions for secrets in your Key Vault.
# Get the Object ID from the previous command
KUBELET_ID=$(az aks show -g <your-resource-group> -n <your-cluster-name> --query identityProfile.kubeletidentity.objectId -o tsv)

# Check the Key Vault's access policy for that ID
az keyvault show --name <your-key-vault-name> --query "properties.accessPolicies[?objectId=='$KUBELET_ID'].permissions.secrets"

The expected output is ["get", "list"]. If the output is empty or null, the permissions are missing and must be added in the Key Vault's "Access policies" blade.
Part B: Verify from within the AKS Cluster
Check the status of the akv2k8s resources and logs to see if authentication is working.
1. Check the AzureKeyVaultSecret Resource Status
This is the best indicator of success. Check the status of a secret that akv2k8s is supposed to sync.
# Replace with the name of your synced secret and its namespace
kubectl get akvs <your-akvs-secret-name> -n <your-namespace> -o yaml

In the output, look at the status section. synced: true with a recent lastSyncTime means it is working correctly. An error message here will point to the problem.
2. Check the Controller Logs
The controller logs provide real-time feedback on the sync process.
# This command automatically finds and shows logs for the controller pod
kubectl logs -n akv2k8s -l app.kubernetes.io/component=controller

Look for messages like Successfully synced AzureKeyVaultSecret. If you see errors like ManagedIdentityCredential authentication failed or Access denied, it confirms an issue with the Kubelet Identity's permissions.
