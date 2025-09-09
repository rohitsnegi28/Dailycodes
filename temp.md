az graph query -q "
resources
| where type == 'microsoft.containerregistry/registries'
| project name, loginServer=tostring(properties.loginServer), subscriptionId, resourceGroup
| where loginServer =~ 'cdn1outsandbox.azurecr.io'
" -o table