# Alternative GitHub Actions Setup for Azure Student Accounts

## 🎓 Student Account Limitations

Azure for Students accounts often have restricted Azure Active Directory permissions, preventing service principal creation via CLI. Here are working alternatives:

## 🔄 **Option 1: GitHub OIDC (Recommended)**

This is the modern approach that doesn't require secrets:

### Step 1: Enable GitHub OIDC in Azure

```bash
# In Azure Cloud Shell, run these commands:
az rest --method POST --uri 'https://graph.microsoft.com/beta/applications' --body '{
  "displayName": "GitHub-OIDC-food-delivery",
  "signInAudience": "AzureADMyOrg"
}'

# Note the appId from the response, then create federated credentials:
az rest --method POST --uri 'https://graph.microsoft.com/beta/applications/[APP-ID]/federatedIdentityCredentials' --body '{
  "name": "github-actions",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:dilrukshax/food-delivery-system:ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"]
}'
```

### Step 2: Update GitHub Actions Workflow

Replace the Azure login step with:

```yaml
- name: Azure Login with OIDC
  uses: azure/login@v1
  with:
    client-id: ${{ secrets.AZURE_CLIENT_ID }}
    tenant-id: ${{ secrets.AZURE_TENANT_ID }}
    subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
```

## 🛠️ **Option 2: Use Existing Credentials**

Since you can access Azure resources, use your personal credentials temporarily:

### Step 1: Get Your Current Token

```bash
# In Azure Cloud Shell:
az account get-access-token --query accessToken -o tsv > token.txt
cat token.txt
```

### Step 2: Create Temporary GitHub Secret

Use this token temporarily as `AZURE_ACCESS_TOKEN` (expires in 1 hour).

## 🎯 **Option 3: Simplified Service Principal via Portal**

### Step 1: Azure Portal Method

1. **Azure Portal** → **Azure Active Directory** → **App registrations**
2. **New registration**:
   - Name: `github-actions-food-delivery`
   - Account types: Single tenant
   - Click **Register**

### Step 2: Create Client Secret

1. Go to **Certificates & secrets**
2. **New client secret**
3. **Copy the Value** immediately (you won't see it again)

### Step 3: Assign Permissions

1. **Subscriptions** → **Your subscription** → **Access control (IAM)**
2. **Add role assignment**
3. **Role**: Contributor
4. **Assign access to**: User, group, or service principal
5. **Members**: Search for your app name

### Step 4: GitHub Secret Format

```json
{
  "clientId": "your-app-id",
  "clientSecret": "your-client-secret",
  "subscriptionId": "ecf458ab-452d-4a8f-8f6c-dc10cd6fe4d5",
  "tenantId": "44e3cf94-19c9-4e32-96c3-14f5bf01391a"
}
```

## 🚀 **Option 4: Deploy Without GitHub Actions**

If all else fails, you can deploy manually:

### Step 1: Build Images Locally (if Docker available)

```bash
# Build and push each service
docker build -t acrfooddeliverydev44a42eo0.azurecr.io/user-service:latest backend/user-service
docker push acrfooddeliverydev44a42eo0.azurecr.io/user-service:latest
```

### Step 2: Or Use Azure Container Registry Build

```bash
# Build in the cloud (no local Docker needed)
az acr build --registry acrfooddeliverydev44a42eo0 --image user-service:latest backend/user-service
az acr build --registry acrfooddeliverydev44a42eo0 --image api-gateway:latest backend/api-gateway
# ... repeat for each service
```

### Step 3: Update Kubernetes Deployments

```bash
# Update the image references and apply
kubectl set image deployment/user-service user-service=acrfooddeliverydev44a42eo0.azurecr.io/user-service:latest
kubectl set image deployment/api-gateway api-gateway=acrfooddeliverydev44a42eo0.azurecr.io/api-gateway:latest
```

## 📋 **Quick Decision Matrix**

| Method | Complexity | Security | Student Friendly |
|--------|------------|----------|------------------|
| **OIDC** | Medium | Best | ⚠️ May need admin |
| **Portal SP** | Low | Good | ✅ Usually works |
| **Temp Token** | Low | Limited | ✅ Quick test |
| **ACR Build** | Low | Good | ✅ No Docker needed |

## 🎯 **Recommended Next Steps**

1. **Try Option 3 (Portal)** first - most likely to work with student accounts
2. **If blocked**, use **Option 4 (ACR Build)** to deploy without GitHub Actions
3. **Future**: Request elevated permissions from your institution's IT department

## 💡 **Current Working Solution**

Your infrastructure is live and ready. You can deploy immediately using ACR Build commands above, then set up automation later when permissions allow.

Would you like me to help you with any of these approaches?
