#!/bin/bash

# Azure Food Delivery System Deployment Setup Script
# This script helps set up the necessary Azure resources and GitHub secrets for CI/CD

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="dev"
LOCATION="eastus"
PROJECT_NAME="food-delivery"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if user is logged into Azure
check_azure_login() {
    print_status "Checking Azure CLI login status..."
    if ! az account show > /dev/null 2>&1; then
        print_error "Please log in to Azure CLI first: az login"
        exit 1
    fi
    print_success "Azure CLI is logged in"
}

# Create Azure service principal for GitHub Actions
create_service_principal() {
    print_status "Creating Azure Service Principal for GitHub Actions..."
    
    SUBSCRIPTION_ID=$(az account show --query id -o tsv)
    SP_NAME="sp-github-actions-${PROJECT_NAME}-${ENVIRONMENT}"
    
    # Create service principal
    SP_OUTPUT=$(az ad sp create-for-rbac \
        --name "$SP_NAME" \
        --role "Contributor" \
        --scopes "/subscriptions/$SUBSCRIPTION_ID" \
        --sdk-auth)
    
    print_success "Service Principal created successfully"
    
    echo "Add this to your GitHub repository secrets as AZURE_CREDENTIALS:"
    echo "----------------------------------------"
    echo "$SP_OUTPUT"
    echo "----------------------------------------"
    
    return 0
}

# Create storage account for Terraform state
create_terraform_backend() {
    print_status "Creating Terraform backend storage..."
    
    RG_NAME="rg-terraform-state-${PROJECT_NAME}"
    SA_NAME="saterraform${PROJECT_NAME}${RANDOM}"
    CONTAINER_NAME="tfstate"
    
    # Create resource group
    az group create --name "$RG_NAME" --location "$LOCATION"
    
    # Create storage account
    az storage account create \
        --resource-group "$RG_NAME" \
        --name "$SA_NAME" \
        --sku Standard_LRS \
        --encryption-services blob
    
    # Create blob container
    az storage container create \
        --name "$CONTAINER_NAME" \
        --account-name "$SA_NAME"
    
    print_success "Terraform backend created successfully"
    
    echo "Add these to your GitHub repository secrets:"
    echo "TERRAFORM_STATE_RG: $RG_NAME"
    echo "TERRAFORM_STATE_SA: $SA_NAME"
    echo "TERRAFORM_STATE_CONTAINER: $CONTAINER_NAME"
}

# Generate random password for PostgreSQL
generate_postgres_password() {
    POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    echo "PostgreSQL Admin Password (add as POSTGRES_ADMIN_PASSWORD secret): $POSTGRES_PASSWORD"
}

# Create ACR and get credentials
setup_acr_preview() {
    print_status "Setting up preview ACR for initial setup..."
    
    RG_NAME="rg-preview-${PROJECT_NAME}"
    ACR_NAME="acrpreview${PROJECT_NAME}${RANDOM}"
    
    # Create resource group
    az group create --name "$RG_NAME" --location "$LOCATION"
    
    # Create ACR
    az acr create --resource-group "$RG_NAME" --name "$ACR_NAME" --sku Standard
    
    # Enable admin user (for initial setup only)
    az acr update -n "$ACR_NAME" --admin-enabled true
    
    # Get credentials
    ACR_USERNAME=$(az acr credential show --name "$ACR_NAME" --query "username" -o tsv)
    ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --query "passwords[0].value" -o tsv)
    ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --query "loginServer" -o tsv)
    
    print_success "Preview ACR created successfully"
    
    echo "Add these to your GitHub repository secrets:"
    echo "ACR_LOGIN_SERVER: $ACR_LOGIN_SERVER"
    echo "ACR_USERNAME: $ACR_USERNAME"
    echo "ACR_PASSWORD: $ACR_PASSWORD"
    
    echo ""
    echo "Note: This ACR will be replaced by the one created via Terraform"
}

# Main execution
main() {
    echo "=========================================="
    echo "Azure Food Delivery System Setup"
    echo "=========================================="
    echo ""
    
    check_azure_login
    
    echo ""
    print_status "Starting setup process..."
    
    # Create service principal
    create_service_principal
    echo ""
    
    # Create Terraform backend
    create_terraform_backend
    echo ""
    
    # Generate PostgreSQL password
    generate_postgres_password
    echo ""
    
    # Setup preview ACR
    setup_acr_preview
    
    echo ""
    echo "=========================================="
    print_success "Setup completed successfully!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Add all the secrets shown above to your GitHub repository"
    echo "2. Copy terraform.tfvars.example to terraform.tfvars and customize"
    echo "3. Commit and push your code to trigger the CI/CD pipeline"
    echo "4. The CD pipeline will create the production infrastructure"
    echo ""
}

# Run main function
main "$@"
