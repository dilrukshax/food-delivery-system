#!/bin/bash
# Azure Container Registry Build and Deploy Script
# This script builds Docker images in the cloud and deploys them to AKS
# No local Docker installation required!

set -e

REGISTRY="acrfooddeliverydev44a42eo0"
RESOURCE_GROUP="rg-food-delivery-dev-44a42eo0"
AKS_CLUSTER="aks-food-delivery-dev-44a42eo0"

echo "🚀 Building and Deploying Food Delivery System to Azure"
echo "======================================================"
echo "Registry: $REGISTRY.azurecr.io"
echo "AKS Cluster: $AKS_CLUSTER"
echo ""

# Check if we're logged into Azure
echo "🔐 Checking Azure authentication..."
az account show > /dev/null 2>&1 || {
    echo "❌ Not logged into Azure. Please run: az login"
    exit 1
}

# Get AKS credentials
echo "🔑 Getting AKS credentials..."
az aks get-credentials --resource-group $RESOURCE_GROUP --name $AKS_CLUSTER --overwrite-existing

echo ""
echo "🏗️ Building Docker images in Azure Container Registry..."
echo "This may take 5-10 minutes per service..."

# Build backend services
BACKEND_SERVICES=("user-service" "api-gateway" "restaurant-service" "order-service" "payment-service" "delivery-service" "notification-service")

for service in "${BACKEND_SERVICES[@]}"; do
    echo ""
    echo "📦 Building $service..."
    az acr build \
        --registry $REGISTRY \
        --image $service:latest \
        --image $service:$(git rev-parse --short HEAD) \
        backend/$service \
        --no-logs
    echo "✅ $service built successfully"
done

# Build frontend
echo ""
echo "📦 Building frontend..."
az acr build \
    --registry $REGISTRY \
    --image frontend:latest \
    --image frontend:$(git rev-parse --short HEAD) \
    frontend \
    --no-logs
echo "✅ Frontend built successfully"

echo ""
echo "🚀 Deploying to AKS cluster..."

# Update image references in deployments
echo "📝 Updating deployment image references..."

for service in "${BACKEND_SERVICES[@]}"; do
    if kubectl get deployment $service > /dev/null 2>&1; then
        echo "🔄 Updating $service deployment..."
        kubectl set image deployment/$service $service=$REGISTRY.azurecr.io/$service:latest
        kubectl rollout status deployment/$service --timeout=300s
        echo "✅ $service deployed"
    else
        echo "⚠️ Deployment $service not found, applying manifest..."
        kubectl apply -f kubernetes/$service/
    fi
done

# Deploy frontend
if kubectl get deployment frontend > /dev/null 2>&1; then
    echo "🔄 Updating frontend deployment..."
    kubectl set image deployment/frontend frontend=$REGISTRY.azurecr.io/frontend:latest
    kubectl rollout status deployment/frontend --timeout=300s
    echo "✅ Frontend deployed"
else
    echo "⚠️ Frontend deployment not found, applying manifest..."
    kubectl apply -f kubernetes/frontend/
fi

echo ""
echo "🌐 Getting service URLs..."
echo "External services:"
kubectl get services --output=custom-columns="NAME:.metadata.name,TYPE:.spec.type,EXTERNAL-IP:.status.loadBalancer.ingress[0].ip,PORT:.spec.ports[0].port" | grep LoadBalancer

echo ""
echo "📊 Deployment status:"
kubectl get deployments

echo ""
echo "📋 Pod status:"
kubectl get pods

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================================"
echo ""
echo "🌐 Your application should now be accessible at:"
echo "   Frontend: http://[EXTERNAL-IP] (check LoadBalancer services above)"
echo "   API Gateway: http://[EXTERNAL-IP]:8080"
echo ""
echo "💡 Tips:"
echo "   - It may take a few minutes for LoadBalancer IPs to be assigned"
echo "   - Check pod logs: kubectl logs deployment/[service-name]"
echo "   - View all services: kubectl get svc"
echo "   - View pod details: kubectl describe pod [pod-name]"
echo ""
echo "✅ All images are now running your actual application code!"
