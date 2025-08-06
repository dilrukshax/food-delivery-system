# Azure Service Principal Setup for GitHub Actions

## 🔑 Setup Instructions

### Step 1: Create Azure Service Principal

Run this command in your terminal (Azure CLI required):

```bash
az ad sp create-for-rbac \
  --name "github-actions-food-delivery" \
  --role contributor \
  --scopes /subscriptions/ecf458ab-452d-4a8f-8f6c-dc10cd6fe4d5 \
  --sdk-auth
```

This will output JSON like:
```json
{
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "subscriptionId": "ecf458ab-452d-4a8f-8f6c-dc10cd6fe4d5",
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

### Step 2: Add GitHub Repository Secrets

Go to your GitHub repository: https://github.com/dilrukshax/food-delivery-system

1. Click **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add this secret:

**Name:** `AZURE_CREDENTIALS`
**Value:** Paste the entire JSON output from Step 1

### Step 3: Verify Current Resources

Your current Azure resources:
- **Subscription ID:** ecf458ab-452d-4a8f-8f6c-dc10cd6fe4d5
- **Resource Group:** rg-food-delivery-dev-44a42eo0
- **AKS Cluster:** aks-food-delivery-dev-44a42eo0
- **ACR Registry:** acrfooddeliverydev44a42eo0.azurecr.io

### Step 4: Grant ACR Permissions

```bash
# Grant the service principal permission to push to ACR
az role assignment create \
  --assignee "CLIENT_ID_FROM_STEP_1" \
  --role "AcrPush" \
  --scope "/subscriptions/ecf458ab-452d-4a8f-8f6c-dc10cd6fe4d5/resourceGroups/rg-food-delivery-dev-44a42eo0/providers/Microsoft.ContainerRegistry/registries/acrfooddeliverydev44a42eo0"
```

### Step 5: Test the Workflow

1. **Commit and push** the workflow file to your repository
2. **Push to main branch** to trigger the deployment
3. **Monitor** the workflow in GitHub Actions tab

## 🚀 What the Workflow Does

### ✅ **Testing Phase:**
- Runs all backend tests (Maven)
- Runs frontend tests (npm)
- Security vulnerability scanning with Trivy

### 🏗️ **Build Phase:**
- Builds Docker images for all 8 microservices + frontend
- Tags images with commit SHA and 'latest'
- Pushes images to Azure Container Registry

### 🚀 **Deploy Phase:**
- Updates Kubernetes manifests with new image tags
- Deploys all services to AKS cluster
- Waits for deployments to be ready
- Performs health checks
- Reports deployment status

## 📊 **Expected Results After Deployment:**

Your Food Delivery System will be fully deployed with:
- **All 8 microservices** running your actual code
- **Production-ready images** in Azure Container Registry
- **External access** via LoadBalancer services
- **Health monitoring** and status checks
- **Automated deployments** on every push to main

## 🔧 **Manual Trigger Option:**

You can also manually trigger the deployment:
1. Go to **Actions** tab in GitHub
2. Select **Build and Deploy Food Delivery System**
3. Click **Run workflow**
4. Choose branch and click **Run workflow**

---

## 🎯 **Quick Start Command:**

```bash
# Run this single command to set up everything:
az ad sp create-for-rbac --name "github-actions-food-delivery" --role contributor --scopes /subscriptions/ecf458ab-452d-4a8f-8f6c-dc10cd6fe4d5 --sdk-auth
```

Copy the output and add it as `AZURE_CREDENTIALS` secret in GitHub!
