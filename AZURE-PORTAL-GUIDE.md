# 🌐 Azure Portal Setup Guide - Visual Step-by-Step

This guide shows you how to set up all Azure resources and get GitHub secrets using only the Azure Portal web interface - no command line required!

## 📋 Prerequisites

- Azure account (create free account at [portal.azure.com](https://portal.azure.com))
- GitHub account with your food-delivery-system repository

---

## 🎯 Step 1: Access Azure Portal

1. **Open your web browser** and go to [portal.azure.com](https://portal.azure.com)
2. **Sign in** with your Microsoft/Azure account
3. You should see the Azure Portal dashboard

![Azure Portal Home](https://docs.microsoft.com/en-us/azure/azure-portal/media/azure-portal-overview/azure-portal-overview-portal-callouts.png)

---

## 🏗️ Step 2: Create Resource Group

### 2.1 Navigate to Resource Groups
1. In the Azure Portal, click **"Resource groups"** in the left sidebar
   - If you don't see it, click **"All services"** and search for "Resource groups"
2. Click **"+ Create"** button at the top

### 2.2 Fill Resource Group Details
1. **Subscription**: Select your subscription (usually "Free Trial" or "Pay-As-You-Go")
2. **Resource group name**: Enter `rg-food-delivery-setup`
3. **Region**: Select `East US` (or your preferred region)
4. Click **"Review + create"**
5. Click **"Create"**

✅ **Wait for "Deployment complete" message**

---

## 🏪 Step 3: Create Container Registry (ACR)

### 3.1 Navigate to Container Registries
1. In the Azure Portal search bar (top), type `container registries`
2. Select **"Container registries"** from the results
3. Click **"+ Create"** button

### 3.2 Fill Container Registry Details
1. **Subscription**: Your subscription
2. **Resource group**: Select `rg-food-delivery-setup` (the one you just created)
3. **Registry name**: Enter `acrfooddelivery` + today's date (e.g., `acrfooddelivery20250805`)
   - ⚠️ **Must be globally unique and lowercase only**
4. **Location**: Same as your resource group (East US)
5. **SKU**: Select **"Standard"**
6. Click **"Review + create"**
7. Click **"Create"**

### 3.3 Enable Admin User
1. **Wait for deployment to complete**
2. Click **"Go to resource"**
3. In the left sidebar, click **"Access keys"**
4. Toggle **"Admin user"** to **"Enabled"**
5. **📝 SAVE THESE VALUES** (you'll need them for GitHub secrets):
   - **Login server** (e.g., `acrfooddelivery20250805.azurecr.io`)
   - **Username** (same as registry name)
   - **Password** (copy the first password value)

✅ **ACR Secrets Ready:**
- `ACR_LOGIN_SERVER`: [Login server value]
- `ACR_USERNAME`: [Username value]
- `ACR_PASSWORD`: [Password value]

---

## 🗄️ Step 4: Create Storage Account for Terraform

### 4.1 Navigate to Storage Accounts
1. In the Azure Portal search bar, type `storage accounts`
2. Select **"Storage accounts"** from the results
3. Click **"+ Create"** button

### 4.2 Fill Storage Account Details
1. **Subscription**: Your subscription
2. **Resource group**: Select `rg-food-delivery-setup`
3. **Storage account name**: Enter `saterraform` + today's date + your initials
   - Example: `saterraform20250805dm`
   - ⚠️ **Must be globally unique, lowercase, no special characters**
4. **Region**: Same as your resource group (East US)
5. **Performance**: **Standard**
6. **Redundancy**: **Locally-redundant storage (LRS)**
7. Click **"Review + create"**
8. Click **"Create"**

### 4.3 Create Container for Terraform State
1. **Wait for deployment to complete**
2. Click **"Go to resource"**
3. In the left sidebar, click **"Containers"** (under Data storage)
4. Click **"+ Container"** at the top
5. **Name**: Enter `tfstate`
6. **Public access level**: **Private (no anonymous access)**
7. Click **"Create"**

✅ **Terraform Storage Secrets Ready:**
- `TERRAFORM_STATE_RG`: `rg-food-delivery-setup`
- `TERRAFORM_STATE_SA`: [Your storage account name]
- `TERRAFORM_STATE_CONTAINER`: `tfstate`

---

## 🔐 Step 5: Create Service Principal (App Registration)

> ⚠️ **STUDENT ACCOUNT ISSUE**: If you get a 401 error or permission denied, see **Option 2** below

### Option 1: Standard Method (For Regular Azure Accounts)

#### 5.1 Navigate to Azure Active Directory
1. In the Azure Portal search bar, type `azure active directory`
2. Select **"Azure Active Directory"** from the results
3. In the left sidebar, click **"App registrations"**
4. Click **"+ New registration"**

#### 5.2 Register Application
1. **Name**: Enter `sp-github-food-delivery`
2. **Supported account types**: **Accounts in this organizational directory only**
3. **Redirect URI**: Leave blank
4. Click **"Register"**

#### 5.3 Create Client Secret
1. After registration, you'll be on the app's overview page
2. **📝 COPY the "Application (client) ID"** - you'll need this
3. **📝 COPY the "Directory (tenant) ID"** - you'll need this
4. In the left sidebar, click **"Certificates & secrets"**
5. Click **"+ New client secret"**
6. **Description**: Enter `GitHub Actions Secret`
7. **Expires**: Select **24 months**
8. Click **"Add"**
9. **📝 IMMEDIATELY COPY the "Value"** - you can't see it again!

---

### Option 2: Alternative for Student Accounts (Recommended)

**If you got a 401 error above, use Azure Cloud Shell instead:**

#### 5A. Open Azure Cloud Shell
1. In the Azure Portal, click the **Cloud Shell icon** (>_) in the top toolbar
2. Select **"Bash"** when prompted
3. Wait for the shell to initialize

#### 5B. Create Service Principal via Command Line
```bash
# Get your subscription ID first
az account show --query id --output tsv

# Create service principal (replace YOUR_SUBSCRIPTION_ID with the value above)
az ad sp create-for-rbac \
  --name "sp-github-food-delivery" \
  --role "Contributor" \
  --scopes "/subscriptions/YOUR_SUBSCRIPTION_ID" \
  --sdk-auth
```

#### 5C. Save the Output
The command will output a JSON like this:
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

**📝 COPY THIS ENTIRE JSON** - this is your `AZURE_CREDENTIALS` secret!

---

### Option 3: Manual Assembly (If Both Above Fail)

If you can't create a service principal, you can try using your personal Azure credentials temporarily:

#### 5X. Get Required IDs Manually

#### 5X. Get Required IDs Manually

**Step 1: Get Subscription ID**
1. Search for "Subscriptions" in Azure Portal
2. Click on your subscription
3. Copy the **Subscription ID**

**Step 2: Get Tenant ID**
1. Search for "Azure Active Directory" or "Microsoft Entra ID"
2. In the Overview page, copy the **Tenant ID**

**Step 3: Create a Personal Access Token (Alternative)**
Since student accounts can't create service principals, we'll use a different approach:

1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Generate a classic token with these permissions:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)

⚠️ **Note**: This is a temporary workaround. For production, you'd need proper service principal access.

---

### ✅ For Student Accounts: Use Option 2 (Cloud Shell)

**This is the most reliable method for student accounts:**

1. **Open Cloud Shell** in Azure Portal (>_ icon)
2. **Run the command** shown in Option 2B
3. **Copy the entire JSON output**
4. **Use that JSON as your `AZURE_CREDENTIALS` secret**

---

### 5.4 Get Subscription ID (All Options)
1. In the Azure Portal search bar, type `subscriptions`
2. Select **"Subscriptions"** from the results
3. Click on your subscription name
4. **📝 COPY the "Subscription ID"** from the overview page

### 5.5 Assign Contributor Role (Skip for Student Accounts)
**Note**: Student accounts often can't assign roles. If you get permission errors, skip this step - the Cloud Shell method (Option 2) handles permissions automatically.

1. Stay on the subscription overview page
2. In the left sidebar, click **"Access control (IAM)"**
3. Click **"+ Add"** → **"Add role assignment"**
4. **Role**: Search and select **"Contributor"**
5. Click **"Next"**
6. **Assign access to**: **User, group, or service principal**
7. Click **"+ Select members"**
8. Search for `sp-github-food-delivery` (the app you created)
9. Select it and click **"Select"**
10. Click **"Review + assign"**
11. Click **"Assign"**

✅ **Service Principal Ready:**

**If you used Option 1 (Standard Method):**
Create this JSON for `AZURE_CREDENTIALS`:
```json
{
  "clientId": "[Application (client) ID]",
  "clientSecret": "[Client secret Value]",
  "subscriptionId": "[Subscription ID]",
  "tenantId": "[Directory (tenant) ID]",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

**If you used Option 2 (Cloud Shell):**
Use the entire JSON output from the `az ad sp create-for-rbac` command as your `AZURE_CREDENTIALS` secret.

**Replace the bracketed values with your actual values!**

---

## 🔑 Step 6: Generate PostgreSQL Password

### Option 1: Use Online Generator (Recommended)
1. Go to [passwordgenerator.net](https://passwordgenerator.net/)
2. Set length to **25 characters**
3. Check: **Include Uppercase**, **Include Lowercase**, **Include Numbers**, **Include Symbols**
4. Click **"Generate Password"**
5. **📝 COPY the generated password**

### Option 2: Create Your Own
Create a password that meets these requirements:
- At least 8 characters
- Contains uppercase letters (A-Z)
- Contains lowercase letters (a-z)
- Contains numbers (0-9)
- Contains special characters (!@#$%^&*)

Example: `MySecurePassword123!`

✅ **PostgreSQL Secret Ready:**
- `POSTGRES_ADMIN_PASSWORD`: [Your generated password]

---

## 📝 Step 7: Summary of All Secrets

You should now have all 8 secrets:

| Secret Name | Your Value |
|-------------|------------|
| `AZURE_CREDENTIALS` | The JSON you created in Step 5 |
| `ACR_LOGIN_SERVER` | From Step 3.3 |
| `ACR_USERNAME` | From Step 3.3 |
| `ACR_PASSWORD` | From Step 3.3 |
| `POSTGRES_ADMIN_PASSWORD` | From Step 6 |
| `TERRAFORM_STATE_RG` | `rg-food-delivery-setup` |
| `TERRAFORM_STATE_SA` | From Step 4.2 |
| `TERRAFORM_STATE_CONTAINER` | `tfstate` |

---

## 🚀 Step 8: Add Secrets to GitHub

### 8.1 Navigate to Your Repository
1. Go to [github.com](https://github.com)
2. Navigate to your repository: `https://github.com/dilrukshax/food-delivery-system`

### 8.2 Access Repository Settings
1. Click the **"Settings"** tab (top menu of your repository)
2. In the left sidebar, click **"Secrets and variables"**
3. Click **"Actions"**

### 8.3 Add Each Secret
**Repeat this process for each of the 8 secrets:**

1. Click **"New repository secret"**
2. **Name**: Enter the exact secret name (e.g., `AZURE_CREDENTIALS`)
3. **Secret**: Paste the corresponding value
4. Click **"Add secret"**

**📝 Add these secrets one by one:**
- `AZURE_CREDENTIALS`
- `ACR_LOGIN_SERVER`
- `ACR_USERNAME`
- `ACR_PASSWORD`
- `POSTGRES_ADMIN_PASSWORD`
- `TERRAFORM_STATE_RG`
- `TERRAFORM_STATE_SA`
- `TERRAFORM_STATE_CONTAINER`

### 8.4 Verify All Secrets Added
After adding all secrets, you should see 8 secrets listed on the Actions secrets page.

---

## ✅ Step 9: Test Your Setup

### 9.1 Trigger Deployment
1. In your repository, make any small change to trigger the pipeline
2. Go to the **"Actions"** tab in your GitHub repository
3. You should see a workflow running

### 9.2 Monitor Progress
1. Click on the running workflow
2. Watch the CI pipeline complete (build and push images)
3. Watch the CD pipeline deploy your infrastructure and applications

---

## 🛠️ Troubleshooting Common Issues

### Issue: Can't find Azure Active Directory
**Solution**: Search for "Azure Active Directory" or "Microsoft Entra ID" in the portal search

### Issue: 401 Error or Permission Denied (Student Accounts)
**Solution**: Student Azure accounts have restricted permissions. You have several options:

**Option A: Use Azure CLI with Device Code Authentication (Recommended)**
1. In Cloud Shell, run this simplified command:
```bash
# Create a temporary authentication file
az account get-access-token --query accessToken --output tsv > /tmp/token.txt

# Get your subscription and tenant info
SUBSCRIPTION_ID=$(az account show --query id --output tsv)
TENANT_ID=$(az account show --query tenantId --output tsv)

# Display the information you need
echo "=== COPY THESE VALUES FOR GITHUB SECRETS ==="
echo "AZURE_CREDENTIALS (create this JSON manually):"
echo "{"
echo "  \"clientId\": \"YOUR_STUDENT_EMAIL\","
echo "  \"clientSecret\": \"USE_DEVICE_CODE_AUTH\","
echo "  \"subscriptionId\": \"$SUBSCRIPTION_ID\","
echo "  \"tenantId\": \"$TENANT_ID\","
echo "  \"activeDirectoryEndpointUrl\": \"https://login.microsoftonline.com\","
echo "  \"resourceManagerEndpointUrl\": \"https://management.azure.com/\","
echo "  \"activeDirectoryGraphResourceId\": \"https://graph.windows.net/\","
echo "  \"sqlManagementEndpointUrl\": \"https://management.core.windows.net:8443/\","
echo "  \"galleryEndpointUrl\": \"https://gallery.azure.com/\","
echo "  \"managementEndpointUrl\": \"https://management.core.windows.net/\""
echo "}"
```

**Option B: Use Personal Azure Account (Alternative)**
If you have access to a personal Azure account (not student), use that instead for this project.

**Option C: Modified GitHub Actions (Student Account Workaround)**
We can modify the CI/CD pipeline to use Azure CLI login instead of service principal.

### Issue: "Insufficient privileges to complete the operation"
**Solution**: This is common with student accounts. Try these alternatives:
1. **Use Cloud Shell method** (Option 2 above)
2. **Contact your instructor** - they may need to grant additional permissions
3. **Use a personal Azure account** instead of the student account

### Issue: Service Principal permissions
**Solution**: 
1. Go to Subscriptions → Your Subscription → Access control (IAM)
2. Verify your service principal has "Contributor" role
3. For student accounts, permissions may be automatically assigned via Cloud Shell

### Issue: Storage account name taken
**Solution**: Try a different name with more unique characters (add your initials, random numbers)

### Issue: Container registry name taken
**Solution**: Add more unique characters to make it globally unique

### Issue: GitHub Actions fails
**Solution**: 
1. Double-check all 8 secrets are exactly as specified
2. Verify the JSON format for AZURE_CREDENTIALS is correct
3. Check there are no extra spaces or characters

### Issue: "The client does not have authorization to perform action"
**Solution**: For student accounts:
1. Make sure you used the Cloud Shell method
2. Verify your subscription is active (not expired)
3. Check that you're using the correct subscription ID

---

## 🎉 Success Indicators

You'll know everything is working when:
- ✅ All 8 GitHub secrets are visible in your repository settings
- ✅ GitHub Actions CI pipeline completes successfully
- ✅ GitHub Actions CD pipeline deploys without errors
- ✅ You can see your resources in the Azure Portal

---

## 💰 Cost Management

### Monitor Your Spending
1. In Azure Portal, search for **"Cost Management + Billing"**
2. Click **"Cost analysis"** to see your current spending
3. Set up **billing alerts** to get notified if costs exceed expectations

### Free Tier Resources
The configuration uses these free tier eligible resources:
- Azure Container Registry (Standard tier - some free operations)
- Storage Account (first 5GB free)
- Small AKS cluster (managed Kubernetes service pricing applies)

---

## 🧹 Cleanup When Done

To avoid ongoing charges:

1. **Delete the Resource Group**:
   - Go to **Resource groups** in Azure Portal
   - Select `rg-food-delivery-setup`
   - Click **"Delete resource group"**
   - Type the resource group name to confirm
   - Click **"Delete"**

2. **Delete the Service Principal**:
   - Go to **Azure Active Directory** → **App registrations**
   - Find `sp-github-food-delivery`
   - Click on it, then click **"Delete"**

---

## 📞 Getting Help

If you get stuck:
1. **Azure Documentation**: [docs.microsoft.com/azure](https://docs.microsoft.com/azure)
2. **GitHub Actions Logs**: Check your repository's Actions tab for detailed error messages
3. **Azure Support**: Use the help chat in Azure Portal (bottom right)

**Next**: After completing this setup, commit and push your code to trigger the automated deployment to Azure! 🚀
