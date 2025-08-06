# 🚀 Quick Start Guide - Azure Setup for Beginners

Follow these exact steps to get your GitHub secrets configured:

## Option 1: Automated Setup (Recommended for Windows)

### Step 1: Open PowerShell as Administrator
1. Press `Windows Key + X`
2. Select "Windows PowerShell (Admin)" or "Terminal (Admin)"

### Step 2: Run the Automated Setup Script
```powershell
# Navigate to your project directory
cd "C:\Users\dilan\IdeaProjects\food-delivery-system"

# Allow script execution (one time only)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Run the setup script
.\scripts\azure-setup-windows.ps1
```

### Step 3: Follow the Script Prompts
- The script will install Azure CLI if needed
- It will open a browser for Azure login
- It will create all required resources automatically
- It will display all GitHub secrets at the end

### Step 4: Copy Secrets to GitHub
1. Go to: `https://github.com/dilrukshax/food-delivery-system/settings/secrets/actions`
2. Click "New repository secret" for each secret shown by the script
3. Copy and paste exactly as displayed

---

## Option 2: Manual Setup (All Operating Systems)

### Step 1: Install Azure CLI
**Windows:** Download from https://aka.ms/installazurecliwindows
**macOS:** `brew install azure-cli`
**Linux:** `curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash`

### Step 2: Login to Azure
```bash
az login
```

### Step 3: Create Service Principal
```bash
# Get your subscription ID
az account show --query "id" --output tsv

# Create service principal (replace YOUR_SUBSCRIPTION_ID)
az ad sp create-for-rbac \
  --name "sp-github-food-delivery" \
  --role "Contributor" \
  --scopes "/subscriptions/YOUR_SUBSCRIPTION_ID" \
  --sdk-auth
```
**Save the entire JSON output as `AZURE_CREDENTIALS`**

### Step 4: Create Resource Group
```bash
az group create --name "rg-food-delivery-setup" --location "eastus"
```

### Step 5: Create Container Registry
```bash
# Create ACR (name must be unique)
az acr create \
  --resource-group "rg-food-delivery-setup" \
  --name "acrfooddelivery$(date +%s)" \
  --sku Standard \
  --admin-enabled true

# Get the ACR name that was created
az acr list --resource-group "rg-food-delivery-setup" --query "[].name" --output tsv

# Get credentials (replace ACR_NAME with actual name)
az acr show --name ACR_NAME --query "loginServer" --output tsv
az acr credential show --name ACR_NAME --query "username" --output tsv  
az acr credential show --name ACR_NAME --query "passwords[0].value" --output tsv
```

### Step 6: Create Terraform Storage
```bash
# Create storage account (name must be unique)
STORAGE_NAME="saterraform$(date +%s)"
az storage account create \
  --resource-group "rg-food-delivery-setup" \
  --name $STORAGE_NAME \
  --sku Standard_LRS

# Create container
az storage container create --name "tfstate" --account-name $STORAGE_NAME

# Echo the values you need
echo "TERRAFORM_STATE_RG: rg-food-delivery-setup"
echo "TERRAFORM_STATE_SA: $STORAGE_NAME"
echo "TERRAFORM_STATE_CONTAINER: tfstate"
```

### Step 7: Generate PostgreSQL Password
```bash
# Generate secure password
openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
```

---

## 📝 GitHub Secrets Summary

You need to add these 8 secrets to your GitHub repository:

| Secret Name | Where to Get It |
|-------------|-----------------|
| `AZURE_CREDENTIALS` | JSON output from service principal creation |
| `ACR_LOGIN_SERVER` | Container registry login server URL |
| `ACR_USERNAME` | Container registry username |
| `ACR_PASSWORD` | Container registry password |
| `POSTGRES_ADMIN_PASSWORD` | Generated secure password |
| `TERRAFORM_STATE_RG` | `rg-food-delivery-setup` |
| `TERRAFORM_STATE_SA` | Storage account name you created |
| `TERRAFORM_STATE_CONTAINER` | `tfstate` |

## 🎯 Adding Secrets to GitHub

1. Go to: `https://github.com/dilrukshax/food-delivery-system`
2. Click **Settings** (top menu)
3. Click **Secrets and variables** → **Actions** (left sidebar)
4. Click **New repository secret**
5. Enter the secret name and value
6. Click **Add secret**
7. Repeat for all 8 secrets

## ✅ Verification

After adding all secrets, you should see 8 secrets listed in your GitHub repository's Actions secrets page.

## 🚀 Deploy Your Application

Once all secrets are configured:

```bash
# Commit and push to trigger deployment
git add .
git commit -m "feat: add Azure DevOps configuration"
git push origin main
```

Then monitor the GitHub Actions tab in your repository!

---

## 🆘 Need Help?

- **Azure CLI Issues:** Restart your terminal after installation
- **Permission Errors:** Make sure you're logged into Azure: `az login`
- **GitHub Issues:** Check that all 8 secrets are properly configured
- **Script Issues:** Run PowerShell as Administrator on Windows

**For detailed troubleshooting, see: `AZURE-SETUP-GUIDE.md`**
