

---

AKS Federated Credentials – Research & Findings

1. What are Federated Credentials?

Federated Credentials in Azure are part of Workload Identity Federation.
They allow an external identity provider (e.g., AKS OIDC, GitHub Actions, Azure DevOps Pipelines) to authenticate directly to Azure AD without using secrets or passwords.

How it works:

The workload (e.g., AKS pod or CI/CD pipeline) gets an OIDC token from its environment.

Azure AD trusts this token because of a federated credential configuration.

Azure AD exchanges it for an Azure access token so the workload can access Azure resources.


Key point:
From Azure AD’s perspective, Kubernetes pods and CI/CD pipelines are “external” because their identity token is not issued by Azure AD directly — it comes from the AKS OIDC issuer or pipeline provider.


---

2. When are Federated Credentials Needed?

You need federated credentials when:

Azure Workload Identity is enabled on AKS, and

Your pods use a Kubernetes Service Account that is linked to an Azure Managed Identity via OIDC, or

You want a CI/CD pipeline (e.g., GitHub Actions, Azure DevOps) to authenticate to Azure without storing a Service Principal secret.


You do not need federated credentials when:

Your workloads use the cluster’s or node pool’s Managed Identity directly via IMDS (Instance Metadata Service).

You are not using Workload Identity or external OIDC-based authentication.



---

3. Current Context & Conclusion

In our current AKS setup:

We have two node pools (default + app).

We are not using GitHub Actions or Azure DevOps pipelines for authentication.

We are using Cluster Managed Identity (node pool identity) for workloads to access Azure resources.

Pods get Azure tokens directly from IMDS using the cluster/node pool identity.


Conclusion:
➡ Federated credentials are not required for our current AKS setup.
We only need them if we move to Azure Workload Identity for pods or enable OIDC-based authentication for CI/CD pipelines in the future.


---

4. Commands to Verify Identity Configuration

Check Cluster Identity

az aks show \
  --name <cluster-name> \
  --resource-group <rg-name> \
  --query identity

If you see "type": "SystemAssigned" or "type": "UserAssigned", the cluster is using Managed Identity.
If you see only "servicePrincipalProfile" with a clientId (and no identity), it's still using an SPN.


---

Check Node Pool Identities

az aks nodepool list \
  --cluster-name <cluster-name> \
  --resource-group <rg-name> \
  --query "[].{name:name, identity:identity}"

If "type": "SystemAssigned" or "type": "UserAssigned", the node pool has a Managed Identity.


---

Check if Workload Identity (OIDC) is Enabled

az aks show \
  --name <cluster-name> \
  --resource-group <rg-name> \
  --query "oidcIssuerProfile"

If "enabled": false → Workload Identity and federated credentials are not in use.
If "enabled": true → Federated credentials could be in use (requires checking service accounts and Azure AD).


---

Check Existing Federated Credentials for a Managed Identity

az identity federated-credential list \
  --name <managed-identity-name> \
  --resource-group <rg-name>

If empty → No federated credentials configured.


---

5. Recommendation

Keep using Cluster Managed Identity for pods as it is simpler and doesn’t require federated credentials.

No federated credentials setup is currently needed.

Revisit federated credentials only if we:

Enable AKS Workload Identity for finer-grained pod access control, or

Use OIDC-based authentication for CI/CD pipelines.




---

Do you want me to also make a simple diagram showing “Cluster Identity” vs “Federated Credentials” so your lead can visually see why you don’t need it right now?
That would make this document even stronger for your RD.

