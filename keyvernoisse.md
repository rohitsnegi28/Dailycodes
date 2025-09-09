
1) Check the obvious

# Correct way to see logs from a container (when it actually starts)
kubectl -n kyverno logs <pod-name> -c kyverno

# Describe to confirm the pull error details
kubectl -n kyverno describe pod <pod-name>

If Events say Back-off pulling image ... it’s an auth/ACR/repository issue.

2) Does the image exist (name/tag correct)?

# From your workstation/Azure CLI context
az acr repository show -n <acrName> --image kyverno/kyverno:v1.9.3
# Or list tags to be sure
az acr repository show-tags -n <acrName> --repository kyverno/kyverno --top 10 --orderby time_desc

If it’s not there, fix the repo/tag or push it.

3) Is the pod using imagePullSecrets (SPN creds) or node identity (Managed Identity)?

# Does the pod reference any imagePullSecrets?
kubectl -n kyverno get pod <pod-name> -o jsonpath='{.spec.imagePullSecrets}{"\n"}'

# Does the ServiceAccount add an imagePullSecret by default?
kubectl -n kyverno get sa <serviceaccount-name-used-by-pod> -o jsonpath='{.imagePullSecrets}{"\n"}'

If you see secrets → you’re using docker registry creds (SPN/user/pass). Check the secret exists and is of type kubernetes.io/dockerconfigjson:


kubectl -n kyverno get secret <secret-name> -o yaml

If no secrets → pull relies on the kubelet identity (Managed Identity on the nodepool/AKS). Continue to step 4.


4) If using Managed Identity, does the kubelet identity have AcrPull on your ACR?

# Get the kubelet identity (clientId/objectId)
az aks show -g <rg> -n <cluster> --query identityProfile.kubeletidentity

# Get the ACR resource ID
az acr show -n <acrName> --query id -o tsv

# Check role assignment
az role assignment list --assignee <kubelet-objectId-or-clientId> --scope <acrResourceId> --query [].roleDefinitionName -o tsv

If AcrPull is missing, grant it:

az role assignment create \
  --assignee <kubelet-objectId-or-clientId> \
  --role AcrPull \
  --scope  <acrResourceId>

> Note: For user-assigned identities on nodepools, ensure the UAMI that kubelet uses is the one with AcrPull.



5) If using imagePullSecrets (SPN creds), did Terraform/changes delete them?

Recreate the secret and reference it:

kubectl -n kyverno create secret docker-registry <secret-name> \
  --docker-server=<acrName>.azurecr.io \
  --docker-username=<spn-appId> \
  --docker-password=<spn-password> \
  --docker-email=placeholder@example.com

# Add it to the ServiceAccount
kubectl -n kyverno patch sa <serviceaccount-name> \
  -p '{"imagePullSecrets": [{"name": "<secret-name>"}]}'

Redeploy or restart the pod.

6) Connectivity/DNS sanity checks (rare but useful)

# Can a node resolve/login server?
kubectl -n kube-system exec -it ds/azure-ip-masq-agent -- nslookup <acrName>.azurecr.io

7) Common gotchas to verify

Login server mismatch: image must be /<repo>:<tag> under exactly <acrName>.azurecr.io.

Wrong tag: v vs no-v (e.g., 1.9.3 vs v1.9.3).

Namespace missing secret: secret must exist in kyverno namespace if you reference it there.

OIDC/Workload Identity: not used for image pulls; kubelet/node identity pulls images. Don’t disable kubelet identity—pulls will fail.



---

Quick read of your screenshot

The error the server doesn't have a resource type "logs" is from kubectl get logs .... Use kubectl logs <pod>.

Events show Pulling then Back-off pulling image for your ACR path → fix image existence and ACR auth (AcrPull on kubelet identity, or recreate imagePullSecret).


If you paste your AKS RG/cluster name style (system- or user-assigned MI) and the exact ACR name + image tag you expect, I’ll map the exact az commands with your IDs filled in.

