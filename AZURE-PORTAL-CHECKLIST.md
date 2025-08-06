# 📋 Azure Portal Setup Checklist

Print this page or keep it open while following the Azure Portal Guide!

## ✅ Pre-Setup Checklist

- [ ] Azure account created (portal.azure.com)
- [ ] Logged into Azure Portal
- [ ] GitHub repository accessible (github.com/dilrukshax/food-delivery-system)

---

## 🎯 Step-by-Step Progress Tracker

### 📁 Step 2: Resource Group
- [ ] Navigate to "Resource groups" in Azure Portal
- [ ] Click "+ Create"
- [ ] Name: `rg-food-delivery-setup`
- [ ] Region: `East US`
- [ ] Successfully created ✅

### 🏪 Step 3: Container Registry
- [ ] Navigate to "Container registries"
- [ ] Click "+ Create"
- [ ] Resource group: `rg-food-delivery-setup`
- [ ] Registry name: `acrfooddelivery[DATE]` (must be unique)
- [ ] SKU: "Standard"
- [ ] Successfully created ✅
- [ ] Enable "Admin user" in Access keys
- [ ] **📝 Saved Login server**: ________________________
- [ ] **📝 Saved Username**: ________________________
- [ ] **📝 Saved Password**: ________________________

### 🗄️ Step 4: Storage Account
- [ ] Navigate to "Storage accounts"
- [ ] Click "+ Create"
- [ ] Resource group: `rg-food-delivery-setup`
- [ ] Storage name: `saterraform[DATE][INITIALS]` (must be unique)
- [ ] Performance: "Standard"
- [ ] Redundancy: "LRS"
- [ ] Successfully created ✅
- [ ] Created container named: `tfstate`
- [ ] **📝 Saved Storage account name**: ________________________

### 🔐 Step 5: Service Principal
- [ ] Navigate to "Azure Active Directory"
- [ ] Go to "App registrations"
- [ ] Click "+ New registration"
- [ ] Name: `sp-github-food-delivery`
- [ ] Successfully registered ✅
- [ ] **📝 Saved Application (client) ID**: ________________________
- [ ] **📝 Saved Directory (tenant) ID**: ________________________
- [ ] Created client secret in "Certificates & secrets"
- [ ] **📝 Saved Client secret value**: ________________________
- [ ] Found subscription ID in "Subscriptions"
- [ ] **📝 Saved Subscription ID**: ________________________
- [ ] Assigned "Contributor" role to service principal ✅

### 🔑 Step 6: PostgreSQL Password
- [ ] Generated secure password (25+ characters)
- [ ] **📝 Saved password**: ________________________

---

## 📝 GitHub Secrets Checklist

Copy each value to GitHub (Settings → Secrets and variables → Actions):

### Secret 1: AZURE_CREDENTIALS
- [ ] Created JSON with all 4 IDs:
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
- [ ] Added to GitHub as `AZURE_CREDENTIALS` ✅

### Secret 2-4: Container Registry
- [ ] Added `ACR_LOGIN_SERVER` ✅
- [ ] Added `ACR_USERNAME` ✅
- [ ] Added `ACR_PASSWORD` ✅

### Secret 5: Database
- [ ] Added `POSTGRES_ADMIN_PASSWORD` ✅

### Secret 6-8: Terraform Storage
- [ ] Added `TERRAFORM_STATE_RG` = `rg-food-delivery-setup` ✅
- [ ] Added `TERRAFORM_STATE_SA` = [your storage account name] ✅
- [ ] Added `TERRAFORM_STATE_CONTAINER` = `tfstate` ✅

---

## ✅ Final Verification

- [ ] Total of 8 secrets visible in GitHub repository settings
- [ ] All secret names are exactly as specified (case-sensitive)
- [ ] No extra spaces or characters in secret values
- [ ] JSON for AZURE_CREDENTIALS is properly formatted

---

## 🚀 Deployment Trigger

- [ ] Commit any change to repository
- [ ] Push to main branch: `git push origin main`
- [ ] Monitor GitHub Actions tab for CI/CD pipeline
- [ ] CI pipeline completes successfully ✅
- [ ] CD pipeline deploys infrastructure ✅
- [ ] Application is accessible ✅

---

## 📞 Emergency Contacts & Links

- **Azure Portal**: https://portal.azure.com
- **GitHub Repository**: https://github.com/dilrukshax/food-delivery-system
- **GitHub Actions**: https://github.com/dilrukshax/food-delivery-system/actions
- **Azure Documentation**: https://docs.microsoft.com/azure
- **Password Generator**: https://passwordgenerator.net

---

## 🛠️ Troubleshooting Quick Fixes

| Problem | Quick Fix |
|---------|-----------|
| Can't find Azure AD | Search "Microsoft Entra ID" instead |
| Name already taken | Add more unique characters (date, initials) |
| Permission denied | Check service principal has "Contributor" role |
| GitHub Actions fails | Verify all 8 secrets are exactly correct |
| JSON format error | Use online JSON validator |

---

## 💰 Cost Monitoring

- [ ] Set up billing alert in "Cost Management + Billing"
- [ ] Monitor usage in Azure Portal dashboard
- [ ] Remember to clean up resources when done testing

**Estimated monthly cost for development**: $20-50 USD (within free tier limits initially)

---

**⏱️ Estimated Total Time**: 45-60 minutes for first-time setup

**🎯 Success Goal**: Deploy your microservices application to Azure with automated CI/CD!
