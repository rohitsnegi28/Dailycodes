68
1) Check the ServiceAccount wiring

# list SAs in your namespace
kubectl get sa -n <NAMESPACE>

# show the SA you expect the pod to use
kubectl get sa <SERVICE_ACCOUNT> -n <NAMESPACE> -o yaml | sed -n '1,120p'
# ✅ Look for:
# annotations:
#   azure.workload.identity/client-id: <UAMI_CLIENT_ID>

2) Check your Deployment’s pod template (labels, SA, env)

# Which SA is your deployment using? Is WI label present?
kubectl get deploy <DEPLOYMENT> -n <NAMESPACE> \
  -o jsonpath='{.spec.template.spec.serviceAccountName}{"\n"}{.spec.template.metadata.labels}{"\n"}{.spec.template.spec.automountServiceAccountToken}{"\n"}'

# Do containers have AZURE_CLIENT_ID?
kubectl set env deployment/<DEPLOYMENT> -n <NAMESPACE> --list | grep AZURE_CLIENT_ID

✅ You want:

serviceAccountName = <SERVICE_ACCOUNT> (matches your federated credential’s subject)

labels include: azure.workload.identity/use: true

automountServiceAccountToken not set to false (if it’s false, that breaks WI)

AZURE_CLIENT_ID is set to your UAMI client ID


3) Check the Workload Identity webhook is active

kubectl get mutatingwebhookconfigurations | grep -i workload
kubectl get pods -A | grep -i workload-identity

(You should see the WI mutating webhook installed/ready.)

4) Inspect the crashing pod without exec

# pick the newest pod for the deployment
POD=$(kubectl get pods -n <NAMESPACE> -l app=<DEPLOYMENT> \
  -o jsonpath='{.items[-1].metadata.name}')

# see events + injected volumes
kubectl describe pod $POD -n <NAMESPACE> | sed -n '1,200p'

# get previous container logs (from the last crash)
kubectl logs $POD -n <NAMESPACE> --previous

✅ In describe, look for a projected volume named like azure-identity-token mounted at
/var/run/secrets/azure/tokens. If that volume/mount is missing, the webhook didn’t inject → wiring issue.

5) Patch fixes (if anything above is missing)

5a) Annotate the ServiceAccount (idempotent)

kubectl annotate sa <SERVICE_ACCOUNT> -n <NAMESPACE> \
  azure.workload.identity/client-id=<UAMI_CLIENT_ID> --overwrite

5b) Add the opt-in label to the Deployment’s pod template

kubectl patch deploy <DEPLOYMENT> -n <NAMESPACE> \
  -p '{"spec":{"template":{"metadata":{"labels":{"azure.workload.identity/use":"true"}}}}}'

5c) Ensure AZURE_CLIENT_ID env is present

kubectl set env deployment/<DEPLOYMENT> -n <NAMESPACE> AZURE_CLIENT_ID=<UAMI_CLIENT_ID>

5d) Remove/flip automount=false if present

# if you saw 'automountServiceAccountToken: false', turn it on
kubectl patch deploy <DEPLOYMENT> -n <NAMESPACE> \
  -p '{"spec":{"template":{"spec":{"automountServiceAccountToken": true}}}}'

5e) Roll the pods

kubectl rollout restart deploy/<DEPLOYMENT> -n <NAMESPACE>
kubectl rollout status  deploy/<DEPLOYMENT> -n <NAMESPACE>

6) Create a one-off smoke pod to validate WI (no app needed)

This lets you check token projection even if your app keeps crashing.

kubectl run wi-smoke -n <NAMESPACE> \
  --image=busybox --restart=Never --command -- sleep 3600 \
  --overrides '{
    "apiVersion":"v1",
    "metadata":{"labels":{"azure.workload.identity/use":"true"}},
    "spec":{
      "serviceAccountName":"<SERVICE_ACCOUNT>",
      "automountServiceAccountToken": true,
      "containers":[{"name":"box","image":"busybox","args":["sleep","3600"],
        "env":[{"name":"AZURE_CLIENT_ID","value":"<UAMI_CLIENT_ID>"}]}]
    }}'
# check the token was injected
kubectl exec -n <NAMESPACE> wi-smoke -- ls /var/run/secrets/azure/tokens
kubectl exec -n <NAMESPACE> wi-smoke -- sh -c "cat /var/run/secrets/azure/tokens/azure-identity-token | head -c 60 && echo"

If wi-smoke has the token file, your WI wiring is good; then focus back on your app’s code/permissions.
If it doesn’t, re-check SA annotation, pod label, serviceAccountName, and webhook.

7) Double-check the federated credential “subject” matches

# Should be exactly:
system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>

Any mismatch in namespace or SA name prevents the exchange.


---

