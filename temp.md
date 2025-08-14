8
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



