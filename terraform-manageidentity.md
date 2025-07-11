# Complete Terraform Managed Identity Guide - From Basics to Implementation

## Table of Contents
1. [Terraform Basics](#terraform-basics)
2. [Folder Structure & Best Practices](#folder-structure--best-practices)
3. [File Types & Purposes](#file-types--purposes)
4. [Variable Naming Conventions](#variable-naming-conventions)
5. [Azure Managed Identity Concepts](#azure-managed-identity-concepts)
6. [Migration Strategy](#migration-strategy)
7. [Complete Implementation](#complete-implementation)
8. [Troubleshooting](#troubleshooting)

---

## Terraform Basics

### What is Terraform? (ELI5)
Think of Terraform like **LEGO instructions**:
- **LEGO pieces** = Azure resources (VMs, storage, networks)
- **Instruction manual** = Terraform code (.tf files)
- **Building process** = Running terraform commands
- **Final model** = Your infrastructure in Azure

### Core Terraform Concepts

#### 1. Infrastructure as Code (IaC)
```
Traditional Way (Manual):          Terraform Way (Automated):
👤 Person → 🖱️ Azure Portal → ☁️   📝 Code → 🤖 Terraform → ☁️
```

#### 2. Terraform Workflow
```
1. WRITE 📝    → Write .tf files describing what you want
2. PLAN 👀     → terraform plan (preview changes)
3. APPLY ✅    → terraform apply (create resources)
4. MANAGE 🔧   → Update code, plan, apply again
5. DESTROY 💥  → terraform destroy (cleanup)
```

#### 3. Key Terraform Components

**Resources** = Things you want to create
```hcl
resource "azurerm_resource_group" "example" {
  name     = "my-resource-group"
  location = "East US"
}
```

**Data Sources** = Things that already exist (read-only)
```hcl
data "azurerm_subscription" "current" {}
```

**Variables** = Settings you can change
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}
```

**Outputs** = Information you want to see after creation
```hcl
output "resource_group_name" {
  value = azurerm_resource_group.example.name
}
```

**Modules** = Reusable components (like LEGO sets)
```hcl
module "managed_identity" {
  source = "your-catalog-url//managed-identity"
  name   = "my-identity"
}
```

---

## Folder Structure & Best Practices

### Enterprise Terraform Project Structure

```
my-terraform-project/                    # 📁 Root project folder
├── README.md                            # 📄 Project documentation
├── .gitignore                           # 🚫 Files to ignore in Git
├── .terraform-version                   # 📌 Pin Terraform version
│
├── environments/                        # 📁 Environment-specific configurations
│   ├── dev/                            # 📁 Development environment
│   │   ├── main.tf                     # 🏗️ Main configuration
│   │   ├── variables.tf                # ⚙️ Variable definitions
│   │   ├── terraform.tfvars            # 📊 Variable values
│   │   ├── outputs.tf                  # 📤 Output definitions
│   │   ├── provider.tf                 # 🔌 Provider configuration
│   │   └── backend.tf                  # 💾 State storage config
│   │
│   ├── staging/                        # 📁 Staging environment
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── terraform.tfvars
│   │   ├── outputs.tf
│   │   ├── provider.tf
│   │   └── backend.tf
│   │
│   └── prod/                           # 📁 Production environment
│       ├── main.tf
│       ├── variables.tf
│       ├── terraform.tfvars
│       ├── outputs.tf
│       ├── provider.tf
│       └── backend.tf
│
├── modules/                            # 📁 Custom reusable modules
│   └── application/                    # 📁 Application-specific module
│       ├── main.tf                     # 🏗️ Module implementation
│       ├── variables.tf                # ⚙️ Module inputs
│       ├── outputs.tf                  # 📤 Module outputs
│       └── README.md                   # 📄 Module documentation
│
├── scripts/                            # 📁 Helper scripts
│   ├── deploy.sh                       # 🚀 Deployment script
│   ├── validate.sh                     # ✅ Validation script
│   └── cleanup.sh                      # 🧹 Cleanup script
│
└── docs/                               # 📁 Additional documentation
    ├── architecture.md                 # 🏛️ Architecture diagrams
    ├── runbook.md                      # 📖 Operations guide
    └── migration-guide.md              # 🔄 Migration instructions
```

### Why This Structure?

**Environment Separation** 🔒
- Each environment (dev/staging/prod) is completely isolated
- Changes in dev don't affect production
- Different configurations for different environments

**Module Reusability** ♻️
- Write code once, use it everywhere
- Catalog modules provide company standards
- Custom modules for your specific needs

**Clear Organization** 📋
- Easy to find what you need
- New team members can understand quickly
- Follows industry best practices

---

## File Types & Purposes

### Core Terraform Files

#### 1. main.tf - The Heart of Your Configuration
**Purpose**: Primary configuration file where you define resources and modules

```hcl
# ROLE ASSIGNMENTS FOR TERRAFORM IDENTITY
# ==============================================================================
# Assign Contributor role at resource group level (restricted scope for dev)
module "terraform_contributor_assignment" {
  source = var.catalog_role_assignment_source
  
  scope                = module.identity_resource_group.id
  role_definition_name = "Contributor"
  principal_id         = module.terraform_managed_identity.principal_id
  
  description            = "Terraform infrastructure management for ${var.environment}"
  assigned_by           = var.owner_team
  business_justification = "Required for automated infrastructure deployment in development"
}

# Assign Storage Blob Data Contributor for Terraform state
module "terraform_storage_assignment" {
  source = var.catalog_storage_role_assignment_source
  
  storage_account_name     = var.terraform_state_storage_account
  storage_resource_group   = var.terraform_state_resource_group
  principal_id            = module.terraform_managed_identity.principal_id
  role_definition_name    = "Storage Blob Data Contributor"
  
  description = "Terraform state file management for ${var.environment}"
}

# ==============================================================================
# ROLE ASSIGNMENTS FOR JENKINS IDENTITY
# ==============================================================================
# More restricted permissions for Jenkins (application deployment only)
module "jenkins_app_contributor_assignment" {
  source = var.catalog_role_assignment_source
  
  # Scope limited to application resource groups only
  scope                = "/subscriptions/${var.subscription_id}/resourceGroups/rg-applications-${var.environment}"
  role_definition_name = "Contributor"
  principal_id         = module.jenkins_managed_identity.principal_id
  
  description            = "Jenkins application deployment for ${var.environment}"
  assigned_by           = var.owner_team
  business_justification = "Required for automated application deployment"
}

# Give Jenkins access to container registry (if you use containers)
module "jenkins_acr_assignment" {
  count  = var.enable_container_registry ? 1 : 0
  source = var.catalog_role_assignment_source
  
  scope                = "/subscriptions/${var.subscription_id}/resourceGroups/rg-containers-${var.environment}/providers/Microsoft.ContainerRegistry/registries/acr${var.environment}${random_string.suffix.result}"
  role_definition_name = "AcrPush"
  principal_id         = module.jenkins_managed_identity.principal_id
  
  description = "Jenkins container image management for ${var.environment}"
}

# ==============================================================================
# KEY VAULT ACCESS (if needed)
# ==============================================================================
module "terraform_keyvault_access" {
  count  = var.enable_key_vault_access ? 1 : 0
  source = var.catalog_keyvault_access_source
  
  key_vault_name          = var.key_vault_name
  key_vault_resource_group = var.key_vault_resource_group
  object_id              = module.terraform_managed_identity.principal_id
  
  secret_permissions = ["Get", "List"]
  key_permissions    = []
  certificate_permissions = []
  
  access_description = "Terraform secret retrieval for ${var.environment} infrastructure"
}
```

#### environments/dev/variables.tf
```hcl
# ==============================================================================
# DEVELOPMENT ENVIRONMENT VARIABLES
# ==============================================================================

# Core Environment Variables
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "azure_region" {
  description = "Azure region for resource deployment"
  type        = string
  default     = "East US"
  
  validation {
    condition = contains([
      "East US", "East US 2", "West US", "West US 2", "West US 3",
      "Central US", "South Central US", "North Central US",
      "North Europe", "West Europe", "UK South", "UK West",
      "Southeast Asia", "East Asia", "Australia East", "Australia Southeast"
    ], var.azure_region)
    error_message = "Must be a supported Azure region."
  }
}

variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
  sensitive   = true
  
  validation {
    condition     = can(regex("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", var.subscription_id))
    error_message = "Must be a valid Azure subscription GUID."
  }
}

# Project Information
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "managed-identity-migration"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "IT-Infrastructure"
}

variable "owner_team" {
  description = "Team responsible for resources"
  type        = string
  default     = "DevOps Team"
}

# Tagging
variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    ManagedBy    = "Terraform"
    Project      = "Managed Identity Migration"
    Environment  = "Development"
    CreatedBy    = "DevOps Team"
  }
}

# Catalog Module Sources
variable "catalog_resource_group_source" {
  description = "Source for resource group catalog module"
  type        = string
  default     = "git::https://dev.azure.com/your-company/terraform-catalog/_git/modules//resource-group?ref=v2.0.0"
}

variable "catalog_managed_identity_source" {
  description = "Source for managed identity catalog module"
  type        = string
  default     = "git::https://dev.azure.com/your-company/terraform-catalog/_git/modules//managed-identity?ref=v1.5.0"
}

variable "catalog_role_assignment_source" {
  description = "Source for role assignment catalog module"
  type        = string
  default     = "git::https://dev.azure.com/your-company/terraform-catalog/_git/modules//role-assignment?ref=v1.2.0"
}

variable "catalog_storage_role_assignment_source" {
  description = "Source for storage role assignment catalog module"
  type        = string
  default     = "git::https://dev.azure.com/your-company/terraform-catalog/_git/modules//storage-role-assignment?ref=v1.1.0"
}

variable "catalog_keyvault_access_source" {
  description = "Source for key vault access catalog module"
  type        = string
  default     = "git::https://dev.azure.com/your-company/terraform-catalog/_git/modules//keyvault-access?ref=v2.0.0"
}

# Storage Account for Terraform State
variable "terraform_state_storage_account" {
  description = "Storage account name for Terraform state"
  type        = string
  default     = "tfstatedev12345"
}

variable "terraform_state_resource_group" {
  description = "Resource group containing Terraform state storage"
  type        = string
  default     = "rg-terraform-state-dev"
}

# Optional Features
variable "enable_container_registry" {
  description = "Enable container registry access for Jenkins"
  type        = bool
  default     = false
}

variable "enable_key_vault_access" {
  description = "Enable Key Vault access for Terraform"
  type        = bool
  default     = false
}

variable "key_vault_name" {
  description = "Name of Key Vault for secret access"
  type        = string
  default     = ""
}

variable "key_vault_resource_group" {
  description = "Resource group containing Key Vault"
  type        = string
  default     = ""
}
```

#### environments/dev/terraform.tfvars
```hcl
# ==============================================================================
# DEVELOPMENT ENVIRONMENT VALUES
# ==============================================================================

# Core Configuration
environment     = "dev"
azure_region    = "East US"
subscription_id = "12345678-1234-1234-1234-123456789012"

# Project Details
project_name = "managed-identity-migration"
cost_center  = "IT-Infrastructure-001"
owner_team   = "Platform Engineering Team"

# Resource Tags
common_tags = {
  Environment     = "Development"
  Project         = "Managed Identity Migration"
  Owner          = "Platform Engineering Team"
  CostCenter     = "IT-Infrastructure-001"
  ManagedBy      = "Terraform"
  CreatedDate    = "2024-01-15"
  BusinessUnit   = "Technology"
  DataClass      = "Internal"
  BackupRequired = "false"
  Purpose        = "Identity Management Development"
}

# Terraform State Configuration
terraform_state_storage_account = "tfstatedev12345"
terraform_state_resource_group  = "rg-terraform-state-dev"

# Optional Features
enable_container_registry = true
enable_key_vault_access   = true
key_vault_name            = "kv-secrets-dev-12345"
key_vault_resource_group  = "rg-security-dev"

# Catalog Module Sources (Development versions)
catalog_resource_group_source           = "git::https://dev.azure.com/your-company/terraform-catalog/_git/modules//resource-group?ref=v2.0.0"
catalog_managed_identity_source         = "git::https://dev.azure.com/your-company/terraform-catalog/_git/modules//managed-identity?ref=v1.5.0"
catalog_role_assignment_source          = "git::https://dev.azure.com/your-company/terraform-catalog/_git/modules//role-assignment?ref=v1.2.0"
catalog_storage_role_assignment_source  = "git::https://dev.azure.com/your-company/terraform-catalog/_git/modules//storage-role-assignment?ref=v1.1.0"
catalog_keyvault_access_source          = "git::https://dev.azure.com/your-company/terraform-catalog/_git/modules//keyvault-access?ref=v2.0.0"
```

#### environments/dev/provider.tf
```hcl
# ==============================================================================
# DEVELOPMENT PROVIDER CONFIGURATION
# ==============================================================================

provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false  # Allow deletion in dev
    }
    
    key_vault {
      purge_soft_delete_on_destroy    = true   # Clean up completely in dev
      recover_soft_deleted_key_vaults = false
    }
    
    storage {
      prevent_deletion_if_contains_resources = false
    }
  }
  
  # Use Managed Identity for authentication
  use_msi = true
  
  # Optional: Specify subscription
  subscription_id = var.subscription_id
}

