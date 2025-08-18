#!/bin/bash
# Debugging AKS Workload Identity → Key Vault 403 issues (no azwi required)

# -----------------------
# User Inputs
# -----------------------
RESOURCE_GROUP="<your-rg>"
CLUSTER_NAME="<your-aks-cluster>"
NAMESPACE="<your-namespace>"
SA_NAME="<your-serviceaccount>"
POD_NAME="<your-pod-name>"
UAMI_CLIENT_ID="<your-user-assigned-mi-client-id>"
APP_OBJECT_ID="<your-app-object-id>"   # of the UAMI
KEYVAULT_NAME="<your-keyvault-name>"

echo "===== Step 1: Check OIDC Issuer ====="
az aks show -g $RESOURCE_GROUP -n $CLUSTER_NAME --query "oidcIssuerProfile.issuerUrl" -o tsv

echo -e "\n===== Step 2: Check ServiceAccount Annotations ====="
kubectl get sa $SA_NAME -n $NAMESPACE -o yaml | grep -A5 "annotations"

echo -e "\n===== Step 3: Check Pod Environment Variables ====="
kubectl exec -n $NAMESPACE $POD_NAME -- printenv | grep AZURE

echo -e "\n===== Step 4: Inspect Projected Token (first 200 chars) ====="
kubectl exec -n $NAMESPACE $POD_NAME -- cat /var/run/secrets/azure/tokens/azure-identity-token | head -c 200
echo -e "\n(Token truncated above)"

# Save token locally for decoding
kubectl exec -n $NAMESPACE $POD_NAME -- cat /var/run/secrets/azure/tokens/azure-identity-token > token.jwt
echo -e "\nToken saved as token.jwt"

echo -e "\n===== Step 4a: Decode JWT Claims ====="
PAYLOAD=$(cat token.jwt | cut -d "." -f2 | base64 -d 2>/dev/null)
echo $PAYLOAD | jq .

echo -e "\n===== Step 5: Check Federated Credentials in Entra ID ====="
az ad app federated-credential list --id $APP_OBJECT_ID -o table

echo -e "\n===== Step 6: Check RBAC Assignment on Key Vault ====="
KV_ID=$(az keyvault show -n $KEYVAULT_NAME --query id -o tsv)
az role assignment list --assignee $UAMI_CLIENT_ID --scope $KV_ID -o table