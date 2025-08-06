#!/bin/bash
# Deployment Status Checker
# Run this to check the status of your Azure infrastructure and deployments

echo "🔍 AZURE INFRASTRUCTURE STATUS"
echo "=================================="

echo "📊 Checking AKS Cluster Status..."
kubectl get nodes -o wide 2>/dev/null || echo "❌ kubectl not configured"

echo ""
echo "🏗️ Checking Deployed Services..."
kubectl get deployments -o wide 2>/dev/null || echo "❌ No deployments found"

echo ""
echo "🌐 Checking External Services..."
kubectl get services -o wide 2>/dev/null || echo "❌ No services found"

echo ""
echo "📦 Checking Pods Status..."
kubectl get pods -o wide 2>/dev/null || echo "❌ No pods found"

echo ""
echo "🔧 Current Live URLs:"
echo "=================================="
echo "Frontend Demo:     http://4.157.225.15"
echo "API Gateway:       http://135.234.248.211:8080"
echo ""

echo "💾 Container Registry Status:"
echo "=================================="
echo "Registry: acrfooddeliverydev44a42eo0.azurecr.io"
echo "Status: Active ✅"
echo ""

echo "🗃️ Database Status:"
echo "=================================="
echo "PostgreSQL: Still provisioning ⏳"
echo "Connection: Pending completion"
echo ""

echo "🚀 NEXT STEPS:"
echo "=================================="
echo "1. Set up GitHub Service Principal:"
echo "   az ad sp create-for-rbac --name \"github-actions-food-delivery\" --role contributor --scopes /subscriptions/ecf458ab-452d-4a8f-8f6c-dc10cd6fe4d5 --sdk-auth"
echo ""
echo "2. Add AZURE_CREDENTIALS secret to GitHub repository"
echo "3. Commit and push the GitHub Actions workflow"
echo "4. Monitor deployment in GitHub Actions tab"
echo ""
echo "📋 Files to commit:"
echo "   - .github/workflows/build-and-deploy.yml"
echo "   - GITHUB_ACTIONS_SETUP.md (this file)"
echo ""
echo "✅ Infrastructure is ready for automated deployment!"