provider "random" {
  # No configuration needed for random provider
}
```

#### environments/dev/backend.tf
```hcl
# ==============================================================================
# DEVELOPMENT BACKEND CONFIGURATION
# ==============================================================================

terraform {
  backend "azurerm" {
    resource_group_name  = "rg-terraform-state-dev"
    storage_account_name = "tfstatedev12345"
    container_name       = "tfstate"
    key                  = "managed-identity/development.tfstate"
    
    # Use Managed Identity for backend authentication
    use_msi = true
  }
}
```

#### environments/dev/outputs.tf
```hcl
# ==============================================================================
# DEVELOPMENT ENVIRONMENT OUTPUTS
# ==============================================================================

# Managed Identity Information
output "terraform_managed_identity" {
  description = "Terraform managed identity details"
  value = {
    name         = module.terraform_managed_identity.name
    client_id    = module.terraform_managed_identity.client_id
    principal_id = module.terraform_managed_identity.principal_id
    resource_id  = module.terraform_managed_identity.id
  }
}

output "jenkins_managed_identity" {
  description = "Jenkins managed identity details"
  value = {
    name         = module.jenkins_managed_identity.name
    client_id    = module.jenkins_managed_identity.client_id
    principal_id = module.jenkins_managed_identity.principal_id
    resource_id  = module.jenkins_managed_identity.id
  }
}

# Resource Group Information
output "resource_group" {
  description = "Resource group details"
  value = {
    name     = module.identity_resource_group.name
    location = module.identity_resource_group.location
    id       = module.identity_resource_group.id
  }
}

# For use in other configurations
output "identity_configuration" {
  description = "Complete identity configuration for reuse"
  value = {
    terraform_identity = {
      name         = module.terraform_managed_identity.name
      client_id    = module.terraform_managed_identity.client_id
      principal_id = module.terraform_managed_identity.principal_id
    }
    jenkins_identity = {
      name         = module.jenkins_managed_identity.name
      client_id    = module.jenkins_managed_identity.client_id
      principal_id = module.jenkins_managed_identity.principal_id
    }
    resource_group = {
      name     = module.identity_resource_group.name
      location = module.identity_resource_group.location
    }
  }
}

# Quick reference for Jenkins configuration
output "jenkins_environment_variables" {
  description = "Environment variables for Jenkins configuration"
  value = {
    ARM_USE_MSI         = "true"
    ARM_CLIENT_ID       = module.jenkins_managed_identity.client_id
    ARM_SUBSCRIPTION_ID = var.subscription_id
    ARM_TENANT_ID       = "your-tenant-id"  # Replace with actual tenant ID
  }
}

# Quick reference for Terraform provider configuration
output "terraform_provider_config" {
  description = "Provider configuration for Terraform"
  value = <<-EOT
    provider "azurerm" {
      features {}
      use_msi   = true
      client_id = "${module.terraform_managed_identity.client_id}"
    }
  EOT
}
```

### Production Environment Implementation

#### environments/prod/main.tf
```hcl
# ==============================================================================
# PRODUCTION ENVIRONMENT - MANAGED IDENTITY CONFIGURATION
# ==============================================================================
# Production environment with enhanced security and monitoring

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}

# Generate random suffix for unique names
resource "random_string" "suffix" {
  length  = 4
  special = false
  upper   = false
}

# ==============================================================================
# RESOURCE GROUP FOR PRODUCTION IDENTITY MANAGEMENT
# ==============================================================================
module "identity_resource_group" {
  source = var.catalog_resource_group_source
  
  name     = "rg-identity-${var.environment}-${random_string.suffix.result}"
  location = var.azure_region
  
  # Enhanced tags for production
  tags = merge(var.common_tags, {
    Purpose       = "Identity Management"
    Scope         = "Production"
    Compliance    = "SOX,PCI"
    Monitoring    = "Critical"
    BackupTier    = "Premium"
  })
}

# ==============================================================================
# PRODUCTION TERRAFORM MANAGED IDENTITY
# ==============================================================================
module "terraform_managed_identity" {
  source = var.catalog_managed_identity_source
  
  name                = "mi-terraform-${var.environment}-${random_string.suffix.result}"
  resource_group_name = module.identity_resource_group.name
  location           = module.identity_resource_group.location
  
  description = "Production Terraform Managed Identity - Critical Infrastructure Automation"
  
  # Enhanced production tags
  tags = merge(var.common_tags, {
    Purpose       = "Terraform Automation"
    Environment   = "Production"
    Component     = "Infrastructure"
    CriticalSystem = "true"
    Monitoring    = "Required"
  })
}

# ==============================================================================
# PRODUCTION JENKINS MANAGED IDENTITY
# ==============================================================================
module "jenkins_managed_identity" {
  source = var.catalog_managed_identity_source
  
  name                = "mi-jenkins-${var.environment}-${random_string.suffix.result}"
  resource_group_name = module.identity_resource_group.name
  location           = module.identity_resource_group.location
  
  description = "Production Jenkins Managed Identity - Application Deployment Automation"
  
  tags = merge(var.common_tags, {
    Purpose       = "Application Deployment"
    Environment   = "Production"
    Component     = "CI/CD"
    CriticalSystem = "true"
  })
}

# ==============================================================================
# MONITORING MANAGED IDENTITY
# ==============================================================================
module "monitoring_managed_identity" {
  source = var.catalog_managed_identity_source
  
  name                = "mi-monitoring-${var.environment}-${random_string.suffix.result}"
  resource_group_name = module.identity_resource_group.name
  location           = module.identity_resource_group.location
  
  description = "Production Monitoring Managed Identity - Read-only monitoring access"
  
  tags = merge(var.common_tags, {
    Purpose     = "Monitoring and Alerting"
    Environment = "Production"
    Component   = "Observability"
  })
}

# ==============================================================================
# PRODUCTION ROLE ASSIGNMENTS - TERRAFORM IDENTITY
# ==============================================================================
# Contributor role at subscription level (production needs broader access)
module "terraform_contributor_assignment" {
  source = var.catalog_role_assignment_source
  
  scope                = "/subscriptions/${var.subscription_id}"
  role_definition_name = "Contributor"
  principal_id         = module.terraform_managed_identity.principal_id
  
  description            = "Terraform production infrastructure management"
  assigned_by           = var.owner_team
  business_justification = "Required for production infrastructure automation and disaster recovery"
}

# Storage access for Terraform state
module "terraform_storage_assignment" {
  source = var.catalog_storage_role_assignment_source
  
