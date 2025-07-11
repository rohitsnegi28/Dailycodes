# Manual Azure Identity Discovery & Terraform Code Writing Guide

## Part 1: Manual Discovery Through Azure Portal

### Step 1: Find All Service Principals

#### Navigation Path:
```
Azure Portal → Azure Active Directory → App registrations → All applications
```

#### What to Look For:
Look for names containing:
- `terraform`
- `jenkins`
- `deploy`
- `automation`
- `ci`, `cd`
- `devops`
- `build`

#### Manual Documentation Template:
Create a table in Excel/Notepad and fill it out manually:

```
| Service Principal Name | Client ID | Object ID | Created Date | Owner | Purpose | Environment |
|------------------------|-----------|-----------|--------------|-------|---------|-------------|
| terraform-dev-sp       | 12345...  | 87654...  | 2023-01-15   | DevOps| Terraform | Development |
| jenkins-prod-sp        | 23456...  | 76543...  | 2023-02-20   | DevOps| Jenkins   | Production  |
| external-api-sp        | 34567...  | 65432...  | 2023-03-10   | IT    | API       | All         |
```

#### For Each Service Principal - Record These Details:

**Basic Information:**
1. **Display Name**: Copy from portal
2. **Application (client) ID**: Found in Overview tab
3. **Object ID**: Found in Overview tab  
4. **Directory (tenant) ID**: Found in Overview tab
5. **Created Date**: Found in Overview tab
6. **Owner**: Check the Owners tab

**Usage Information:**
1. **Description**: Check if there's a description
2. **Last sign-in**: Check Sign-ins logs if available
3. **Certificates & secrets**: Note if it has active secrets

### Step 2: Find All Managed Identities

#### Navigation Path:
```
Azure Portal → Search "Managed Identities" → Managed Identities
```

#### Manual Documentation Template:
```
| Managed Identity Name | Type | Client ID | Principal ID | Resource Group | Location | Associated Resource |
|-----------------------|------|-----------|--------------|----------------|----------|-------------------|
| vm-web-identity       | System| N/A      | 11111...     | rg-web         | East US  | vm-web-server     |
| mi-backup-prod        | User  | 22222... | 33333...     | rg-identity    | East US  | None              |
```

#### For Each Managed Identity - Record:
1. **Name**: Copy from portal
2. **Type**: System-assigned or User-assigned
3. **Client ID**: For user-assigned only
4. **Principal ID (Object ID)**: Always available
5. **Resource Group**: Where it's located
6. **Location**: Azure region
7. **Associated Resource**: What resource it's attached to (for system-assigned)

### Step 3: Find Role Assignments

#### Method 1: Subscription Level Roles
```
Azure Portal → Subscriptions → Your Subscription → Access control (IAM) → Role assignments
```

#### Method 2: Resource Group Level Roles
```
Azure Portal → Resource Groups → Your Resource Group → Access control (IAM) → Role assignments
```

#### Method 3: Resource Level Roles
```
Azure Portal → Any Resource → Access control (IAM) → Role assignments
```

#### Manual Documentation Template:
```
| Principal Name | Principal Type | Principal ID | Role | Scope | Scope Type | Notes |
|----------------|----------------|--------------|------|-------|------------|-------|
| terraform-dev-sp | Service Principal | 87654... | Contributor | /subscriptions/sub-id/resourceGroups/rg-dev | Resource Group | Dev infrastructure |
| terraform-dev-sp | Service Principal | 87654... | Storage Blob Data Contributor | /subscriptions/sub-id/.../storageAccounts/tfstate | Storage Account | Terraform state |
| jenkins-prod-sp | Service Principal | 76543... | Contributor | /subscriptions/sub-id/resourceGroups/rg-prod | Resource Group | Prod deployment |
```

#### For Each Role Assignment - Record:
1. **Principal Name**: The identity name
2. **Principal Type**: Service Principal, User, Group, or Managed Identity
3. **Principal ID**: The Object ID / Principal ID
4. **Role**: The role name (Contributor, Reader, etc.)
5. **Scope**: The full scope path
6. **Scope Type**: Subscription, Resource Group, or Resource
7. **Notes**: What this permission is used for

