In an Azure Kubernetes Service (AKS) environment utilizing akv2k8s for Azure Key Vault integration, you can determine the identity being used by inspecting the annotations and labels of the akv2k8s components. The identity can be configured as Workload Identity, AAD Pod Identity, or it can fall back to the kubelet managed identity. Here are the kubectl commands to identify which method is in use.
First, identify the namespace where akv2k8s is installed. Common default namespaces are akv2k8s or kube-system. The following commands assume akv2k8s is installed in the akv2k8s namespace. Replace akv2k8s with the correct namespace if it differs in your cluster.
Identifying the Service Account
The initial step is to determine the service account utilized by the akv2k8s-controller and akv2k8s-env-injector pods.
kubectl get pods -n akv2k8s -o yaml | grep serviceAccountName

This command will output the serviceAccountName for each akv2k8s pod. Note the name of the service account, which is typically akv2k8s-controller and akv2k8s-env-injector.
Checking for Workload Identity
Workload Identity is configured through annotations on the Service Account. To inspect these, use the following command, replacing <service-account-name> with the name you identified in the previous step.
kubectl describe serviceaccount <service-account-name> -n akv2k8s

What to look for:
Examine the Annotations section in the output. The presence of the following annotation indicates the use of Workload Identity:
 * azure.workload.identity/client-id: This annotation will be present and will have the client ID of the user-assigned managed identity as its value.
Additionally, you can check the labels on the akv2k8s pods:
kubectl get pods -n akv2k8s --show-labels

What to look for:
A pod configured for Workload Identity will have the following label:
 * azure.workload.identity/use: "true"
If you find these annotations and labels, akv2k8s is using Workload Identity.
Checking for AAD Pod Identity
AAD Pod Identity uses labels on the pods to associate them with an AzureIdentity. To check for this, examine the labels on the akv2k8s pods.
kubectl get pods -n akv2k8s --show-labels

What to look for:
In the output, look for a label that binds the pod to an AzureIdentity. This is typically:
 * aadpodidbinding: The value of this label will be the name of the AzureIdentityBinding resource.
If you see the aadpodidbinding label on the akv2k8s controller or injector pods, then akv2k8s is configured to use AAD Pod Identity.
Fallback to Kubelet Managed Identity
If you do not find any of the specific annotations for Workload Identity or labels for AAD Pod Identity on the akv2k8s service accounts and pods, it indicates that akv2k8s is falling back to using the kubelet managed identity.
In this scenario, akv2k8s leverages the managed identity associated with the AKS cluster's underlying virtual machine scale set (VMSS). To confirm this from within the cluster, you would verify the absence of the Workload Identity and AAD Pod Identity configurations as described above.
The akv2k8s controller pod's logs might also provide clues about the authentication method being used upon startup. You can check the logs using:
kubectl logs <akv2k8s-controller-pod-name> -n akv2k8s

Look for log entries related to authentication with Azure. In a fallback scenario, you would not see logs indicating the use of a specific pod or workload identity.
