# Step-by-Step Guide: Azure Setup and GitHub Secrets Configuration

This guide will walk you through setting up Azure resources and configuring GitHub secrets for your food delivery system deployment, even if you're completely new to Azure.

## 📋 Prerequisites

Before we start, make sure you have:
- An Azure account (free tier is sufficient to start)
- A GitHub account with your food-delivery-system repository
- A computer with internet access

## 🎯 Step 1: Set Up Azure Account and CLI

### 1.1 Create Azure Account (if you don't have one)
1. Go to [portal.azure.com](https://portal.azure.com)
2. Click "Create a free account"
3. Follow the registration process
4. You'll get $200 in free credits for 30 days

### 1.2 Install Azure CLI
Choose your operating system:

**Windows:**
1. Download Azure CLI from: https://aka.ms/installazurecliwindows
2. Run the installer and follow the prompts
3. Open Command Prompt or PowerShell as Administrator
4. Verify installation: `az --version`

**macOS:**
```bash
# Install using Homebrew
brew update && brew install azure-cli

# Or download from: https://aka.ms/installazureclimacos
```

**Linux (Ubuntu/Debian):**
```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### 1.3 Login to Azure
```bash
# Login to your Azure account
az login

# This will open a browser window - sign in with your Azure credentials
# After successful login, you'll see your subscription details in the terminal
```

## 🏗️ Step 2: Create Azure Service Principal (AZURE_CREDENTIALS)

The Service Principal is like a "robot user" that GitHub Actions will use to access your Azure resources.

### 2.1 Get Your Subscription ID
```bash
# List your subscriptions
az account list --output table

# Note down the SubscriptionId from the output
# Set the correct subscription if you have multiple
az account set --subscription "Your-Subscription-ID"
```

### 2.2 Create Service Principal
```bash
# Replace "your-subscription-id" with your actual subscription ID
az ad sp create-for-rbac \
  --name "sp-github-food-delivery" \
  --role "Contributor" \
  --scopes "/subscriptions/your-subscription-id" \
  --sdk-auth
```

**Save the entire JSON output!** It looks like this:
```json
{
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "subscriptionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

✅ **This JSON is your `AZURE_CREDENTIALS` secret**

## 🏪 Step 3: Create Azure Container Registry (ACR)

### 3.1 Create Resource Group
```bash
# Create a resource group for our initial setup
az group create \
  --name "rg-food-delivery-setup" \
  --location "eastus"
```

### 3.2 Create Container Registry
```bash
# Create ACR (name must be globally unique, use only lowercase letters and numbers)
az acr create \
  --resource-group "rg-food-delivery-setup" \
  --name "acrfooddelivery$(date +%s)" \
  --sku Standard \
  --admin-enabled true
```

### 3.3 Get ACR Credentials
```bash
# Get ACR name (if you forgot it)
az acr list --resource-group "rg-food-delivery-setup" --query "[].name" --output tsv

# Replace "your-acr-name" with the actual ACR name from above
ACR_NAME="your-acr-name"

# Get login server
az acr show --name $ACR_NAME --query "loginServer" --output tsv

# Get username and password
az acr credential show --name $ACR_NAME --query "username" --output tsv
az acr credential show --name $ACR_NAME --query "passwords[0].value" --output tsv
```

✅ **Save these three values:**
- `ACR_LOGIN_SERVER`: The login server URL (e.g., acrfooddelivery123.azurecr.io)
- `ACR_USERNAME`: The username
- `ACR_PASSWORD`: The password

## 🗄️ Step 4: Create Terraform State Storage

Terraform needs a place to store its state file in Azure.

### 4.1 Create Storage Account
```bash
# Generate a unique storage account name
STORAGE_NAME="saterraform$(date +%s)"

# Create storage account
az storage account create \
  --resource-group "rg-food-delivery-setup" \
  --name $STORAGE_NAME \
  --sku Standard_LRS \
  --encryption-services blob

# Create container for Terraform state
az storage container create \
  --name "tfstate" \
  --account-name $STORAGE_NAME
```

✅ **Save these values:**
- `TERRAFORM_STATE_RG`: `rg-food-delivery-setup`
- `TERRAFORM_STATE_SA`: The storage account name (e.g., saterraform1234567890)
- `TERRAFORM_STATE_CONTAINER`: `tfstate`

## 🔐 Step 5: Generate PostgreSQL Password

### 5.1 Generate Secure Password
**Windows (PowerShell):**
```powershell
# Generate a random password
Add-Type -AssemblyName System.Security
$password = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
$bytes = New-Object byte[] 32
$password.GetBytes($bytes)
$securePassword = [Convert]::ToBase64String($bytes).Substring(0,24) + "Ab1!"
Write-Host "PostgreSQL Password: $securePassword"
```

**macOS/Linux:**
```bash
# Generate a random password
openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
```

✅ **Save this as `POSTGRES_ADMIN_PASSWORD`**

## 🔧 Step 6: Configure GitHub Secrets

### 6.1 Access GitHub Repository Settings
1. Go to your GitHub repository: `https://github.com/dilrukshax/food-delivery-system`
2. Click on **Settings** (top menu)
3. In the left sidebar, click **Secrets and variables** → **Actions**

### 6.2 Add Each Secret
Click **New repository secret** for each of the following:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `AZURE_CREDENTIALS` | The entire JSON from Step 2.2 | `{"clientId": "xxx-xxx-xxx", ...}` |
| `ACR_LOGIN_SERVER` | ACR login server from Step 3.3 | `acrfooddelivery123.azurecr.io` |
| `ACR_USERNAME` | ACR username from Step 3.3 | `acrfooddelivery123` |
| `ACR_PASSWORD` | ACR password from Step 3.3 | `xxxxxxxxxxxxxxxxxxxxx` |
| `POSTGRES_ADMIN_PASSWORD` | Password from Step 5.1 | `AbCdEfGhIjKlMnOpQrStUv1!` |
| `TERRAFORM_STATE_RG` | Resource group name | `rg-food-delivery-setup` |
| `TERRAFORM_STATE_SA` | Storage account name | `saterraform1234567890` |
| `TERRAFORM_STATE_CONTAINER` | Container name | `tfstate` |

### 6.3 Verify Secrets
After adding all secrets, you should see them listed in your repository's Actions secrets page.

## 🎯 Step 7: Test Your Setup

### 7.1 Verify Azure Connection
```bash
# Test that everything works
az account show
az acr list --output table
az storage account list --output table
```

### 7.2 Verify GitHub Secrets
1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Confirm all 8 secrets are listed

## 🚀 Step 8: Trigger Your First Deployment

### 8.1 Update Repository Information
Before deploying, update the setup scripts with your repository details:

1. Edit `scripts/setup-github-secrets.sh`:
   ```bash
   REPO_OWNER="dilrukshax"  # Your GitHub username
   REPO_NAME="food-delivery-system"   # Your repository name
   ```

### 8.2 Commit and Push
```bash
# Add all files
git add .

# Commit changes
git commit -m "feat: add Azure DevOps configuration and deployment scripts"

# Push to trigger CI/CD
git push origin main
```

### 8.3 Monitor Deployment
1. Go to your GitHub repository
2. Click on **Actions** tab
3. You should see the CI workflow running
4. After CI completes successfully, the CD workflow will start

## 🛠️ Troubleshooting Common Issues

### Issue 1: "az command not found"
**Solution:** Restart your terminal/command prompt after installing Azure CLI

### Issue 2: ACR name already exists
**Solution:** Choose a different name when creating ACR:
```bash
az acr create --name "acrfooddelivery$(whoami)$(date +%s)" ...
```

### Issue 3: GitHub Actions fails with "Invalid credentials"
**Solution:** 
1. Verify the `AZURE_CREDENTIALS` JSON is complete and properly formatted
2. Ensure the Service Principal has Contributor role
3. Check that subscription ID is correct

### Issue 4: Permission denied errors
**Solution:**
```bash
# Ensure you're logged in
az login

# Verify you have the correct subscription
az account show

# If you have multiple subscriptions, set the correct one
az account set --subscription "your-subscription-id"
```

## 📞 Getting Help

If you encounter issues:

1. **Azure CLI Issues:** Check [Azure CLI documentation](https://docs.microsoft.com/en-us/cli/azure/)
2. **GitHub Actions Issues:** Check the Actions logs in your repository
3. **Service Principal Issues:** Verify permissions in Azure Portal → Azure Active Directory → App registrations

## 🎉 Success Indicators

You'll know everything is working when:
- ✅ All 8 GitHub secrets are configured
- ✅ GitHub Actions CI pipeline runs successfully
- ✅ GitHub Actions CD pipeline deploys infrastructure
- ✅ Your application is accessible via the Azure Load Balancer IP

## 💡 Important Notes

1. **Free Tier Limits:** Azure free tier has resource limits. The configuration is optimized for development use.
2. **Costs:** Monitor your Azure costs in the Azure Portal → Cost Management
3. **Security:** Never commit secrets to your repository
4. **Cleanup:** Use the cleanup script when you're done to avoid ongoing charges

---

**Next:** After completing this setup, your CI/CD pipeline will automatically deploy your food delivery system to Azure when you push code to the main branch!