## Part 2: Manual Analysis and Planning

### Step 4: Categorize Your Service Principals

#### Create a Migration Planning Table:
```
| Service Principal | Current Use | Migration Action | Priority | Risk | Notes |
|-------------------|-------------|------------------|----------|------|-------|
| terraform-dev-sp | Terraform automation | ✅ Replace with MI | High | Low | Safe to migrate first |
| jenkins-prod-sp | Jenkins deployment | ✅ Replace with MI | High | High | Production system |
| external-api-sp | External API | ❌ Keep as SP | N/A | N/A | External system |
| old-test-sp | Unknown | 🗑️ Consider deletion | Low | Low | No recent activity |
```

#### Decision Criteria:

**✅ Replace with Managed Identity:**
- Used by Azure VMs
- Used by Azure Functions
- Used by Logic Apps
- Used by Jenkins running on Azure
- Used by Terraform
- Used by internal automation

**❌ Keep as Service Principal:**
- Used by external applications (outside Azure)
- Used by on-premises systems
- Used by third-party SaaS
- Used by mobile applications
- Required for cross-tenant access

**🗑️ Consider Deletion:**
- No role assignments
- No recent sign-ins
- Unknown purpose
- Duplicate of other identities

### Step 5: Plan Your New Identity Structure

#### Recommended New Structure:
```
🏭 PRODUCTION ENVIRONMENT:
├── mi-terraform-prod      (Infrastructure management)
├── mi-jenkins-prod        (Application deployment)
├── mi-monitoring-prod     (Read-only monitoring)
└── mi-backup-prod         (Backup operations)

🧪 DEVELOPMENT ENVIRONMENT:
├── mi-terraform-dev       (Infrastructure management)
├── mi-jenkins-dev         (Application deployment)
└── mi-testing-dev         (Automated testing)

🔧 SHARED SERVICES:
├── mi-keyvault-access     (Secret management)
├── mi-storage-backup      (Storage operations)
└── mi-container-registry  (Container operations)
```

## Part 3: Manual Terraform Code Writing

### Step 6: Write Terraform Code for Each Identity

#### Template 1: Basic Terraform Managed Identity

