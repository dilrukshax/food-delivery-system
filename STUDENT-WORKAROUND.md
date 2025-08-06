# 🎓 Student Account Workaround - Alternative CI/CD Setup

Since your student account cannot create service principals, we'll use an alternative approach that works with student Azure accounts.

## 🚨 The Problem
Student Azure accounts have these limitations:
- Cannot create App Registrations (Service Principals)
- Cannot assign Azure AD roles
- Limited Azure Active Directory permissions

## ✅ Solution: Use Azure CLI with Device Code Authentication

### Step 1: Get Your Azure Information
Run these commands in Azure Cloud Shell:

```bash
# Get your subscription and tenant info
SUBSCRIPTION_ID=$(az account show --query id --output tsv)
TENANT_ID=$(az account show --query tenantId --output tsv)
USER_EMAIL=$(az account show --query user.name --output tsv)

echo "=== SAVE THESE VALUES ==="
echo "Subscription ID: $SUBSCRIPTION_ID"
echo "Tenant ID: $TENANT_ID"  
echo "User Email: $USER_EMAIL"
```

### Step 2: Create a Modified AZURE_CREDENTIALS Secret

Instead of a service principal, create this JSON for your `AZURE_CREDENTIALS` secret:

```json
{
  "clientId": "04b07795-8ddb-461a-bbee-02f9e1bf7b46",
  "clientSecret": "STUDENT_ACCOUNT_WORKAROUND",
  "subscriptionId": "YOUR_SUBSCRIPTION_ID_FROM_STEP_1",
  "tenantId": "YOUR_TENANT_ID_FROM_STEP_1",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

**Replace YOUR_SUBSCRIPTION_ID_FROM_STEP_1 and YOUR_TENANT_ID_FROM_STEP_1 with your actual values!**

### Step 3: Modified GitHub Actions Workflow

We need to modify the CI/CD pipeline to work without a service principal. Here's the updated workflow:

**Update `.github/workflows/cd.yml`:**

Replace the Azure login section with:

```yaml
    - name: Azure Login (Student Account)
      run: |
        # For student accounts, we'll use Azure CLI with device code
        echo "Using Azure CLI for student account authentication"
        echo "This requires manual intervention for the first deployment"
        
        # Set up Azure CLI context
        az config set core.allow_broker=true
        az config set core.collect_telemetry=false
        
        # Login using device code (requires manual step)
        echo "Please complete the device code authentication in your browser"
        az login --use-device-code --tenant ${{ fromJson(secrets.AZURE_CREDENTIALS).tenantId }}
        
        # Set the subscription
        az account set --subscription ${{ fromJson(secrets.AZURE_CREDENTIALS).subscriptionId }}
```

### Step 4: Alternative - Use GitHub Codespaces

If the above is too complex, use GitHub Codespaces with Azure CLI:

1. **Enable GitHub Codespaces** in your repository
2. **Create a codespace**
3. **Install Azure CLI** in the codespace:
```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```
4. **Run deployments manually** from the codespace

### Step 5: Simplified Deployment Script

Create this script for manual deployment from Codespaces:

```bash
#!/bin/bash
# File: deploy-student.sh

echo "🎓 Student Account Deployment Script"

# Login to Azure
echo "Logging into Azure..."
az login

# Set subscription
SUBSCRIPTION_ID="ecf458ab-452d-4a8f-8f6c-dc10cd6fe4d5"  # Your subscription ID
az account set --subscription $SUBSCRIPTION_ID

# Deploy infrastructure
echo "Deploying infrastructure..."
cd terraform
terraform init \
  -backend-config="resource_group_name=rg-food-delivery-setup" \
  -backend-config="storage_account_name=YOUR_STORAGE_ACCOUNT_NAME" \
  -backend-config="container_name=tfstate" \
  -backend-config="key=food-delivery-dev.tfstate"

terraform plan -var="postgres_admin_password=YOUR_POSTGRES_PASSWORD"
terraform apply -auto-approve -var="postgres_admin_password=YOUR_POSTGRES_PASSWORD"

# Build and push images
echo "Building and pushing Docker images..."
cd ..

# Get ACR login server
ACR_NAME=$(az acr list --resource-group rg-food-delivery-setup --query "[0].name" --output tsv)
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer --output tsv)

# Login to ACR
az acr login --name $ACR_NAME

# Build and push each service
services=("api-gateway" "user-service" "restaurant-service" "order-service" "payment-service" "delivery-service" "notification-service" "service-registry" "frontend")

for service in "${services[@]}"; do
    echo "Building $service..."
    if [ "$service" = "frontend" ]; then
        docker build -t $ACR_LOGIN_SERVER/food-delivery/$service:latest ./frontend
    else
        docker build -t $ACR_LOGIN_SERVER/food-delivery/$service:latest ./backend/$service
    fi
    docker push $ACR_LOGIN_SERVER/food-delivery/$service:latest
done

echo "✅ Deployment complete!"
```

## 🎯 Recommended Path for Student Accounts

### Option 1: GitHub Codespaces (Easiest)
1. Enable Codespaces in your GitHub repository
2. Create a codespace
3. Use the manual deployment script above
4. Deploy when needed

### Option 2: Local Development with Azure CLI
1. Install Azure CLI on your local machine
2. Use `az login` for authentication
3. Run Terraform and Docker commands locally
4. Push images to ACR manually

### Option 3: Request Instructor Help
1. Ask your instructor to create a service principal for you
2. Get the credentials from them
3. Use the standard CI/CD pipeline

## 🔧 Quick Start for Option 1 (Codespaces)

1. **Go to your GitHub repository**
2. **Click the green "Code" button**
3. **Select "Codespaces" tab**
4. **Click "Create codespace on main"**
5. **Wait for the environment to load**
6. **Run these commands:**

```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure
az login

# Set your subscription
az account set --subscription "ecf458ab-452d-4a8f-8f6c-dc10cd6fe4d5"

# Verify you can access your resources
az group list --output table
az acr list --output table
```

## 💡 Why This Happens

Student accounts are restricted because:
- They're meant for learning, not production deployments
- They prevent accidental high-cost resources
- They protect the institutional Azure AD tenant
- They limit access to enterprise features

## 🎓 Learning Opportunity

This is actually a great learning experience because:
- You learn multiple deployment methods
- You understand Azure authentication models
- You practice with both GUI and CLI tools
- You see real-world constraints and workarounds

---

**Next**: Choose the option that works best for your learning environment and comfort level with command-line tools!
