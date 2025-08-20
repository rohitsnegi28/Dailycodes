Totally fine — you don’t need the Flux CLI on your laptop to fix this.
Everything below uses only kubectl (plus normal Git PRs if you want to make it permanent).


---

What you can do without Flux CLI

A) Hot-fix now with kubectl only (no Flux, no helm)

1. Create the ServiceAccount (the exact name your Deployment expects) and add MI annotations:



# If your controller Deployment expects "akv2k8s-akv2k8s-controller"
kubectl -n akv2k8s create serviceaccount akv2k8s-akv2k8s-controller

# Annotate with your Managed Identity (clientId/tenantId)
kubectl -n akv2k8s annotate sa akv2k8s-akv2k8s-controller \
  azure.workload.identity/client-id=<UAMI_CLIENT_ID> \
  azure.workload.identity/tenant-id=<TENANT_ID> --overwrite

2. Restart the controller & injector so they pick up the SA:



kubectl -n akv2k8s rollout restart deploy/akv2k8s-akv2k8s-controller   || true
kubectl -n akv2k8s rollout restart deploy/akv2k8s-akv2k8s-envinjector || true
kubectl -n akv2k8s rollout status  deploy/akv2k8s-akv2k8s-envinjector

3. Validate it’s using MI (not SPN):



# SA annotations present?
kubectl -n akv2k8s get sa akv2k8s-akv2k8s-controller -o yaml | grep -A2 'azure.workload.identity'

# No SPN secret in env; federated token projected?
kubectl -n akv2k8s exec -it deploy/akv2k8s-akv2k8s-controller -- env \
 | egrep 'AZURE_CLIENT_SECRET|AZURE_CLIENT_ID|AZURE_FEDERATED_TOKEN_FILE'
# Expect: NO AZURE_CLIENT_SECRET; seeing CLIENT_ID and FEDERATED_TOKEN_FILE is OK.

> This gets you running right now. Kubernetes will keep that SA unless someone removes it again.




---

B) Trigger a Flux/Helm reconcile without the Flux CLI (optional)

If you need the controllers in-cluster to re-apply the HelmRelease, you can annotate the resources with kubectl:

# Ask Helm Controller to reconcile the HelmRelease
kubectl -n akv2k8s annotate helmrelease akv2k8s \
  reconcile.fluxcd.io/requestedAt="$(date -u +%Y-%m-%dT%H:%M:%SZ)" --overwrite

# (If needed) Ask Kustomize Controller to rebuild the Kustomization that owns akv2k8s
kubectl -n flux-system annotate kustomization akv2k8s \
  kustomize.toolkit.fluxcd.io/reconcileAt="$(date -u +%Y-%m-%dT%H:%M:%SZ)" --overwrite

No Flux CLI required—those annotations are watched by the in-cluster controllers.


---

C) Make it permanent via Git (clean GitOps)

Since Flux will always prefer what’s in Git, open a PR that:

sets serviceAccount.create: true (or whatever your chart expects),

sets serviceAccount.name: akv2k8s-akv2k8s-controller (matching the Deployment),

and (if desired) adds the MI annotations in chart values (or keeps them on the SA you manage yourself).


Until that PR is merged, your manual SA will work; after merge, Flux/Helm will own it.


---

Quick diagnostics (still with kubectl only)

What SA name does the controller expect?


kubectl -n akv2k8s get deploy akv2k8s-akv2k8s-controller \
  -o jsonpath='{.spec.template.spec.serviceAccountName}{"\n"}'

Is any SA present?


kubectl -n akv2k8s get sa

Why Helm didn’t create it? (read the rendered HR values)


kubectl -n akv2k8s get helmrelease akv2k8s -o yaml | grep -A12 -i 'serviceAccount'

Helm/Kustomize controller logs (if reconcile seems stuck)


kubectl -n flux-system logs deploy/helm-controller     --tail=200 | grep -i akv2k8s
kubectl -n flux-system logs deploy/kustomize-controller --tail=200 | grep -i akv2k8s


---

Bottom line

You can recover and switch to MI right now using only kubectl (create SA + annotate + restart).

You can trigger reconciles with a simple annotation—no Flux CLI.

Then, for long-term stability, codify the SA creation/annotations in Git so Flux keeps it consistent.