**File: terraform-managed-identity.tf**
```hcl
# ==============================================================================
# TERRAFORM MANAGED IDENTITY
# ==============================================================================
# This replaces: terraform-dev-sp (Client ID: 12345678-1234-1234-1234-123456789012)
# Migrated on: [DATE]
# Migrated by: [YOUR NAME]

# Random suffix for unique naming
resource "random_string" "terraform_suffix" {
  length  = 4
  special = false
  upper   = false
}

# Resource group for identity management
resource "azurerm_resource_group" "identity_management" {
  name     = "rg-identity-${var.environment}-${random_string.terraform_suffix.result}"
  location = var.azure_region
  
  tags = {
    Environment     = var.environment
    Purpose         = "Identity Management"
    ManagedBy      = "Terraform"
    CreatedBy      = "DevOps Team"
    CreatedDate    = "2024-01-15"  # Today's date
    Project        = "Managed Identity Migration"
    CostCenter     = "IT-Infrastructure"
  }
}

# Terraform managed identity
module "terraform_managed_identity" {
  source = var.catalog_managed_identity_source
  
  name                = "mi-terraform-${var.environment}-${random_string.terraform_suffix.result}"
  resource_group_name = azurerm_resource_group.identity_management.name
  location           = azurerm_resource_group.identity_management.location
  
  description = "Managed Identity for Terraform automation in ${var.environment} environment. Migrated from Service Principal terraform-dev-sp."
  
  tags = {
    Environment      = var.environment
    Purpose         = "Terraform Automation"
    Component       = "Infrastructure"
    MigratedFrom    = "terraform-dev-sp"
    MigrationDate   = "2024-01-15"  # Today's date
    BusinessOwner   = "Platform Engineering Team"
    TechnicalOwner  = "DevOps Team"
  }
}

# Role assignment: Contributor at Resource Group level
# This replaces the role that terraform-dev-sp had
module "terraform_contributor_role" {
  source = var.catalog_role_assignment_source
  
  # Scope: Resource Group level (safer than subscription)
  scope = azurerm_resource_group.identity_management.id
  
  # Role: Same as original Service Principal
  role_definition_name = "Contributor"
  
  # Identity: Our new managed identity
  principal_id = module.terraform_managed_identity.principal_id
  
  # Metadata for auditing
  description            = "Terraform infrastructure management for ${var.environment} environment"
  assigned_by           = "DevOps Team"
  business_justification = "Required for automated infrastructure deployment and management via Terraform"
}

# Role assignment: Storage Blob Data Contributor for Terraform state
# This replaces the storage access that terraform-dev-sp had
module "terraform_storage_role" {
  source = var.catalog_storage_role_assignment_source
  
  # Storage account details (update with your actual values)
  storage_account_name     = "tfstate${var.environment}12345"  # Your storage account name
  storage_resource_group   = "rg-terraform-state-${var.environment}"  # Your storage RG
  
  # Identity and role
  principal_id         = module.terraform_managed_identity.principal_id
  role_definition_name = "Storage Blob Data Contributor"
  
  # Metadata
  description = "Terraform state file access for ${var.environment} environment"
}

# Output the important information
output "terraform_managed_identity_details" {
  description = "Details of the Terraform managed identity"
  value = {
    name         = module.terraform_managed_identity.name
    client_id    = module.terraform_managed_identity.client_id
    principal_id = module.terraform_managed_identity.principal_id
    resource_id  = module.terraform_managed_identity.id
  }
}

# Quick reference for provider configuration
output "terraform_provider_config" {
  description = "Provider configuration for using this managed identity"
  value = <<-EOT
    provider "azurerm" {
      features {}
      use_msi   = true
      client_id = "${module.terraform_managed_identity.client_id}"
    }
  EOT
}
```

#### Template 2: Jenkins Managed Identity

**File: jenkins-managed-identity.tf**
```hcl
# ==============================================================================
# JENKINS MANAGED IDENTITY
# ==============================================================================
# This replaces: jenkins-prod-sp (Client ID: 23456789-2345-2345-2345-234567890123)
# Migrated on: [DATE]
# Migrated by: [YOUR NAME]

# Jenkins managed identity
module "jenkins_managed_identity" {
  source = var.catalog_managed_identity_source
  
  name                = "mi-jenkins-${var.environment}-${random_string.terraform_suffix.result}"
  resource_group_name = azurerm_resource_group.identity_management.name
  location           = azurerm_resource_group.identity_management.location
  
  description = "Managed Identity for Jenkins CI/CD automation in ${var.environment} environment. Migrated from Service Principal jenkins-prod-sp."
  
  tags = {
    Environment      = var.environment
    Purpose         = "Application Deployment"
    Component       = "CI/CD"
    MigratedFrom    = "jenkins-prod-sp"
    MigrationDate   = "2024-01-15"  # Today's date
    BusinessOwner   = "Application Development Team"
    TechnicalOwner  = "DevOps Team"
  }
}

# Role assignment: Contributor for application resource groups only
# More restricted than the original Service Principal for better security
module "jenkins_app_contributor_role" {
  source = var.catalog_role_assignment_source
  
  # Scope: Only application resource groups (not entire subscription)
  scope = "/subscriptions/${var.subscription_id}/resourceGroups/rg-applications-${var.environment}"
  
  role_definition_name = "Contributor"
  principal_id         = module.jenkins_managed_identity.principal_id
  
  description            = "Jenkins application deployment for ${var.environment} environment"
  assigned_by           = "DevOps Team"
  business_justification = "Required for automated application deployment via Jenkins pipelines"
}

# Role assignment: Container Registry access (if you use containers)
module "jenkins_container_registry_role" {
  count  = var.enable_container_registry ? 1 : 0
  source = var.catalog_role_assignment_source
  
  # Scope: Container Registry
  scope = "/subscriptions/${var.subscription_id}/resourceGroups/rg-containers-${var.environment}/providers/Microsoft.ContainerRegistry/registries/acr${var.environment}12345"
  
  role_definition_name = "AcrPush"
  principal_id         = module.jenkins_managed_identity.principal_id
  
  description = "Jenkins container image push access for ${var.environment} environment"
}

# Output Jenkins identity details
output "jenkins_managed_identity_details" {
  description = "Details of the Jenkins managed identity"
  value = {
    name         = module.jenkins_managed_identity.name
    client_id    = module.jenkins_managed_identity.client_id
    principal_id = module.jenkins_managed_identity.principal_id
    resource_id  = module.jenkins_managed_identity.id
  }
}

# Jenkins environment variables for pipeline configuration
output "jenkins_environment_variables" {
  description = "Environment variables for Jenkins pipeline configuration"
  value = {
    ARM_USE_MSI         = "true"
    ARM_CLIENT_ID       = module.jenkins_managed_identity.client_id
    ARM_SUBSCRIPTION_ID = var.subscription_id
    ARM_TENANT_ID       = var.tenant_id
  }
}
```