Fill <NAMESPACE>, <SERVICE_ACCOUNT>, <DEPLOYMENT>, and <UAMI_CLIENT_ID> with your values and run these.
Tell me which step first fails (missing label/env, no projected token, automount=false, etc.), and I’ll zero in on the fix.



Got it — since you’ve already annotated the ServiceAccount, the second step is to make sure your Deployment’s pod template:

1. Uses that ServiceAccount (probably default in your case).


2. Has the Workload Identity opt-in label.


3. Has AZURE_CLIENT_ID set so your app picks the right identity.



Here are the exact commands:


---

1️⃣ Set the Deployment to use the ServiceAccount

kubectl patch deploy <DEPLOYMENT_NAME> -n webui-internal \
  -p '{"spec":{"template":{"spec":{"serviceAccountName":"default"}}}}'


---

2️⃣ Add the Workload Identity label to the pod template

kubectl patch deploy <DEPLOYMENT_NAME> -n webui-internal \
  -p '{"spec":{"template":{"metadata":{"labels":{"azure.workload.identity/use":"true"}}}}}'


---

3️⃣ Set the AZURE_CLIENT_ID environment variable

kubectl set env deployment/<DEPLOYMENT_NAME> -n webui-internal AZURE_CLIENT_ID=<UAMI_CLIENT_ID>

Replace <UAMI_CLIENT_ID> with your secrets identity’s client ID.


---

4️⃣ Restart the deployment to apply changes

kubectl rollout restart deploy/<DEPLOYMENT_NAME> -n webui-internal
kubectl rollout status  deploy/<DEPLOYMENT_NAME> -n webui-internal


---

Once this is done, your pods should:

Run as the annotated ServiceAccount.

Get the projected /var/run/secrets/azure/tokens/azure-identity-token file.

Use the correct UAMI to access Key Vault.


Do you want me to give you the same set of commands for your api namespace deployment as well so both workloads are wired identically?






----------



Here’s your full debug + wiring checklist in Markdown format with all sensitive values replaced by placeholders.


---

AKS Workload Identity Debug & Wiring Checklist

0️⃣ Check Deployment Spec

# Show ServiceAccount name, labels, automount flag
kubectl get deploy <DEPLOYMENT_NAME> -n <NAMESPACE> \
  -o jsonpath='{.spec.template.spec.serviceAccountName}{"\n"}{.spec.template.metadata.labels}{"\n"}{.spec.template.spec.automountServiceAccountToken}{"\n"}'

# Show if AZURE_CLIENT_ID env is set
kubectl set env deployment/<DEPLOYMENT_NAME> -n <NAMESPACE> --list | grep AZURE_CLIENT_ID || true

✅ Expect:

serviceAccountName = <SERVICE_ACCOUNT> (matches FC subject)

Labels include "azure.workload.identity/use":"true"

automountServiceAccountToken is true or blank

AZURE_CLIENT_ID is set to <UAMI_CLIENT_ID>



---

1️⃣ Ensure Deployment is Wired Correctly

# Set serviceAccountName & automount token
kubectl patch deploy <DEPLOYMENT_NAME> -n <NAMESPACE> \
  -p '{"spec":{"template":{"spec":{"serviceAccountName":"<SERVICE_ACCOUNT>","automountServiceAccountToken":true}}}}'

# Add Workload Identity label
kubectl patch deploy <DEPLOYMENT_NAME> -n <NAMESPACE> \
  -p '{"spec":{"template":{"metadata":{"labels":{"azure.workload.identity/use":"true"}}}}}'

# Set AZURE_CLIENT_ID env
kubectl set env deployment/<DEPLOYMENT_NAME> -n <NAMESPACE> AZURE_CLIENT_ID=<UAMI_CLIENT_ID>

# Restart deployment
kubectl rollout restart deploy/<DEPLOYMENT_NAME> -n <NAMESPACE>
kubectl rollout status  deploy/<DEPLOYMENT_NAME> -n <NAMESPACE>


---

2️⃣ Verify Workload Identity Webhook

kubectl get mutatingwebhookconfigurations | grep -i workload || true
kubectl get pods -A | grep -i workload-identity || true

✅ You should see Azure Workload Identity webhook resources and pods running.


---

3️⃣ Test Token Injection With a Smoke Pod

kubectl run wi-smoke -n <NAMESPACE> \
  --image=busybox --restart=Never --command -- sleep 600 \
  --overrides '{
    "apiVersion":"v1",
    "metadata":{"labels":{"azure.workload.identity/use":"true"}},
    "spec":{
      "serviceAccountName":"<SERVICE_ACCOUNT>",
      "automountServiceAccountToken": true,
      "containers":[{"name":"box","image":"busybox","args":["sleep","600"],
        "env":[{"name":"AZURE_CLIENT_ID","value":"<UAMI_CLIENT_ID>"}]}]
    }}'

