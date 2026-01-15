# Azure Workload Identity Tutorial

This guide walks through wiring Kubernetes workloads to use Azure Workload Identity using a user-assigned managed identity (UAMI). Fill in the placeholders with values specific to your environment.

---

## 0. Get the UAMI Client ID (once)

If you already know the client ID, skip this step. Otherwise:

```bash
# Azure CLI
UAMI_CLIENT_ID=$(az identity show -g <RESOURCE_GROUP> -n <UAMI_NAME> --query clientId -o tsv)
echo $UAMI_CLIENT_ID
```

If using Terraform:

```bash
UAMI_CLIENT_ID=$(terraform output -raw secrets_identity_client_id)
```

---

## 1. Annotate the ServiceAccount (required)

Set the following variables for each workload:

```bash
NS=<namespace>                 # e.g. webui-internal or api
SA=<serviceaccount-name>       # e.g. default or your custom SA

kubectl annotate serviceaccount $SA -n $NS \
  azure.workload.identity/client-id=$UAMI_CLIENT_ID --overwrite
```

---

## 2. Opt-in the Pod Template (label)

Apply to each controller that creates pods. For a **Deployment**:

```bash
DEPLOY=<deployment-name>

# add WI label to the pod template
kubectl patch deploy $DEPLOY -n $NS \
  -p '{"spec":{"template":{"metadata":{"labels":{"azure.workload.identity/use":"true"}}}}}'
```

> For StatefulSet: replace `deploy` with `statefulset`.
> For Job/CronJob: patch the `.spec.template.metadata.labels` similarly.

---

## 3. Let the SDK Pick the Right Identity (env)

```bash
# set AZURE_CLIENT_ID on all containers in the deployment
kubectl set env deployment/$DEPLOY -n $NS AZURE_CLIENT_ID=$UAMI_CLIENT_ID
```

> For a specific container, add `--containers <container-name>`.

---

## 4. Restart and Verify

```bash
kubectl rollout restart deploy/$DEPLOY -n $NS
kubectl rollout status  deploy/$DEPLOY -n $NS

# SA should now show the annotation
kubectl describe sa $SA -n $NS | sed -n '1,120p'

# pick a running pod and verify token projection + audience
POD=$(kubectl get po -n $NS -l app=$DEPLOY -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n $NS $POD -- ls /var/run/secrets/azure/tokens
kubectl exec -n $NS $POD -- sh -c "cat /var/run/secrets/azure/tokens/azure-identity-token | jq -r '.aud,.iss,.sub'"
# expect aud=api://AzureADTokenExchange and sub=system:serviceaccount:<ns>:<sa>
```

---

## Do It for Both Workloads Quickly

```bash
# WebUI
NS=webui-internal
SA=default                     # or your SA name
DEPLOY=<webui-deploy-name>
kubectl annotate sa $SA -n $NS azure.workload.identity/client-id=$UAMI_CLIENT_ID --overwrite
kubectl patch deploy $DEPLOY -n $NS -p '{"spec":{"template":{"metadata":{"labels":{"azure.workload.identity/use":"true"}}}}}'
kubectl set env deployment/$DEPLOY -n $NS AZURE_CLIENT_ID=$UAMI_CLIENT_ID
kubectl rollout restart deploy/$DEPLOY -n $NS

# API
NS=api
SA=<api-sa>
DEPLOY=<api-deploy-name>
kubectl annotate sa $SA -n $NS azure.workload.identity/client-id=$UAMI_CLIENT_ID --overwrite
kubectl patch deploy $DEPLOY -n $NS -p '{"spec":{"template":{"metadata":{"labels":{"azure.workload.identity/use":"true"}}}}}'
kubectl set env deployment/$DEPLOY -n $NS AZURE_CLIENT_ID=$UAMI_CLIENT_ID
kubectl rollout restart deploy/$DEPLOY -n $NS
```

---

## Long-Term Management Options

* **Helm (recommended)**: template these from a value such as `.Values.uamiClientId`:
  * ServiceAccount annotation: `azure.workload.identity/client-id: {{ .Values.uamiClientId }}`
  * Pod template label: `azure.workload.identity/use: "true"`
  * Environment variable: `AZURE_CLIENT_ID={{ .Values.uamiClientId }}`

  Deploy with:
  ```bash
  helm upgrade --install <release> <chart> \
    --set uamiClientId="$UAMI_CLIENT_ID"
  ```

* **Kustomize/Manifests**: bake the same fields into YAML overlays.
* **kubectl-only**: use the patch/set-env commands above during your pipeline.

This approach lets your pipeline create the UAMI and inject the client ID into your manifests in the same run—no manual post-step.

---

## Troubleshooting

If anything fails after following these steps, gather the following information:

* `kubectl describe sa <sa> -n <ns>`
* `kubectl describe pod <pod> -n <ns>`
* The federated credential (issuer/subject/audience)

Sharing these details helps identify mismatches quickly.

---

## Additional: Discover Cluster Resources

Use these commands to explore your cluster and verify configurations:

```bash
# namespaces
kubectl get ns

# service accounts in a namespace
kubectl get sa -n <NAMESPACE>

# detailed view of one service account
kubectl describe sa <SERVICE_ACCOUNT> -n <NAMESPACE>

# workloads in a namespace
kubectl get deploy,statefulset,job,cronjob -n <NAMESPACE>

# pods (to verify later)
kubectl get pods -n <NAMESPACE> -o wide
```

---

Repeat the wiring steps for each workload (API and WebUI) as needed.