#### Template 3: Monitoring Managed Identity (Read-Only)

**File: monitoring-managed-identity.tf**
```hcl
# ==============================================================================
# MONITORING MANAGED IDENTITY
# ==============================================================================
# This is a NEW identity for monitoring (didn't exist as Service Principal)
# Created on: [DATE]
# Created by: [YOUR NAME]

# Monitoring managed identity (read-only access)
module "monitoring_managed_identity" {
  source = var.catalog_managed_identity_source
  
  name                = "mi-monitoring-${var.environment}-${random_string.terraform_suffix.result}"
  resource_group_name = azurerm_resource_group.identity_management.name
  location           = azurerm_resource_group.identity_management.location
  
  description = "Managed Identity for monitoring and alerting in ${var.environment} environment. Read-only access for observability tools."
  
  tags = {
    Environment      = var.environment
    Purpose         = "Monitoring and Alerting"
    Component       = "Observability"
    CreatedDate     = "2024-01-15"  # Today's date
    BusinessOwner   = "Operations Team"
    TechnicalOwner  = "DevOps Team"
  }
}

# Role assignment: Reader access at subscription level
module "monitoring_reader_role" {
  source = var.catalog_role_assignment_source
  
  # Scope: Entire subscription (read-only is safe)
  scope = "/subscriptions/${var.subscription_id}"
  
  role_definition_name = "Reader"
  principal_id         = module.monitoring_managed_identity.principal_id
  
  description            = "Monitoring read access for ${var.environment} environment"
  assigned_by           = "DevOps Team"
  business_justification = "Required for monitoring, alerting, and observability across all resources"
}

# Role assignment: Monitoring Reader for metrics access
module "monitoring_metrics_role" {
  source = var.catalog_role_assignment_source
  
  scope                = "/subscriptions/${var.subscription_id}"
  role_definition_name = "Monitoring Reader"
  principal_id         = module.monitoring_managed_identity.principal_id
  
  description = "Monitoring metrics access for ${var.environment} environment"
}

# Output monitoring identity details
output "monitoring_managed_identity_details" {
  description = "Details of the monitoring managed identity"
  value = {
    name         = module.monitoring_managed_identity.name
    client_id    = module.monitoring_managed_identity.client_id
    principal_id = module.monitoring_managed_identity.principal_id
    resource_id  = module.monitoring_managed_identity.id
  }
}
```

### Step 7: Write Variables File

