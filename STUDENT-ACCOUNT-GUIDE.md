# 🎓 Student Account Azure Setup - Quick Guide

**Having permission issues with your Azure Student account? This guide is for you!**

## 🚨 Common Student Account Issues

Student Azure accounts have restricted permissions that often prevent:
- Creating App Registrations (Service Principals)
- Assigning IAM roles
- Accessing Azure Active Directory features

## ✅ Solution: Use Azure Cloud Shell

### Step 1: Open Cloud Shell
1. Go to [portal.azure.com](https://portal.azure.com)
2. Sign in with your student account
3. Click the **Cloud Shell icon** (>_) in the top toolbar
4. Select **"Bash"** when prompted
5. Wait for the shell to initialize

### Step 2: Create Service Principal
Copy and paste this command:

```bash
# Create service principal with the right permissions
az ad sp create-for-rbac \
  --name "sp-github-food-delivery-$(date +%s)" \
  --role "Contributor" \
  --scopes "/subscriptions/$(az account show --query id --output tsv)" \
  --sdk-auth
```

### Step 3: Save the Output
The command will return a JSON like this:
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

**🔥 IMPORTANT: Copy this ENTIRE JSON immediately - you'll need it for GitHub!**

## 📝 Complete Your GitHub Secrets

Now you can continue with the main guide, but use these specific values:

| Secret Name | Value | Where to Get It |
|-------------|-------|-----------------|
| `AZURE_CREDENTIALS` | **The entire JSON from Step 2** | Cloud Shell output |
| `ACR_LOGIN_SERVER` | Follow main guide Step 3 | Azure Portal |
| `ACR_USERNAME` | Follow main guide Step 3 | Azure Portal |
| `ACR_PASSWORD` | Follow main guide Step 3 | Azure Portal |
| `POSTGRES_ADMIN_PASSWORD` | Follow main guide Step 6 | Generate secure password |
| `TERRAFORM_STATE_RG` | `rg-food-delivery-setup` | From main guide |
| `TERRAFORM_STATE_SA` | Follow main guide Step 4 | Your unique storage name |
| `TERRAFORM_STATE_CONTAINER` | `tfstate` | From main guide |

## 🎯 Student Account Workflow

1. ✅ **Create Resource Group** (portal method works)
2. ✅ **Create Container Registry** (portal method works)
3. ✅ **Create Storage Account** (portal method works)
4. ⚠️ **Create Service Principal** (use Cloud Shell method above)
5. ✅ **Generate PostgreSQL Password** (any method works)
6. ✅ **Add GitHub Secrets** (standard method works)

## 🔧 Alternative: Simplified Cloud Shell Commands

If you want to create everything via Cloud Shell:

```bash
# Set variables
RG_NAME="rg-food-delivery-setup"
LOCATION="eastus"
ACR_NAME="acrfooddelivery$(date +%s)"
STORAGE_NAME="saterraform$(date +%s)"

# Create resource group
az group create --name $RG_NAME --location $LOCATION

# Create container registry
az acr create --resource-group $RG_NAME --name $ACR_NAME --sku Standard --admin-enabled true

# Create storage account
az storage account create --resource-group $RG_NAME --name $STORAGE_NAME --sku Standard_LRS
az storage container create --name tfstate --account-name $STORAGE_NAME

# Create service principal
az ad sp create-for-rbac --name "sp-github-food-delivery" --role "Contributor" --scopes "/subscriptions/$(az account show --query id --output tsv)" --sdk-auth

# Get all the values you need
echo "=== COPY THESE VALUES ==="
echo "ACR_LOGIN_SERVER: $(az acr show --name $ACR_NAME --query loginServer --output tsv)"
echo "ACR_USERNAME: $(az acr credential show --name $ACR_NAME --query username --output tsv)"
echo "ACR_PASSWORD: $(az acr credential show --name $ACR_NAME --query 'passwords[0].value' --output tsv)"
echo "TERRAFORM_STATE_RG: $RG_NAME"
echo "TERRAFORM_STATE_SA: $STORAGE_NAME"
echo "TERRAFORM_STATE_CONTAINER: tfstate"
```

## 🆘 Still Having Issues?

### Error: "Insufficient privileges"
- **Cause**: Your student account lacks Azure AD permissions
- **Solution**: Use the Cloud Shell method above

### Error: "The client does not have authorization"
- **Cause**: Student subscription limitations
- **Solution**: 
  1. Verify your student subscription is active
  2. Check if your school has additional restrictions
  3. Contact your instructor for elevated permissions

### Error: "Cannot access Azure Active Directory"
- **Cause**: Student accounts often can't access AAD directly
- **Solution**: Use Cloud Shell - it bypasses portal restrictions

## 💡 Pro Tips for Student Accounts

1. **Always use Cloud Shell** for Azure CLI commands
2. **Save outputs immediately** - student sessions may timeout
3. **Use unique names** - append timestamps to avoid conflicts
4. **Monitor costs** - student credits are limited
5. **Clean up resources** when done to preserve credits

## 🎓 Why Student Accounts Are Different

Student Azure accounts are intentionally restricted to:
- Prevent accidental high costs
- Limit access to sensitive Azure AD features
- Ensure students learn within a controlled environment
- Protect institutional Azure tenants

The Cloud Shell method works because it uses the Azure CLI with pre-authenticated credentials, bypassing many portal restrictions.

---

**Next**: Once you have your `AZURE_CREDENTIALS` JSON from Cloud Shell, continue with the main portal guide for the other resources!