  storage_account_name     = var.terraform_state_storage_account
  storage_resource_group   = var.terraform_state_resource_group
  principal_id            = module.terraform_managed_identity.principal_id
  role_definition_name    = "Storage Blob Data Contributor"
  
  description = "Terraform production state file management"
}

# ==============================================================================
# PRODUCTION ROLE ASSIGNMENTS - JENKINS IDENTITY
# ==============================================================================
# Restricted to application resource groups
module "jenkins_app_contributor_assignment" {
  source = var.catalog_role_assignment_source
  
  scope                = "/subscriptions/${var.subscription_id}/resourceGroups/rg-applications-${var.environment}"
  role_definition_name = "Contributor"
  principal_id         = module.jenkins_managed_identity.principal_id
  
  description            = "Jenkins production application deployment"
  assigned_by           = var.owner_team
  business_justification = "Required for automated application deployment in production"
}

# Container registry access
module "jenkins_acr_assignment" {
  count  = var.enable_container_registry ? 1 : 0
  source = var.catalog_role_assignment_source
  
  scope                = "/subscriptions/${var.subscription_id}/resourceGroups/rg-containers-${var.environment}/providers/Microsoft.ContainerRegistry/registries/acrprod${random_string.suffix.result}"
  role_definition_name = "AcrPush"
  principal_id         = module.jenkins_managed_identity.principal_id
  
  description = "Jenkins production container image management"
}

# ==============================================================================
# PRODUCTION ROLE ASSIGNMENTS - MONITORING IDENTITY
# ==============================================================================
module "monitoring_reader_assignment" {
  source = var.catalog_role_assignment_source
  
  scope                = "/subscriptions/${var.subscription_id}"
  role_definition_name = "Reader"
  principal_id         = module.monitoring_managed_identity.principal_id
  
  description = "Production monitoring read access"
}

module "monitoring_metrics_assignment" {
  source = var.catalog_role_assignment_source
  
  scope                = "/subscriptions/${var.subscription_id}"
  role_definition_name = "Monitoring Reader"
  principal_id         = module.monitoring_managed_identity.principal_id
  
  description = "Production monitoring metrics access"
}

# ==============================================================================
# KEY VAULT ACCESS FOR PRODUCTION
# ==============================================================================
module "terraform_keyvault_access" {
  count  = var.enable_key_vault_access ? 1 : 0
  source = var.catalog_keyvault_access_source
  
  key_vault_name          = var.key_vault_name
  key_vault_resource_group = var.key_vault_resource_group
  object_id              = module.terraform_managed_identity.principal_id
  
  # Minimal permissions for production
  secret_permissions      = ["Get", "List"]
  key_permissions        = []
  certificate_permissions = []
  
  access_description = "Terraform production secret retrieval - minimal required access"
}
```

### Jenkins Integration

#### Jenkinsfile for Managed Identity
```groovy
pipeline {
    agent {
        // Jenkins must run on Azure VM with managed identity enabled
        label 'azure-linux-managed-identity'
    }
    
    environment {
        // Managed Identity Environment Variables
        ARM_USE_MSI = 'true'
        ARM_SUBSCRIPTION_ID = credentials('azure-subscription-id')
        ARM_TENANT_ID = credentials('azure-tenant-id')
        
        // Environment-specific settings
        TF_ENVIRONMENT = "${env.BRANCH_NAME == 'main' ? 'prod' : 'dev'}"
        TF_WORKSPACE = "${env.BRANCH_NAME == 'main' ? 'production' : 'development'}"
        
        // Terraform settings
        TF_IN_AUTOMATION = 'true'
        TF_CLI_ARGS = '-no-color'
        TF_CLI_ARGS_plan = '-detailed-exitcode'
    }
    
    options {
        // Keep builds for auditing
        buildDiscarder(logRotator(numToKeepStr: '30'))
        
        // Timeout for safety
        timeout(time: 30, unit: 'MINUTES')
        
        // Prevent concurrent builds
        disableConcurrentBuilds()
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo "🔄 Checking out code for ${env.TF_ENVIRONMENT} environment"
                checkout scm
            }
        }
        
        stage('Validate Environment') {
            steps {
                script {
                    echo "🔍 Validating environment setup"
                    
                    // Check if running on VM with managed identity
                    sh '''
                        echo "Checking managed identity availability..."
                        
                        # Test managed identity endpoint
                        curl -H "Metadata:true" \
                             "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/" \
                             --connect-timeout 5 || {
                            echo "❌ Managed Identity not available. Ensure Jenkins runs on Azure VM with managed identity enabled."
                            exit 1
                        }
                        
                        echo "✅ Managed Identity available"
                    '''
                    
                    // Validate Azure CLI authentication
                    sh '''
                        echo "Testing Azure CLI authentication..."
                        az account show --output table || {
                            echo "❌ Azure CLI authentication failed"
                            exit 1
                        }
                        echo "✅ Azure CLI authentication successful"
                    '''
                }
            }
        }
        
        stage('Terraform Init') {
            steps {
                dir("environments/${env.TF_ENVIRONMENT}") {
                    script {
                        echo "🏗️ Initializing Terraform for ${env.TF_ENVIRONMENT}"
                        
                        sh '''
                            echo "Terraform version:"
                            terraform version
                            
                            echo "Initializing Terraform with managed identity..."
                            terraform init -upgrade
                            
                            echo "Selecting workspace: ${TF_WORKSPACE}"
                            terraform workspace select ${TF_WORKSPACE} || terraform workspace new ${TF_WORKSPACE}
                            
                            echo "Current workspace:"
                            terraform workspace show
                        '''
                    }
                }
            }
        }
        
        stage('Terraform Validate') {
            steps {
                dir("environments/${env.TF_ENVIRONMENT}") {
                    echo "✅ Validating Terraform configuration"
                    sh '''
                        terraform validate
                        
                        echo "Running terraform fmt check..."
                        terraform fmt -check -diff
                    '''
                }
            }
        }
        
        stage('Terraform Plan') {
            steps {
                dir("environments/${env.TF_ENVIRONMENT}") {
                    script {
                        echo "📋 Creating Terraform plan for ${env.TF_ENVIRONMENT}"
                        
                        def planResult = sh(
                            script: 'terraform plan -var-file="terraform.tfvars" -out=tfplan',
                            returnStatus: true
                        )
                        
                        if (planResult == 0) {
                            echo "✅ Plan created successfully - no changes"
                        } else if (planResult == 2) {
                            echo "📝 Plan created successfully - changes detected"
                        } else {
                            error "❌ Terraform plan failed with exit code: ${planResult}"
                        }
                        
                        // Show plan in human-readable format
                        sh 'terraform show tfplan'
                    }
                }
            }
        }
        
        stage('Approval') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                script {
                    echo "⏳ Waiting for approval to apply ${env.TF_ENVIRONMENT} changes"
                    
                    def approved = input(
                        message: "Apply Terraform changes to ${env.TF_ENVIRONMENT}?",
                        parameters: [
                            choice(
                                name: 'ACTION',
                                choices: ['Apply', 'Abort'],
                                description: 'Choose action to perform'
                            )
                        ]
                    )
                    
                    if (approved != 'Apply') {
                        error "Deployment aborted by user"
                    }
                }
            }
        }
        
        stage('Terraform Apply') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                dir("environments/${env.TF_ENVIRONMENT}") {
                    script {
                        echo "🚀 Applying Terraform configuration to ${env.TF_ENVIRONMENT}"
                        
                        sh '''
                            echo "Applying Terraform plan..."
                            terraform apply tfplan
                            
                            echo "✅ Terraform apply completed successfully"
                            
                            echo "Outputting results..."
                            terraform output
                        '''
                    }
                }
            }
        }
        
        stage('Verify Deployment') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                dir("environments/${env.TF_ENVIRONMENT}") {
                    script {
                        echo "🔍 Verifying deployment"
                        
                        sh '''
                            echo "Checking created resources..."
                            terraform state list
                            
                            echo "Verifying managed identities..."
                            az identity list --resource-group $(terraform output -raw resource_group_name) --output table
                            
                            echo "✅ Deployment verification completed"
                        '''
                    }
                }
            }
        }
    }
    
    post {
        always {
            script {
                echo "🧹 Cleaning up workspace"
                
                // Archive important files
                archiveArtifacts(
                    artifacts: '**/tfplan,**/terraform.tfstate,**/terraform.tfvars',
                    allowEmptyArchive: true,
                    fingerprint: true
                )
                
                // Clean up plan files
                sh '''
                    find . -name "tfplan" -type f -delete || true
                    find . -name ".terraform.lock.hcl" -type f -delete || true
                '''
            }
        }
        
        success {
            echo "✅ Pipeline completed successfully for ${env.TF_ENVIRONMENT}"
            
            // Send success notification
            script {
                if (env.BRANCH_NAME == 'main') {
                    // Add your notification logic here (Slack, Teams, email, etc.)
                    echo "📢 Production deployment successful"
                }
            }
        }
        
        failure {
            echo "❌ Pipeline failed for ${env.TF_ENVIRONMENT}"
            
            // Send failure notification
            script {
                // Add your notification logic here
                echo "🚨 Deployment failed - check logs"
            }
        }
        
        unstable {
            echo "⚠️ Pipeline completed with warnings for ${env.TF_ENVIRONMENT}"
        }
    }
}
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Authentication Problems

**Issue**: "Unable to authenticate using Managed Identity"
```bash
Error: building AzureRM Client: obtain subscription() from Azure CLI: parsing json result from the Azure CLI: waiting for the Azure CLI: exit status 1: ERROR: Please run 'az login' to setup account.
```

**Solutions**:
```bash
# Check if managed identity is available
curl -H "Metadata:true" "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/"

# Verify Azure CLI can use managed identity
az login --identity

# Check current account
az account show

# If using user-assigned identity, specify client_id
az login --identity --username YOUR_MANAGED_IDENTITY_CLIENT_ID
```

#### 2. Permission Issues