**File: variables.tf**
```hcl
# ==============================================================================
# VARIABLES FOR MANAGED IDENTITY CONFIGURATION
# ==============================================================================

# Core Environment Variables
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
  default     = "East US"
  
  validation {
    condition = contains([
      "East US", "East US 2", "West US", "West US 2", "West US 3",
      "Central US", "South Central US", "North Central US",
      "North Europe", "West Europe", "UK South", "UK West"
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

variable "tenant_id" {
  description = "Azure tenant ID"
  type        = string
  sensitive   = true
  
  validation {
    condition     = can(regex("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", var.tenant_id))
    error_message = "Must be a valid Azure tenant GUID."
  }
}

# Optional Features
variable "enable_container_registry" {
  description = "Enable container registry access for Jenkins identity"
  type        = bool
  default     = false
}

variable "enable_key_vault_access" {
  description = "Enable Key Vault access for identities"
  type        = bool
  default     = false
}

# Catalog Module Sources (update with your actual URLs)
variable "catalog_managed_identity_source" {
  description = "Source URL for managed identity catalog module"
  type        = string
  default     = "git::https://dev.azure.com/your-company/terraform-catalog/_git/modules//managed-identity?ref=v1.5.0"
}

variable "catalog_role_assignment_source" {
  description = "Source URL for role assignment catalog module"
  type        = string
  default     = "git::https://dev.azure.com/your-company/terraform-catalog/_git/modules//role-assignment?ref=v1.2.0"
}

variable "catalog_storage_role_assignment_source" {
  description = "Source URL for storage role assignment catalog module"
  type        = string
  default     = "git::https://dev.azure.com/your-company/terraform-catalog/_git/modules//storage-role-assignment?ref=v1.1.0"
}

# Tagging
variable "common_tags" {
  description = "Common tags applied to all resources"
  type        = map(string)
  default = {
    ManagedBy       = "Terraform"
    Project         = "Managed Identity Migration"
    BusinessUnit    = "Technology"
    DataClass       = "Internal"
    BackupRequired  = "true"
  }
}
```

### Step 8: Write Values File

**File: terraform.tfvars**
```hcl
# ==============================================================================
# TERRAFORM VARIABLES VALUES
# ==============================================================================
# Update these values with your actual Azure details

# Core Configuration
environment     = "dev"  # Change to: dev, staging, or prod
azure_region    = "East US"
subscription_id = "12345678-1234-1234-1234-123456789012"  # Your actual subscription ID
tenant_id      = "87654321-4321-4321-4321-210987654321"  # Your actual tenant ID

# Feature Flags
enable_container_registry = true   # Set to false if you don't use containers
enable_key_vault_access   = true   # Set to false if you don't use Key Vault

# Catalog Module Sources (update with your actual URLs)
catalog_managed_identity_source         = "git::https://dev.azure.com/your-company/terraform-catalog/_git/modules//managed-identity?ref=v1.5.0"
catalog_role_assignment_source          = "git::https://dev.azure.com/your-company/terraform-catalog/_git/modules//role-assignment?ref=v1.2.0"
catalog_storage_role_assignment_source  = "git::https://dev.azure.com/your-company/terraform-catalog/_git/modules//storage-role-assignment?ref=v1.1.0"

# Resource Tags
common_tags = {
  Environment     = "Development"
  Project         = "Managed Identity Migration"
  Owner          = "Platform Engineering Team"
  CostCenter     = "IT-Infrastructure-001"
  ManagedBy      = "Terraform"
  CreatedDate    = "2024-01-15"  # Today's date
  BusinessUnit   = "Technology"
  DataClass      = "Internal"
  BackupRequired = "false"  # true for prod, false for dev
  Compliance     = "Internal"  # Add SOX, PCI, etc. for prod
}
```

### Step 9: Write Provider Configuration

