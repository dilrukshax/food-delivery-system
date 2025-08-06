#!/bin/bash
# Quick Manual Deploy Script
# For when you want to deploy just one service at a time

REGISTRY="acrfooddeliverydev44a42eo0"
SERVICE_NAME="$1"

if [ -z "$SERVICE_NAME" ]; then
    echo "Usage: $0 <service-name>"
    echo ""
    echo "Available services:"
    echo "  user-service"
    echo "  api-gateway" 
    echo "  restaurant-service"
    echo "  order-service"
    echo "  payment-service"
    echo "  delivery-service"
    echo "  notification-service"
    echo "  frontend"
    echo ""
    echo "Example: $0 user-service"
    exit 1
fi

echo "🚀 Building and deploying $SERVICE_NAME..."

# Determine the build path
if [ "$SERVICE_NAME" = "frontend" ]; then
    BUILD_PATH="frontend"
else
    BUILD_PATH="backend/$SERVICE_NAME"
fi

# Check if the directory exists
if [ ! -d "$BUILD_PATH" ]; then
    echo "❌ Directory $BUILD_PATH not found!"
    exit 1
fi

# Build the image
echo "📦 Building Docker image in ACR..."
az acr build \
    --registry $REGISTRY \
    --image $SERVICE_NAME:latest \
    --image $SERVICE_NAME:$(date +%Y%m%d-%H%M%S) \
    $BUILD_PATH

# Update the deployment
echo "🔄 Updating Kubernetes deployment..."
kubectl set image deployment/$SERVICE_NAME $SERVICE_NAME=$REGISTRY.azurecr.io/$SERVICE_NAME:latest

# Wait for rollout
echo "⏳ Waiting for deployment to complete..."
kubectl rollout status deployment/$SERVICE_NAME --timeout=300s

echo ""
echo "✅ $SERVICE_NAME deployed successfully!"
echo ""
echo "📊 Status:"
kubectl get deployment $SERVICE_NAME
echo ""
kubectl get pods -l app=$SERVICE_NAME