**Issue**: "Insufficient privileges to complete the operation"
```bash
Error: creating Resource Group: (Name "rg-test" / Subscription: "subscription-id"): authorization.RoleAssignmentsClient#Create: Failure responding to request: StatusCode=403 -- Original Error: autorest/azure: Service returned an error. Status=403 Code="AuthorizationFailed" Message="The client does not have authorization to perform action 'Microsoft.Resources/resourceGroups/write' over scope '/subscriptions/subscription-id/resourceGroups/rg-test'."
```

**Solutions**:
```bash
# Check current role assignments
az role assignment list --assignee YOUR_MANAGED_IDENTITY_PRINCIPAL_ID

# Assign required role
az role assignment create \
  --assignee YOUR_MANAGED_IDENTITY_PRINCIPAL_ID \
  --role "Contributor" \
  --scope "/subscriptions/YOUR_SUBSCRIPTION_ID"

# Check specific resource permissions
az role assignment list --assignee YOUR_PRINCIPAL_ID --scope "/subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/YOUR_RG"
```

#### 3. Terraform State Issues

**Issue**: "Error acquiring the state lock" or "Backend authentication failed"
```bash
Error: Error acquiring the state lock: storage: service returned error: StatusCode=403, ErrorCode=AuthorizationFailure, ErrorMessage=This request is not authorized to perform this operation.
```

**Solutions**:
```bash
# Check storage account permissions
az role assignment list --scope "/subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/rg-terraform-state/providers/Microsoft.Storage/storageAccounts/tfstate"

# Assign Storage Blob Data Contributor role
az role assignment create \
  --assignee YOUR_MANAGED_IDENTITY_PRINCIPAL_ID \
  --role "Storage Blob Data Contributor" \
  --scope "/subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/rg-terraform-state/providers/Microsoft.Storage/storageAccounts/tfstate"

# Force unlock if needed (use with caution)
terraform force-unlock LOCK_ID

# Verify backend configuration
terraform init -reconfigure
```

#### 4. Module Source Issues

**Issue**: "Module not found" or "Failed to download module"
```bash
Error: Failed to download module "managed_identity" (main.tf:10) from "git::https://dev.azure.com/company/terraform-catalog/_git/modules//managed-identity?ref=v1.0.0": error downloading 'https://dev.azure.com/company/terraform-catalog/_git/modules': /usr/bin/git exited with 128: Cloning into '.terraform/modules/managed_identity'...
remote: Repository not found.
```

**Solutions**:
```bash
# Test Git access manually
git clone https://dev.azure.com/your-company/terraform-catalog.git

# Configure Git credentials for Azure DevOps
git config --global credential.helper store

# For Jenkins, ensure service connection is configured
# Check if module path exists
git ls-remote https://dev.azure.com/your-company/terraform-catalog.git refs/heads/main

# Verify module version/tag exists
git ls-remote --tags https://dev.azure.com/your-company/terraform-catalog.git
```

#### 5. Variable Validation Errors

**Issue**: "Variable validation failed"
```bash
Error: Invalid value for variable "environment": Environment must be one of: dev, staging, prod.
```

**Solutions**:
```hcl
# Check variable definitions in variables.tf
variable "environment" {
  description = "Environment name"
  type        = string
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

# Ensure terraform.tfvars has correct values
environment = "prod"  # Must match validation condition

# Use terraform console to test variables
terraform console
> var.environment
```

### Debugging Commands

#### Check Current Configuration
```bash
# Show current Terraform configuration
terraform show

# List all resources in state
terraform state list

# Show specific resource details
terraform state show module.terraform_managed_identity.azurerm_user_assigned_identity.this

# Check variable values
terraform console
> var.environment
> var.azure_region
```

#### Azure CLI Debugging
```bash
# Check current login status
az account show

# List available subscriptions
az account list --output table

# Check managed identity details
az identity show \
  --name "mi-terraform-prod-1234" \
  --resource-group "rg-identity-prod-1234"

# Check role assignments
az role assignment list \
  --assignee "12345678-1234-1234-1234-123456789012" \
  --output table

# Test storage access
az storage blob list \
  --account-name "tfstateprod12345" \
  --container-name "tfstate" \
  --auth-mode login
```

#### Terraform Debugging
```bash
# Enable detailed logging
export TF_LOG=DEBUG
export TF_LOG_PATH=terraform.log
terraform plan

# Validate configuration
terraform validate

# Check formatting
terraform fmt -check -diff

# Refresh state
terraform refresh

# Import existing resources
terraform import module.terraform_managed_identity.azurerm_user_assigned_identity.this /subscriptions/sub-id/resourceGroups/rg-name/providers/Microsoft.ManagedIdentity/userAssignedIdentities/identity-name
```

### Migration Validation Checklist

#### Pre-Migration Validation
```bash
# ✅ Service Principal Documentation
echo "Current Service Principal Details:"
az ad sp list --display-name "your-terraform-sp" --output table

# ✅ Current Role Assignments
echo "Current Role Assignments:"
az role assignment list --assignee "SERVICE_PRINCIPAL_OBJECT_ID" --output table

# ✅ Test Current Terraform Operations
echo "Testing current Terraform setup:"
terraform init
terraform plan
```

#### Post-Migration Validation
```bash
# ✅ Managed Identity Creation
echo "Managed Identity Details:"
az identity show --name "mi-terraform-prod-1234" --resource-group "rg-identity-prod-1234"

# ✅ Role Assignment Verification
echo "New Role Assignments:"
az role assignment list --assignee "MANAGED_IDENTITY_PRINCIPAL_ID" --output table

# ✅ Terraform Operations Test
echo "Testing new Terraform setup:"
terraform init
terraform plan
terraform apply -auto-approve
terraform destroy -auto-approve

# ✅ Jenkins Pipeline Test
echo "Testing Jenkins pipeline with managed identity:"
# Run Jenkins job and verify success
```

### Performance Optimization

#### Terraform Performance Tips
```hcl
# Use parallel execution
terraform apply -parallelism=10

# Reduce provider plugin downloads
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "= 3.85.0"  # Pin exact version
    }
  }
}

# Use depends_on sparingly (prefer implicit dependencies)
resource "azurerm_role_assignment" "example" {
  scope        = azurerm_resource_group.example.id  # Implicit dependency
  principal_id = azurerm_user_assigned_identity.example.principal_id
  # depends_on = [azurerm_user_assigned_identity.example]  # Avoid explicit unless necessary
}
```

#### State Management Best Practices
```bash
# Use remote state with locking
terraform {
  backend "azurerm" {
    resource_group_name  = "rg-terraform-state"
    storage_account_name = "tfstate"
    container_name       = "tfstate"
    key                  = "prod/terraform.tfstate"
    use_msi             = true
  }
}

# Regular state cleanup
terraform state list | grep "old_resource" | xargs terraform state rm

# Backup state before major changes
az storage blob download \
  --account-name tfstate \
  --container-name tfstate \
  --name prod/terraform.tfstate \
  --file terraform.tfstate.backup \
  --auth-mode login
```

### Security Best Practices

#### Managed Identity Security
```hcl
# ✅ Principle of Least Privilege
module "restricted_role_assignment" {
  source = var.catalog_role_assignment_source
  
  # Assign to specific resource group, not entire subscription
  scope                = azurerm_resource_group.app.id
  role_definition_name = "Contributor"
  principal_id         = module.terraform_managed_identity.principal_id
}

# ✅ Separate Identities for Different Purposes
module "terraform_identity" {
  # For infrastructure management
}

module "application_identity" {
  # For application deployment only
}

module "monitoring_identity" {
  # For read-only monitoring
}
```

#### Secret Management
```hcl
# ✅ Use Key Vault for secrets
data "azurerm_key_vault_secret" "db_password" {
  name         = "database-password"
  key_vault_id = data.azurerm_key_vault.main.id
}

# ✅ Mark sensitive variables
variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
  sensitive   = true
}

# ✅ Use sensitive outputs
output "connection_string" {
  value     = "Server=${azurerm_sql_server.main.fully_qualified_domain_name}..."
  sensitive = true
}
```

### Documentation and Maintenance

#### Documentation Template
```markdown
# Managed Identity Configuration

## Overview
This configuration creates managed identities for automated deployments.

## Identities Created
- **terraform-prod-identity**: Infrastructure management
- **jenkins-prod-identity**: Application deployment
- **monitoring-prod-identity**: Read-only monitoring

## Permissions Assigned
| Identity | Scope | Role | Purpose |
|----------|-------|------|---------|
| terraform-prod | Subscription | Contributor | Infrastructure management |
| jenkins-prod | App RG | Contributor | Application deployment |
| monitoring-prod | Subscription | Reader | Monitoring and alerting |

## Usage
1. Deploy identities: `terraform apply`
2. Configure Jenkins with client ID
3. Update Terraform provider configuration
4. Test all operations

## Troubleshooting
See [troubleshooting guide](docs/troubleshooting.md)

## Contacts
- Owner: Platform Engineering Team
- Support: devops@company.com
```

#### Maintenance Schedule
```bash
# Monthly tasks
# ✅ Review role assignments
az role assignment list --assignee "PRINCIPAL_ID" --output table

# ✅ Check for unused identities
az identity list --query "[?!(tags.InUse)]" --output table

# ✅ Update module versions
# Check catalog for new versions and update source URLs

# ✅ Security audit
# Review permissions and remove unnecessary access

# Quarterly tasks
# ✅ Full security review
# ✅ Disaster recovery test
# ✅ Documentation update
# ✅ Team training refresh
```

### Disaster Recovery

#### Backup Procedures
```bash
# Backup Terraform state
az storage blob download \
  --account-name tfstate \
  --container-name tfstate \
  --name prod/terraform.tfstate \
  --file "terraform-$(date +%Y%m%d).tfstate.backup" \
  --auth-mode login

# Export current configuration
terraform show -json > "terraform-config-$(date +%Y%m%d).json"

# Document current role assignments
az role assignment list --all --output json > "role-assignments-$(date +%Y%m%d).json"
```