# Check token exists
kubectl exec -n <NAMESPACE> wi-smoke -- ls /var/run/secrets/azure/tokens

# View token contents (issuer, subject, audience)
kubectl exec -n <NAMESPACE> wi-smoke -- sh -c 'cat /var/run/secrets/azure/tokens/azure-identity-token'

✅ Expect:

iss = <AKS_OIDC_ISSUER_URL> (matches FC issuer)

sub = system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>

aud includes api://AzureADTokenExchange



---

4️⃣ Confirm Federated Credential in Azure

# Get AKS OIDC issuer
ISSUER=$(az aks show -g <AKS_RESOURCE_GROUP> -n <AKS_CLUSTER_NAME> --query oidcIssuerProfile.issuerUrl -o tsv)
echo "$ISSUER"

# List FCs on UAMI
az identity federated-credential list -g <UAMI_RESOURCE_GROUP> -n <UAMI_NAME> -o table

# Show details for a specific FC
az identity federated-credential show \
  -g <UAMI_RESOURCE_GROUP> -n <UAMI_NAME> \
  --federated-credential-name <FC_NAME> \
  --query "{issuer:properties.issuer,subject:properties.subject,audience:properties.audience}"

✅ Expect:

issuer matches $ISSUER

subject = system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>

audience includes api://AzureADTokenExchange



---

5️⃣ Check Logs for CrashLoopBackOff

# Get pod name
POD=$(kubectl get pods -n <NAMESPACE> -l app=<APP_LABEL> -o jsonpath='{.items[0].metadata.name}')

# Previous logs (before restart)
kubectl logs $POD -n <NAMESPACE> --previous || true

# Pod description (look for projected volume "azure-identity-token")
kubectl describe pod $POD -n <NAMESPACE> | sed -n '1,220p'


---

6️⃣ Network / Private Endpoint DNS Check

(Only if RBAC & token injection are good)

kubectl run dnscheck -n <NAMESPACE> --image=busybox --restart=Never --command -- sh -c "sleep 300"
kubectl exec -n <NAMESPACE> dnscheck -- nslookup <KEYVAULT_NAME>.vault.azure.net
kubectl delete pod dnscheck -n <NAMESPACE> --ignore-not-found

✅ Expect:

CNAME to <KEYVAULT_NAME>.privatelink.vaultcore.azure.net

Private IP in your VNet range



---

What the Results Mean

Smoke pod token file present & correct iss/sub/aud → Workload Identity wiring is OK → If still 403, check Key Vault RBAC, role scope, and network.

Smoke pod missing token file → Wiring issue (labels, SA annotation, automount, webhook).

Token OK but DNS resolves to public IP → Private Endpoint/DNS issue.

App crashes but smoke pod OK → App crash unrelated to Workload Identity (check logs).



---

Do you want me to also make you a minimal Helm values/YAML template so this wiring is always applied automatically during deploys? That would prevent these manual patch steps in the future.



kubectl run dns-test --rm -it --image=mcr.microsoft.com/aks/fundamental/base-ubuntu:v0.0.11 -- bash
apt update && apt install -y dnsutils
nslookup mif-cc-fasat-dev2-akv.vault.azure.net




Looks like your kubectl run dns-test command is timing out before it can start the pod.
That usually happens if:

1. Image pull takes too long – mcr.microsoft.com/aks/fundamental/base-ubuntu:v0.0.11 can be slow to pull on the first run.


2. Cluster has no outbound internet – since your AKS might be in a private network without an outbound route to mcr.microsoft.com.



Since your AKS is in a private VNet with a Key Vault private endpoint, there's a good chance the pod cannot pull images from the internet unless you have:

An Azure Container Registry inside the VNet or

A Microsoft Container Registry FQDN allowed via a firewall/proxy.



---

Two ways to test DNS without external image pulls

Option 1 – Use an image already in your cluster If you already have any running pod in that namespace, you can exec into it:

kubectl exec -it <pod-name> -n webui-internal -- sh
nslookup mif-cc-fasat-dev2-akv.vault.azure.net

Option 2 – Use busybox from AKS addon images

kubectl run dns-test --image=busybox:1.28 --restart=Never -it --rm -- nslookup mif-cc-fasat-dev2-akv.vault.azure.net

If even busybox can’t be pulled, then you’ll need to use an existing container in your cluster for the DNS test.


---

If this DNS check returns a private IP (10.x.x.x), DNS is fine and your CrashLoopBackOff is likely an identity or token binding issue.
If it returns a public IP, then the pod is bypassing your private DNS zone.

Do you want me to give you a quick portal-only way to confirm DNS without touching pods? That could avoid these pull issues entirely.





