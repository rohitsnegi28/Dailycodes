for sub in $(az account list --all --query "[].id" -o tsv); do
  echo "=== Subscription: $sub ==="
  az acr list --subscription $sub --query "[].{name:name, rg:resourceGroup, login:loginServer}" -o table
done