#### Recovery Procedures
```bash
# Restore from backup if needed
az storage blob upload \
  --account-name tfstate \
  --container-name tfstate \
  --name prod/terraform.tfstate \
  --file terraform-backup.tfstate \
  --auth-mode login \
  --overwrite

# Recreate managed identities if needed
terraform import module.terraform_managed_identity.azurerm_user_assigned_identity.this \
  "/subscriptions/SUB_ID/resourceGroups/RG_NAME/providers/Microsoft.ManagedIdentity/userAssignedIdentities/IDENTITY_NAME"

# Verify and fix role assignments
terraform plan
terraform apply
```

## Summary and Next Steps

### Key Takeaways

1. **Managed Identity Benefits**:
   - ✅ No credential management
   - ✅ Automatic credential rotation  
   - ✅ Better security posture
   - ✅ Simplified authentication

2. **Implementation Approach**:
   - 🏗️ Use enterprise catalog modules
   - 🔄 Migrate environment by environment
   - 🧪 Test thoroughly in development
   - 📋 Follow naming conventions

3. **Best Practices**:
   - 🎯 Principle of least privilege
   - 🔒 Separate identities for different purposes
   - 📊 Monitor and audit regularly
   - 📚 Document everything

### Your Next Steps

#### Week 1: Setup and Planning
1. **Review current Service Principals** using Azure Portal
2. **Document existing roles and permissions**
3. **Set up development environment**
4. **Test catalog module access**

#### Week 2: Development Implementation
1. **Create development managed identities**
2. **Update Terraform configuration**
3. **Test all operations thoroughly**
4. **Update Jenkins pipeline**

#### Week 3: Production Planning
1. **Review security requirements**
2. **Plan production deployment**
3. **Prepare rollback procedures**
4. **Schedule deployment window**

#### Week 4: Production Migration
1. **Deploy production managed identities**
2. **Update production configuration**
3. **Monitor for issues**
4. **Validate all operations**

#### Week 5: Cleanup and Optimization
1. **Remove old Service Principals**
2. **Update documentation**
3. **Train team members**
4. **Optimize and improve**

### Quick Reference Commands

```bash
# Essential Terraform Commands
terraform init                    # Initialize configuration
terraform plan                    # Preview changes
terraform apply                   # Apply changes
terraform destroy                 # Remove resources
terraform state list              # List resources
terraform output                  # Show outputs

# Essential Azure CLI Commands
az login --identity               # Login with managed identity
az account show                   # Show current account
az identity list                  # List managed identities
az role assignment list           # List role assignments

# Debugging Commands
export TF_LOG=DEBUG              # Enable debug logging
terraform console                # Interactive console
terraform validate               # Validate configuration
terraform fmt                    # Format code
```

This comprehensive guide provides everything you need to successfully migrate from Service Principal to Managed Identity using your enterprise catalog modules. Remember to always test in development first and follow your organization's change management procedures for production deployments.
# MAIN CONFIGURATION FILE
# ==============================================================================
# This is where you define WHAT you want to create
# Think of this as the "shopping list" for Azure resources

# Create a resource group (like creating a folder for your stuff)
resource "azurerm_resource_group" "identity_management" {
  name     = "rg-identity-${var.environment}"
  location = var.azure_region
  
  tags = var.common_tags
}

# Use a catalog module to create managed identity
module "terraform_managed_identity" {
  source = var.catalog_managed_identity_source
  
  # Inputs to the module (like filling out a form)
  name                = "terraform-${var.environment}-identity"
  resource_group_name = azurerm_resource_group.identity_management.name
  location           = azurerm_resource_group.identity_management.location
  
  tags = merge(var.common_tags, {
    Purpose = "Terraform Automation"
  })
}

# Assign roles using catalog module
module "terraform_contributor_role" {
  source = var.catalog_role_assignment_source
  
  scope                = "/subscriptions/${var.subscription_id}"
  role_definition_name = "Contributor"
  principal_id         = module.terraform_managed_identity.principal_id
  
  description = "Terraform infrastructure management"
}
```

#### 2. variables.tf - Configuration Settings
**Purpose**: Define what settings can be customized

```hcl
# ==============================================================================
# VARIABLE DEFINITIONS
# ==============================================================================
# These are like "settings" that can be changed for different environments
# Think of these as "knobs and dials" you can adjust

# Required Variables (must be provided)
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "azure_region" {
  description = "Azure region where resources will be created"
  type        = string
  
  validation {
    condition = contains([
      "East US", "West US 2", "Central US", 
      "North Europe", "West Europe", "Southeast Asia"
    ], var.azure_region)
    error_message = "Must be an approved Azure region."
  }
}

variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
  sensitive   = true
  
  validation {
    condition     = can(regex("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", var.subscription_id))
    error_message = "Must be a valid Azure subscription GUID."
  }
}

# Optional Variables (have defaults)
variable "project_name" {
  description = "Name of the project for resource naming"
  type        = string
  default     = "managed-identity-migration"
}

variable "cost_center" {
  description = "Cost center for billing and chargeback"
  type        = string
  default     = "IT-Infrastructure"
}

variable "owner_team" {
  description = "Team responsible for these resources"
  type        = string
  default     = "DevOps Team"
}

# Complex Variables
variable "common_tags" {
  description = "Common tags applied to all resources"
  type        = map(string)
  default = {
    ManagedBy   = "Terraform"
    CreatedBy   = "DevOps Team"
    Purpose     = "Identity Management"
  }
}

# Catalog Module Sources
variable "catalog_managed_identity_source" {
  description = "Source URL for managed identity catalog module"
  type        = string
  default     = "git::https://dev.azure.com/your-company/terraform-catalog/_git/modules//managed-identity?ref=v1.0.0"
}

variable "catalog_role_assignment_source" {
  description = "Source URL for role assignment catalog module"
  type        = string
  default     = "git::https://dev.azure.com/your-company/terraform-catalog/_git/modules//role-assignment?ref=v1.0.0"
}

# Data type examples
variable "allowed_ip_addresses" {
  description = "List of IP addresses allowed to access resources"
  type        = list(string)
  default     = ["10.0.0.0/8", "172.16.0.0/12"]
}

variable "environment_settings" {
  description = "Environment-specific configuration"
  type = object({
    instance_count = number
    vm_size       = string
    backup_enabled = bool
  })
  default = {
    instance_count = 1
    vm_size       = "Standard_B2s"
    backup_enabled = true
  }
}
```

#### 3. terraform.tfvars - Actual Values
**Purpose**: The actual values for your variables (environment-specific)

```hcl
# ==============================================================================
# VARIABLE VALUES - PRODUCTION ENVIRONMENT
# ==============================================================================
# These are the ACTUAL values for production
# Think of this as "filling out the form" with real information

# Core Configuration
environment    = "prod"
azure_region   = "East US"
subscription_id = "12345678-1234-1234-1234-123456789012"

# Project Information
project_name = "managed-identity-migration"
cost_center  = "IT-Infrastructure-001"
owner_team   = "Platform Engineering Team"

# Tags for all resources
common_tags = {
  Environment     = "Production"
  Project         = "Managed Identity Migration"
  Owner          = "Platform Engineering Team"
  CostCenter     = "IT-Infrastructure-001"
  ManagedBy      = "Terraform"
  CreatedDate    = "2024-01-15"
  BusinessUnit   = "Technology"
  Compliance     = "SOX,PCI"
  DataClass      = "Internal"
  BackupRequired = "true"
}

# Catalog Module Sources (Production Versions)
catalog_managed_identity_source = "git::https://dev.azure.com/your-company/terraform-catalog/_git/modules//managed-identity?ref=v1.5.0"
catalog_role_assignment_source  = "git::https://dev.azure.com/your-company/terraform-catalog/_git/modules//role-assignment?ref=v1.2.0"

# Network Configuration
allowed_ip_addresses = [
  "10.0.0.0/8",      # Corporate network
  "172.16.0.0/12",   # VPN network
  "192.168.1.0/24"   # Office network
]

# Environment-specific settings
environment_settings = {
  instance_count = 3
  vm_size       = "Standard_D4s_v3"
  backup_enabled = true
}
```

#### 4. outputs.tf - Results and Information
**Purpose**: Define what information to display after creation

```hcl
# ==============================================================================
# OUTPUT DEFINITIONS
# ==============================================================================
# These are the "results" you want to see after creating resources
# Think of these as "receipts" showing what was built

# Managed Identity Information
output "terraform_managed_identity_client_id" {
  description = "Client ID for Terraform Managed Identity (use in provider config)"
  value       = module.terraform_managed_identity.client_id
  sensitive   = false
}

output "terraform_managed_identity_principal_id" {
  description = "Principal ID for additional role assignments"
  value       = module.terraform_managed_identity.principal_id
  sensitive   = false
}

output "terraform_managed_identity_name" {
  description = "Name of the Terraform managed identity"
  value       = module.terraform_managed_identity.name
  sensitive   = false
}

# Resource Group Information
output "resource_group_name" {
  description = "Name of the resource group containing identities"
  value       = azurerm_resource_group.identity_management.name
}

output "resource_group_location" {
  description = "Location of the resource group"
  value       = azurerm_resource_group.identity_management.location
}

# Complex Outputs for Other Terraform Configurations
output "identity_configuration" {
  description = "Complete managed identity configuration for reuse"
  value = {
    terraform_identity = {
      name         = module.terraform_managed_identity.name
      client_id    = module.terraform_managed_identity.client_id
      principal_id = module.terraform_managed_identity.principal_id
      resource_id  = module.terraform_managed_identity.id
    }
    resource_group = {
      name     = azurerm_resource_group.identity_management.name
      location = azurerm_resource_group.identity_management.location
      id       = azurerm_resource_group.identity_management.id
    }
  }
}

# Sensitive Outputs (won't show in logs)
output "subscription_id" {
  description = "Azure subscription ID used"
  value       = var.subscription_id
  sensitive   = true
}

