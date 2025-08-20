# ðŸ” Azure Key Vault to Kubernetes (akv2k8s) â€” Complete Guide

This guide explains **akv2k8s** in detail for Kubernetes engineers. It covers high-level concepts, technical details, flow of events, and useful commands for debugging.  
It also includes a **visual flow diagram** for better understanding.

---

# 1. Introduction

Applications in Kubernetes often need secrets like passwords, connection strings, and API keys.  
Manually storing these secrets inside Kubernetes `Secrets` duplicates data and can create security risks.  

**Azure Key Vault (AKV)** is a secure store for secrets in Azure.  
**akv2k8s** (Azure Key Vault to Kubernetes) bridges Kubernetes and Azure Key Vault, so Pods can fetch secrets at runtime without storing them permanently in the cluster.

---

# 2. Components of akv2k8s

### (A) Controller
- Runs in the `akv2k8s` namespace.  
- Watches custom resources like `AzureKeyVaultSecret`.  
- Can **synchronize secrets from Azure Key Vault into Kubernetes Secrets**.  
- Think of it as a **synchronizer**.  
- This is optional â€” some setups only use the injector.

### (B) Env-Injector (Mutating Admission Webhook)
- Runs as a **Deployment + Service** in the `akv2k8s` namespace.  
- Registered cluster-wide via a `MutatingWebhookConfiguration`.  
- Intercepts **Pod CREATE** requests to the API server.  
- If the namespace is eligible (label `Azure-Key-Vault-Env-Injection=enabled`), it **mutates** the Pod:
  - Mounts `/azure-keyvault/`.  
  - Wraps container command with `azure-keyvault-env`.  
- When the container starts, `azure-keyvault-env`:
  - Authenticates with Azure AD (using **Service Principal** or **Managed Identity**).  
  - Fetches the secret from Azure Key Vault.  
  - Injects the secret as an environment variable.

### (C) MutatingWebhookConfiguration
- Cluster-scoped object that tells the API server to call the injector.  
- Defines:
  - **Service** (namespace + name) where the webhook is hosted.  
  - **Port** (commonly 443, forwards to 8443 in the pod).  
  - **Path** (e.g., `/pods`).  
  - **namespaceSelector** (which namespaces are targeted).  
  - **objectSelector** (optional filter on Pods).  

---

# 3. Flow of Events (Pod Lifecycle with akv2k8s)

1. **User applies a Deployment**
   ```yaml
   - name: DB_PASSWORD
     value: my-secret@azurekeyvault
   ```

2. **API server receives Pod creation request**  
   - Deployment tries to create a Pod.  
   - API server checks registered `MutatingWebhookConfigurations`.

3. **Webhook selection**  
   - If the namespace has the label `Azure-Key-Vault-Env-Injection=enabled` (and is not excluded),  
   - the Env-Injector webhook is triggered.

4. **Pod mutation**  
   - API server calls the injector Service (`akv2k8s-akv2k8s-envinjector`).  
   - Injector patches Pod spec:
     - Adds `/azure-keyvault/` volume.  
     - Wraps container entrypoint with `azure-keyvault-env`.

5. **Pod stored in etcd (mutated)**  
   - Stored spec contains the changes but **not the actual secrets**.  

6. **Pod scheduled & started**  
   - Kubelet runs the Pod on a Node.  
   - Container starts with `azure-keyvault-env`.  

7. **Secret resolution**  
   - `azure-keyvault-env` requests an access token from Azure AD.  
   - Calls Azure Key Vault with the token.  
   - Fetches the real secret.  
   - Injects it into container env vars.

8. **Application runs with real secrets**  
   - App sees actual secret value in env var.  
   - Deployment YAML never contains the real secret.

---

# 4. Identity Options

### Service Principal (SPN)
- Classic method.  
- Requires storing client ID + secret/cert in the cluster.  
- Injector uses SPN credentials to fetch Key Vault tokens.

### Managed Identity (Recommended)
- Uses Azure AD Workload Identity or Pod Identity.  
- Pods request tokens directly from Azure without storing secrets.  
- More secure, cloud-native approach.

---

# 5. Visual Flow Diagram

![akv2k8s flow](akv2k8s_flow.png)

---

# 6. Technical Deep Dive

### Injection Scope
- Controlled by `namespaceSelector` and `objectSelector` in webhook config.  
- Example:
  ```yaml
  namespaceSelector:
    matchLabels:
      Azure-Key-Vault-Env-Injection: enabled
  ```
- This means **only namespaces with this label are targeted**.

### Ports & Paths
- Webhook config defines:
  - `port: 443` (API server connects here).  
  - `path: /pods`.  
- Service forwards port 443 â†’ `targetPort: 8443`.  
- Pod listens on containerPort 8443.

### Key Points
- Secrets are **never stored in Pod spec or Deployment YAML**.  
- Injection happens **only at Pod creation**.  
- At runtime, secrets are fetched directly from Azure Key Vault.

---

# 7. Debugging & Useful Queries

### A) Webhook discovery
```bash
kubectl get mutatingwebhookconfigurations
kubectl get mutatingwebhookconfigurations <WEBHOOK_NAME> -o yaml
```

### B) Check selectors
```bash
kubectl get mutatingwebhookconfigurations <WEBHOOK_NAME> -o yaml |   yq '.webhooks[] | {name, rules, namespaceSelector, objectSelector}'
```

### C) Eligible namespaces
```bash
kubectl get ns -l Azure-Key-Vault-Env-Injection=enabled --show-labels
```

### D) Pod mutation check
```bash
kubectl -n <ns> get pod <pod> -o yaml | grep -A3 'mountPath: /azure-keyvault'
kubectl -n <ns> get pod <pod> -o jsonpath='{.spec.containers[*].command}{"\n"}'
```

### E) See which injector served the Pod
```bash
kubectl -n <ns> describe pod <pod>
kubectl -n akv2k8s logs deploy/azure-key-vault-env-injector --since=1h | grep -i <pod>
```

### F) Confirm secrets inside container
```bash
kubectl -n <ns> exec -it <pod> -- printenv | grep -i <ENV_NAME>
```

### G) Service and ports
```bash
kubectl -n akv2k8s get svc
kubectl -n akv2k8s get deploy -o yaml | grep -A3 'containerPort:'
```

---

# âœ… Summary

- **akv2k8s** bridges Kubernetes and Azure Key Vault.  
- It has two pieces:  
  - **Controller** â†’ syncs Key Vault secrets into Kubernetes Secrets (optional).  
  - **Env-Injector (mutating webhook)** â†’ injects secrets at Pod creation.  
- The webhook works at **Pod admission stage**, based on namespace/object selectors.  
- At runtime, `azure-keyvault-env` fetches secrets from Key Vault using **SPN** or **Managed Identity**.  
- Pods end up with secrets as environment variables, while manifests never expose the values.  
- Debugging flow: **Webhook config â†’ Namespace labels â†’ Pod mutation â†’ Injector logs â†’ Secrets in Pod**.

---