**File: provider.tf**
```hcl
# ==============================================================================
# TERRAFORM PROVIDER CONFIGURATION
# ==============================================================================

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

# Azure Provider Configuration
provider "azurerm" {
  features {
    # Development environment settings (adjust for prod)
    resource_group {
      prevent_deletion_if_contains_resources = false  # Change to true for prod
    }
    
    key_vault {
      purge_soft_delete_on_destroy    = true   # Change to false for prod
      recover_soft_deleted_key_vaults = false  # Change to true for prod
    }
    
    storage {
      prevent_deletion_if_contains_resources = false  # Change to true for prod
    }
  }
  
  # OLD CONFIGURATION (Service Principal) - COMMENTED OUT
  # client_id       = "12345678-1234-1234-1234-123456789012"  # terraform-dev-sp
  # client_secret   = "your-secret-here"
  # tenant_id       = "87654321-4321-4321-4321-210987654321"
  # subscription_id = "11111111-2222-3333-4444-555555555555"
  
  # NEW CONFIGURATION (Managed Identity)
  use_msi = true
  
  # Optional: Specify specific managed identity (leave commented for system-assigned)
  # client_id = module.terraform_managed_identity.client_id
  
  # Optional: Specify subscription and tenant
  subscription_id = var.subscription_id
  # tenant_id     = var.tenant_id
}

# Random provider for generating unique names
provider "random" {
  # No configuration needed
}
```

### Step 10: Write Backend Configuration

**File: backend.tf**
```hcl
# ==============================================================================
# TERRAFORM BACKEND CONFIGURATION
# ==============================================================================

terraform {
  backend "azurerm" {
    # Storage account details (update with your actual values)
    resource_group_name  = "rg-terraform-state-dev"  # Your state storage resource group
    storage_account_name = "tfstatedev12345"          # Your state storage account
    container_name       = "tfstate"                  # Container name
    key                  = "managed-identity/development.tfstate"  # Unique key for this config
    
    # OLD BACKEND AUTHENTICATION (Service Principal) - COMMENTED OUT
    # client_id     = "12345678-1234-1234-1234-123456789012"  # terraform-dev-sp
    # client_secret = "your-secret-here"
    # tenant_id     = "87654321-4321-4321-4321-210987654321"
    
    # NEW BACKEND AUTHENTICATION (Managed Identity)
    use_msi = true
    
    # Optional: Specify specific managed identity for backend access
    # client_id = "your-managed-identity-client-id"
  }
}
```

## Part 4: Manual Testing and Validation

### Step 11: Test Your Configuration

#### Manual Testing Commands:
```bash
# 1. Initialize Terraform
terraform init

# 2. Validate configuration
terraform validate

# 3. Check formatting
terraform fmt

# 4. Plan deployment
terraform plan

# 5. Apply (start with development)
terraform apply

# 6. Verify outputs
terraform output

# 7. Test authentication
az account show

# 8. List created resources
terraform state list
```

### Step 12: Document Your Migration

#### Create a Migration Log:
```
# Migration Log - Managed Identity Implementation

## Date: 2024-01-15
## Engineer: [Your Name]
## Environment: Development

### Service Principals Migrated:
1. terraform-dev-sp (12345678-1234-1234-1234-123456789012)
   - Replaced with: mi-terraform-dev-abcd
   - Roles migrated: Contributor @ RG, Storage Blob Data Contributor @ Storage
   - Status: ✅ Complete

2. jenkins-dev-sp (23456789-2345-2345-2345-234567890123)
   - Replaced with: mi-jenkins-dev-abcd
   - Roles migrated: Contributor @ App RG, AcrPush @ Container Registry
   - Status: ✅ Complete

### New Identities Created:
1. mi-monitoring-dev-abcd
   - Purpose: Read-only monitoring
   - Roles: Reader @ Subscription, Monitoring Reader @ Subscription
   - Status: ✅ Complete

### Testing Results:
- ✅ Terraform init successful
- ✅ Terraform plan successful
- ✅ Terraform apply successful
- ✅ All resources created correctly
- ✅ Role assignments working
- ✅ Jenkins pipeline tested successfully

### Next Steps:
1. Test in staging environment
2. Plan production migration
3. Update documentation
4. Train team on new setup
```

This manual approach gives you **complete control** and **understanding** of what you're creating, without relying on automated scripts. You can adapt each template to your specific needs and requirements.