# Formatted Outputs for Documentation
output "deployment_summary" {
  description = "Summary of deployed resources"
  value = <<-EOT
    Deployment Summary:
    - Environment: ${var.environment}
    - Region: ${var.azure_region}
    - Resource Group: ${azurerm_resource_group.identity_management.name}
    - Managed Identity: ${module.terraform_managed_identity.name}
    - Client ID: ${module.terraform_managed_identity.client_id}
  EOT
}
```

#### 5. provider.tf - Azure Connection Configuration
**Purpose**: Configure how Terraform connects to Azure

```hcl
# ==============================================================================
# PROVIDER CONFIGURATION
# ==============================================================================
# This tells Terraform HOW to connect to Azure
# Think of this as "login credentials" for Azure

terraform {
  # Specify Terraform version requirements
  required_version = ">= 1.0"
  
  # Specify provider requirements
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"  # Use version 3.x.x
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}

# Configure Azure Provider
provider "azurerm" {
  # Enable all Azure features
  features {
    # Customize provider behavior
    resource_group {
      prevent_deletion_if_contains_resources = true
    }
    
    key_vault {
      purge_soft_delete_on_destroy    = false
      recover_soft_deleted_key_vaults = true
    }
  }
  
  # OLD WAY - Service Principal (commented out)
  # client_id       = var.client_id
  # client_secret   = var.client_secret
  # tenant_id       = var.tenant_id
  # subscription_id = var.subscription_id
  
  # NEW WAY - Managed Identity
  use_msi = true
  
  # If using user-assigned managed identity, specify client_id
  # client_id = "12345678-1234-1234-1234-123456789012"
  
  # Optional: Specify subscription if different from default
  # subscription_id = var.subscription_id
}

# Additional providers if needed
provider "random" {
  # Random provider for generating unique names
}
```

#### 6. backend.tf - State Storage Configuration
**Purpose**: Configure where Terraform stores its memory (state file)

```hcl
# ==============================================================================
# BACKEND CONFIGURATION
# ==============================================================================
# This tells Terraform WHERE to store its "memory" (state file)
# Think of this as choosing where to save your work

terraform {
  backend "azurerm" {
    # WHERE to store the state file
    resource_group_name  = "rg-terraform-state-prod"
    storage_account_name = "tfstateprod12345"
    container_name       = "tfstate"
    key                  = "managed-identity/production.tfstate"
    
    # OLD WAY - Service Principal authentication (commented out)
    # client_id     = "your-service-principal-id"
    # client_secret = "your-service-principal-secret"
    # tenant_id     = "your-tenant-id"
    
    # NEW WAY - Managed Identity authentication
    use_msi = true
    
    # Optional: If using user-assigned managed identity
    # client_id = "your-managed-identity-client-id"
    
    # Optional: Specify subscription if different
    # subscription_id = "your-subscription-id"
  }
}
```

### Supporting Files

#### .gitignore - Files to Exclude from Git
```bash
# ==============================================================================
# GIT IGNORE FILE
# ==============================================================================
# These files should NOT be stored in Git (security and cleanup)

# Terraform files
*.tfstate           # State files contain sensitive info
*.tfstate.*         # State backup files
.terraform/         # Provider downloads
.terraform.lock.hcl # Lock file (optional to exclude)
terraform.tfplan    # Plan files
*.tfvars.backup     # Backup files

# Sensitive files
*.pem               # Private keys
*.key               # Private keys
secrets.txt         # Any secrets
.env                # Environment files

# IDE files
.vscode/            # VS Code settings
.idea/              # IntelliJ settings
*.swp               # Vim swap files
*~                  # Backup files

# OS files
.DS_Store           # macOS files
Thumbs.db           # Windows files
```

#### README.md - Project Documentation
```markdown
# Managed Identity Migration Project

## Overview
This project migrates from Azure Service Principal to Managed Identity for Terraform automation.

## Prerequisites
- Terraform >= 1.0
- Azure CLI
- Access to company Terraform catalog

## Quick Start
1. Clone repository
2. Navigate to environment folder: `cd environments/dev`
3. Initialize: `terraform init`
4. Plan: `terraform plan`
5. Apply: `terraform apply`

## Environments
- **dev**: Development environment
- **staging**: Staging environment  
- **prod**: Production environment

## Usage
See individual environment folders for specific configurations.
```

---

## Variable Naming Conventions

### Terraform Naming Best Practices

#### 1. Variable Names
```hcl
# ✅ GOOD: Use snake_case (lowercase with underscores)
variable "resource_group_name" {}
variable "environment_type" {}
variable "azure_region" {}
variable "cost_center_code" {}

# ❌ BAD: Don't use these patterns
variable "ResourceGroupName" {}  # PascalCase
variable "resourceGroupName" {}  # camelCase
variable "resource-group-name" {} # kebab-case
variable "rg_name" {}            # Too abbreviated
```

#### 2. Resource Names
```hcl
# ✅ GOOD: Descriptive and consistent
resource "azurerm_resource_group" "identity_management" {
  name = "rg-identity-${var.environment}"
}

resource "azurerm_storage_account" "terraform_state" {
  name = "tfstate${var.environment}${random_string.suffix.result}"
}

# ❌ BAD: Unclear or inconsistent
resource "azurerm_resource_group" "rg1" {}
resource "azurerm_storage_account" "sa" {}
```

#### 3. Module Names
```hcl
# ✅ GOOD: Clear purpose
module "terraform_managed_identity" {}
module "jenkins_deployment_identity" {}
module "monitoring_role_assignment" {}

# ❌ BAD: Unclear purpose  
module "identity1" {}
module "mi" {}
module "thing" {}
```

### Azure Resource Naming Conventions

#### Standard Naming Pattern
```
[resource-type]-[project/application]-[environment]-[region]-[instance]

Examples:
- rg-identity-prod-eastus-001          (Resource Group)
- st-tfstate-prod-eastus-001           (Storage Account)
- kv-secrets-prod-eastus-001           (Key Vault)
- vm-web-prod-eastus-001               (Virtual Machine)
```

#### Resource Type Abbreviations
```hcl
# Resource Groups
"rg-identity-${var.environment}"

# Storage Accounts (no dashes, lowercase only)
"stterraform${var.environment}${random_string.suffix.result}"

# Key Vaults  
"kv-secrets-${var.environment}"

# Virtual Machines
"vm-terraform-${var.environment}"

# Managed Identities
"mi-terraform-${var.environment}"
```

#### Variable Naming by Category

**Environment Variables**
```hcl
variable "environment" {}           # dev, staging, prod
variable "azure_region" {}          # East US, West Europe
variable "subscription_id" {}       # Azure subscription GUID
```

**Project Variables**
```hcl
variable "project_name" {}          # Project identifier
variable "application_name" {}      # Application identifier  
variable "cost_center" {}           # Billing/chargeback
variable "owner_team" {}            # Responsible team
```

**Technical Variables**
```hcl
variable "instance_count" {}        # Number of instances
variable "vm_size" {}               # Azure VM SKU
variable "storage_tier" {}          # Storage performance tier
variable "backup_enabled" {}        # Boolean for backup
```

**Network Variables**
```hcl
variable "virtual_network_name" {}  # VNet name
variable "subnet_address_prefix" {} # Subnet CIDR
variable "allowed_ip_addresses" {}  # Security whitelist
```

---

## Azure Managed Identity Concepts

### Understanding Identity Types (ELI5)

#### Service Principal vs Managed Identity
```
🏢 Service Principal (Old Way):
├── 👤 Like an employee with username/password
├── 🔑 You manage the password
├── 😰 Password can be stolen or forgotten
├── 🔄 You must rotate passwords regularly
└── 📝 Lots of manual management

🤖 Managed Identity (New Way):
├── 🆔 Like an employee with smart badge
├── 🔐 Azure manages the "password" automatically
├── 😌 No secrets to steal or forget
├── 🔄 Azure rotates credentials automatically  
└── 🎯 Less management, more security
```

### Types of Managed Identities

#### System-Assigned Managed Identity
```hcl
# Automatically created with the resource
# Dies when the resource is deleted
# One identity per resource

resource "azurerm_virtual_machine" "example" {
  # ... other configuration
  
  identity {
    type = "SystemAssigned"
  }
}

# Think of this like: "Employee badge tied to specific office desk"
```

#### User-Assigned Managed Identity
```hcl
# Created independently
# Can be assigned to multiple resources
# Survives resource deletion

resource "azurerm_user_assigned_identity" "example" {
  name                = "terraform-identity"
  resource_group_name = azurerm_resource_group.example.name
  location           = azurerm_resource_group.example.location
}

# Think of this like: "Employee badge that can work at different desks"
```

### When to Use Which Type

#### Use System-Assigned When:
- ✅ One resource needs one identity
- ✅ Identity tied to resource lifecycle
- ✅ Simple scenarios
- ✅ Azure Functions, Logic Apps

#### Use User-Assigned When:
- ✅ Multiple resources need same identity
- ✅ Identity should survive resource deletion
- ✅ Complex scenarios with role inheritance
- ✅ Virtual Machines, Container Instances
- ✅ **Terraform automation** (our use case)

### Role-Based Access Control (RBAC)

#### Common Azure Roles for Terraform
```hcl
# Contributor - Can create, modify, delete resources
role_definition_name = "Contributor"
scope = "/subscriptions/${var.subscription_id}"

# Reader - Can only view resources
role_definition_name = "Reader"  
scope = "/subscriptions/${var.subscription_id}"

# Storage Blob Data Contributor - Can read/write blobs
role_definition_name = "Storage Blob Data Contributor"
scope = "/subscriptions/${var.subscription_id}/resourceGroups/rg-storage/providers/Microsoft.Storage/storageAccounts/mystorageaccount"

# Key Vault Secrets User - Can read secrets
role_definition_name = "Key Vault Secrets User"
scope = "/subscriptions/${var.subscription_id}/resourceGroups/rg-security/providers/Microsoft.KeyVault/vaults/mykeyvault"
```

#### Scope Levels (Where Permissions Apply)
```
🌍 Management Group Level
└── 📋 Subscription Level          # Entire subscription
    └── 📁 Resource Group Level     # Specific resource group
        └── 🔧 Resource Level       # Individual resource
```

---

## Migration Strategy

### Phase-by-Phase Migration Plan

#### Phase 1: Assessment and Planning (Week 1)
```
Tasks:
✅ Document current Service Principals
✅ Identify which ones to migrate  
✅ Plan new identity structure
✅ Set up development environment
✅ Test catalog modules
```

#### Phase 2: Development Environment (Week 2)
```
Tasks:
✅ Create managed identities in dev
✅ Assign appropriate roles
✅ Update Terraform configuration
✅ Test all operations
✅ Validate Jenkins pipeline
```

#### Phase 3: Staging Environment (Week 3)
```
Tasks:
✅ Deploy to staging environment
✅ Full end-to-end testing
✅ Performance validation
✅ Security review
✅ Documentation update
```

#### Phase 4: Production Migration (Week 4)
```
Tasks:
✅ Create production managed identities
✅ Update production configuration
✅ Monitor for issues
✅ Validate all operations
✅ Keep Service Principal as backup
```

#### Phase 5: Cleanup and Optimization (Week 5)
```
Tasks:
✅ Remove old Service Principals
✅ Update documentation
✅ Team training
✅ Process optimization
✅ Security audit
```

### Risk Mitigation Strategies

#### Backup and Rollback Plan
```hcl
# Keep both configurations during transition
# Old configuration (commented out, ready for rollback)
/*
provider "azurerm" {
  features {}
  client_id       = var.client_id
  client_secret   = var.client_secret
  tenant_id       = var.tenant_id
  subscription_id = var.subscription_id
}
*/

# New configuration (active)
provider "azurerm" {
  features {}
  use_msi = true
  # client_id = module.terraform_managed_identity.client_id
}
```

#### Testing Checklist
```bash
# Test 1: Authentication
terraform init

# Test 2: Plan generation
terraform plan

# Test 3: Resource creation
terraform apply -auto-approve

# Test 4: State file access
terraform state list

# Test 5: Resource modification
terraform apply -auto-approve

# Test 6: Resource destruction
terraform destroy -auto-approve
```

---

## Complete Implementation

### Development Environment Implementation

#### environments/dev/main.tf
```hcl
# ==============================================================================
# DEVELOPMENT ENVIRONMENT - MANAGED IDENTITY CONFIGURATION
# ==============================================================================
# This creates managed identities for development environment
# Safe to test and experiment here without affecting production

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}

# Generate random suffix for unique names
resource "random_string" "suffix" {
  length  = 4
  special = false
  upper   = false
}

# ==============================================================================
# RESOURCE GROUP FOR IDENTITY MANAGEMENT
# ==============================================================================
# Using catalog module for resource group (company standards)
module "identity_resource_group" {
  source = var.catalog_resource_group_source
  
  name     = "rg-identity-${var.environment}-${random_string.suffix.result}"
  location = var.azure_region
  
  tags = merge(var.common_tags, {
    Purpose = "Identity Management"
    Scope   = "Development"
  })
}

# ==============================================================================
# MANAGED IDENTITY FOR TERRAFORM
# ==============================================================================
# This identity will replace the Service Principal for Terraform operations
module "terraform_managed_identity" {
  source = var.catalog_managed_identity_source
  
  name                = "mi-terraform-${var.environment}-${random_string.suffix.result}"
  resource_group_name = module.identity_resource_group.name
  location           = module.identity_resource_group.location
  
  description = "Managed Identity for Terraform operations in ${var.environment} environment"
  
  tags = merge(var.common_tags, {
    Purpose     = "Terraform Automation"
    Environment = var.environment
    Component   = "Infrastructure"
  })
}

# ==============================================================================
# MANAGED IDENTITY FOR JENKINS
# ==============================================================================
# Separate identity for Jenkins deployments (principle of least privilege)
module "jenkins_managed_identity" {
  source = var.catalog_managed_identity_source
  
  name                = "mi-jenkins-${var.environment}-${random_string.suffix.result}"
  resource_group_name = module.identity_resource_group.name
  location           = module.identity_resource_group.location
  
  description = "Managed Identity for Jenkins deployments in ${var.environment} environment"
  
  tags = merge(var.common_tags, {
    Purpose     = "Application Deployment"
    Environment = var.environment
    Component   = "CI/CD"
  })
}

# ==============================================================================




# Why main.tf Differs Between Environments & Better Approaches

## The Problem: Different main.tf Files (ELI5)

Think of environments like **different versions of the same building**:
- **Development** = Small prototype house (cheaper, simpler)
- **Production** = Full-scale mansion (expensive, complex, secure)

Even though they're the "same house," they need different features!

## Why main.tf Currently Differs

### Current Approach (What I Showed Earlier)
```
environments/
├── dev/main.tf      ← Different content
├── staging/main.tf  ← Different content  
└── prod/main.tf     ← Different content
```

### Differences You'll See:

#### 1. **Different Resources per Environment**
```hcl
# DEV main.tf - Simple setup
module "terraform_identity" {
  source = "catalog-url//managed-identity"
  name   = "terraform-dev-identity"
}

# PROD main.tf - Complex setup with monitoring
module "terraform_identity" {
  source = "catalog-url//managed-identity" 
  name   = "terraform-prod-identity"
}

module "monitoring_identity" {        # ← Only in production
  source = "catalog-url//managed-identity"
  name   = "monitoring-prod-identity"
}

module "backup_identity" {            # ← Only in production
  source = "catalog-url//managed-identity"
  name   = "backup-prod-identity"
}
```

#### 2. **Different Security Requirements**
```hcl
# DEV main.tf - Relaxed security
provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false  # Allow deletion
    }
    key_vault {
      purge_soft_delete_on_destroy = true  # Clean up completely
    }
  }
}

# PROD main.tf - Strict security
provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = true   # Prevent accidents
    }
    key_vault {
      purge_soft_delete_on_destroy = false  # Keep deleted items for recovery
    }
  }
}
```

#### 3. **Different Permission Scopes**
```hcl
# DEV main.tf - Limited scope
module "terraform_role" {
  scope = "/subscriptions/sub-id/resourceGroups/rg-dev"  # Only dev RG
  role  = "Contributor"
}

# PROD main.tf - Broader scope
module "terraform_role" {
  scope = "/subscriptions/sub-id"  # Entire subscription
  role  = "Contributor"
}
```

## Better Approaches: DRY (Don't Repeat Yourself)

### Approach 1: Shared Module with Conditional Logic

#### Create: modules/managed-identity-stack/main.tf
```hcl
# ==============================================================================
# SHARED MODULE FOR ALL ENVIRONMENTS
# ==============================================================================
# This module contains ALL the logic, but uses conditions to enable/disable features

locals {
  # Environment-specific settings
  environment_config = {
    dev = {
      enable_monitoring_identity = false
      enable_backup_identity     = false
      enable_advanced_security   = false
      role_scope_level          = "resource_group"  # Limited scope
      backup_tier               = "Standard"
    }
    staging = {
      enable_monitoring_identity = true
      enable_backup_identity     = false
      enable_advanced_security   = true
      role_scope_level          = "resource_group"
      backup_tier               = "Premium"
    }
    prod = {
      enable_monitoring_identity = true
      enable_backup_identity     = true
      enable_advanced_security   = true
      role_scope_level          = "subscription"  # Full scope
      backup_tier               = "Premium"
    }
  }
  
  # Get current environment config
  current_config = local.environment_config[var.environment]
}

# Generate random suffix for unique names
resource "random_string" "suffix" {
  length  = 4
  special = false
  upper   = false
}

# ==============================================================================
# RESOURCE GROUP (Always created)
# ==============================================================================
module "identity_resource_group" {
  source = var.catalog_resource_group_source
  
  name     = "rg-identity-${var.environment}-${random_string.suffix.result}"
  location = var.azure_region
  
  tags = merge(var.common_tags, {
    Environment = var.environment
    Purpose     = "Identity Management"
  })
}

# ==============================================================================
# TERRAFORM MANAGED IDENTITY (Always created)
# ==============================================================================
module "terraform_managed_identity" {
  source = var.catalog_managed_identity_source
  
  name                = "mi-terraform-${var.environment}-${random_string.suffix.result}"
  resource_group_name = module.identity_resource_group.name
  location           = module.identity_resource_group.location
  
  description = "Terraform Managed Identity for ${var.environment} environment"
  
  tags = merge(var.common_tags, {
    Purpose     = "Terraform Automation"
    Environment = var.environment
  })
}

# ==============================================================================
# JENKINS MANAGED IDENTITY (Always created)
# ==============================================================================
module "jenkins_managed_identity" {
  source = var.catalog_managed_identity_source
  
  name                = "mi-jenkins-${var.environment}-${random_string.suffix.result}"
  resource_group_name = module.identity_resource_group.name
  location           = module.identity_resource_group.location
  
  description = "Jenkins Managed Identity for ${var.environment} environment"
  
  tags = merge(var.common_tags, {
    Purpose     = "Application Deployment"
    Environment = var.environment
  })
}

# ==============================================================================
# MONITORING IDENTITY (Conditional - only staging and prod)
# ==============================================================================
module "monitoring_managed_identity" {
  count  = local.current_config.enable_monitoring_identity ? 1 : 0
  source = var.catalog_managed_identity_source
  
  name                = "mi-monitoring-${var.environment}-${random_string.suffix.result}"
  resource_group_name = module.identity_resource_group.name
  location           = module.identity_resource_group.location
  
  description = "Monitoring Managed Identity for ${var.environment} environment"
  
  tags = merge(var.common_tags, {
    Purpose     = "Monitoring and Alerting"
    Environment = var.environment
  })
}

# ==============================================================================
# BACKUP IDENTITY (Conditional - only prod)
# ==============================================================================
module "backup_managed_identity" {
  count  = local.current_config.enable_backup_identity ? 1 : 0
  source = var.catalog_managed_identity_source
  
  name                = "mi-backup-${var.environment}-${random_string.suffix.result}"
  resource_group_name = module.identity_resource_group.name
  location           = module.identity_resource_group.location
  
  description = "Backup Managed Identity for ${var.environment} environment"
  
  tags = merge(var.common_tags, {
    Purpose     = "Backup Operations"
    Environment = var.environment
  })
}

# ==============================================================================
# TERRAFORM ROLE ASSIGNMENT (Environment-specific scope)
# ==============================================================================
module "terraform_role_assignment" {
  source = var.catalog_role_assignment_source
  
  # Dynamic scope based on environment
  scope = local.current_config.role_scope_level == "subscription" ? (
    "/subscriptions/${var.subscription_id}"
  ) : (
    module.identity_resource_group.id
  )
  
  role_definition_name = "Contributor"
  principal_id         = module.terraform_managed_identity.principal_id
  
  description = "Terraform ${var.environment} infrastructure management"
}

# ==============================================================================
# MONITORING ROLE ASSIGNMENT (Conditional)
# ==============================================================================
module "monitoring_role_assignment" {
  count  = local.current_config.enable_monitoring_identity ? 1 : 0
  source = var.catalog_role_assignment_source
  
  scope                = "/subscriptions/${var.subscription_id}"
  role_definition_name = "Reader"
  principal_id         = module.monitoring_managed_identity[0].principal_id
  
  description = "Monitoring ${var.environment} read access"
}

# ==============================================================================
# ADVANCED SECURITY FEATURES (Conditional)
# ==============================================================================
module "advanced_security" {
  count  = local.current_config.enable_advanced_security ? 1 : 0
  source = var.catalog_security_module_source
  
  managed_identity_ids = [
    module.terraform_managed_identity.id,
    module.jenkins_managed_identity.id
  ]
  
  environment = var.environment
  
  security_settings = {
    enable_conditional_access = true
    enable_audit_logging     = true
    enable_threat_detection  = true
  }
}
```

#### Now Each Environment Uses the SAME Module:

**environments/dev/main.tf**
```hcl
# ==============================================================================
# DEVELOPMENT ENVIRONMENT
# ==============================================================================
# This file is now SIMPLE - just calls the shared module

terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {
    # Development-specific provider settings
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
    key_vault {
      purge_soft_delete_on_destroy = true
    }
  }
  use_msi = true
}

# Call the shared module with dev-specific variables
module "managed_identity_stack" {
  source = "../../modules/managed-identity-stack"
  
  # Environment-specific inputs
  environment     = "dev"
  azure_region    = var.azure_region
  subscription_id = var.subscription_id
  
  # Common settings
  common_tags = var.common_tags
  
  # Catalog sources
  catalog_resource_group_source    = var.catalog_resource_group_source
  catalog_managed_identity_source  = var.catalog_managed_identity_source
  catalog_role_assignment_source   = var.catalog_role_assignment_source
  catalog_security_module_source   = var.catalog_security_module_source
}
```

**environments/prod/main.tf**
```hcl
# ==============================================================================
# PRODUCTION ENVIRONMENT  
# ==============================================================================
# This file is IDENTICAL to dev - only variables change!

terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {
    # Production-specific provider settings
    resource_group {
      prevent_deletion_if_contains_resources = true
    }
    key_vault {
      purge_soft_delete_on_destroy = false
    }
  }
  use_msi = true
}

# Same module call, different environment
module "managed_identity_stack" {
  source = "../../modules/managed-identity-stack"
  
  # Only this changes!
  environment     = "prod"  # ← This drives all the differences
  azure_region    = var.azure_region
  subscription_id = var.subscription_id
  
  common_tags = var.common_tags
  
  catalog_resource_group_source    = var.catalog_resource_group_source
  catalog_managed_identity_source  = var.catalog_managed_identity_source
  catalog_role_assignment_source   = var.catalog_role_assignment_source
  catalog_security_module_source   = var.catalog_security_module_source
}
```

### Approach 2: Using Terraform Workspaces

#### Single main.tf for ALL Environments
```hcl
# ==============================================================================
# SINGLE MAIN.TF FOR ALL ENVIRONMENTS
# ==============================================================================
# Uses terraform.workspace to determine behavior

locals {
  # Environment detection
  environment = terraform.workspace
  
  # Environment-specific configuration
  config = {
    dev = {
      instance_count             = 1
      vm_size                   = "Standard_B2s"
      enable_monitoring         = false
      enable_backup            = false
      role_scope               = "resource_group"
    }
    staging = {
      instance_count             = 2
      vm_size                   = "Standard_D2s_v3"
      enable_monitoring         = true
      enable_backup            = false
      role_scope               = "resource_group"
    }
    prod = {
      instance_count             = 3
      vm_size                   = "Standard_D4s_v3"
      enable_monitoring         = true
      enable_backup            = true
      role_scope               = "subscription"
    }
  }
  
  current_config = local.config[local.environment]
}

# Resource group with environment-specific naming
module "identity_resource_group" {
  source = var.catalog_resource_group_source
  
  name     = "rg-identity-${local.environment}"
  location = var.azure_region
  
  tags = merge(var.common_tags, {
    Environment = local.environment
  })
}

# Terraform identity (always created)
module "terraform_managed_identity" {
  source = var.catalog_managed_identity_source
  
  name                = "mi-terraform-${local.environment}"
  resource_group_name = module.identity_resource_group.name
  location           = module.identity_resource_group.location
}

# Monitoring identity (conditional based on environment)
module "monitoring_managed_identity" {
  count  = local.current_config.enable_monitoring ? 1 : 0
  source = var.catalog_managed_identity_source
  
  name                = "mi-monitoring-${local.environment}"
  resource_group_name = module.identity_resource_group.name
  location           = module.identity_resource_group.location
}

# Environment-specific role assignments
module "terraform_role_assignment" {
  source = var.catalog_role_assignment_source
  
  scope = local.current_config.role_scope == "subscription" ? (
    "/subscriptions/${var.subscription_id}"
  ) : (
    module.identity_resource_group.id
  )
  
  role_definition_name = "Contributor"
  principal_id         = module.terraform_managed_identity.principal_id
}
```

#### Usage with Workspaces
```bash
# Create workspaces
terraform workspace new dev
terraform workspace new staging  
terraform workspace new prod

# Deploy to different environments
terraform workspace select dev
terraform apply

terraform workspace select prod
terraform apply
```

### Approach 3: Using .tfvars Files Only

#### Single main.tf + Environment-Specific Variables

**main.tf (same for all environments)**
```hcl
# ==============================================================================
# UNIVERSAL MAIN.TF 
# ==============================================================================
# All logic driven by variables

module "terraform_managed_identity" {
  source = var.catalog_managed_identity_source
  
  name                = "mi-terraform-${var.environment}"
  resource_group_name = var.resource_group_name
  location           = var.azure_region
}

# Conditional resources based on variables
module "monitoring_managed_identity" {
  count  = var.enable_monitoring_identity ? 1 : 0
  source = var.catalog_managed_identity_source
  
  name                = "mi-monitoring-${var.environment}"
  resource_group_name = var.resource_group_name
  location           = var.azure_region
}

module "terraform_role_assignment" {
  source = var.catalog_role_assignment_source
  
  scope                = var.terraform_role_scope
  role_definition_name = "Contributor"
  principal_id         = module.terraform_managed_identity.principal_id
}
```

**dev.tfvars**
```hcl
environment                = "dev"
enable_monitoring_identity = false
enable_backup_identity     = false
terraform_role_scope       = "/subscriptions/sub-id/resourceGroups/rg-dev"
vm_size                   = "Standard_B2s"
```

**prod.tfvars**
```hcl
environment                = "prod"
enable_monitoring_identity = true
enable_backup_identity     = true
terraform_role_scope       = "/subscriptions/sub-id"
vm_size                   = "Standard_D4s_v3"
```

**Usage:**
```bash
# Deploy to dev
terraform apply -var-file="dev.tfvars"

# Deploy to prod  
terraform apply -var-file="prod.tfvars"
```

## Recommendation: Which Approach to Use?

### **Best Approach: Shared Module with Conditional Logic**

**Why this is best for your situation:**

✅ **Single source of truth** - All logic in one place
✅ **Easy to maintain** - Change once, applies everywhere
✅ **Environment-specific features** - Can enable/disable features per environment
✅ **Follows DRY principle** - Don't repeat yourself
✅ **Enterprise-friendly** - Works well with catalog modules
✅ **Clear separation** - Environment differences are explicit

### **Implementation for Your Case:**

```
your-project/
├── modules/
│   └── managed-identity-stack/     # ← Shared module
│       ├── main.tf                 # ← All the logic
│       ├── variables.tf            # ← All inputs
│       └── outputs.tf              # ← All outputs
│
└── environments/
    ├── dev/
    │   ├── main.tf                 # ← Just calls shared module
    │   ├── terraform.tfvars        # ← Dev-specific values
    │   └── backend.tf              # ← Dev backend config
    ├── staging/
    │   ├── main.tf                 # ← Identical to dev
    │   ├── terraform.tfvars        # ← Staging-specific values  
    │   └── backend.tf              # ← Staging backend config
    └── prod/
        ├── main.tf                 # ← Identical to dev and staging
        ├── terraform.tfvars        # ← Prod-specific values
        └── backend.tf              # ← Prod backend config
```

### **Benefits in Practice:**

1. **Bug fixes** - Fix once in shared module, applies to all environments
2. **New features** - Add once, enable per environment as needed
3. **Consistency** - Same patterns across all environments
4. **Testing** - Test the module once, confident it works everywhere
5. **Onboarding** - New team members learn one pattern

This approach gives you the **flexibility of different configurations** while maintaining the **simplicity of shared code**!
