#!/bin/bash

# Update all Kubernetes deployment files to use ACR registry
ACR_NAME="acrfooddeliverydev44a42eo0.azurecr.io"

# Update user-service
sed -i "s|image:.*user-service.*|image: ${ACR_NAME}/user-service:latest|g" kubernetes/user-service/deployment.yaml

# Update restaurant-service  
sed -i "s|image:.*restaurant-service.*|image: ${ACR_NAME}/restaurant-service:latest|g" kubernetes/restaurant-service/deployment.yaml

# Update order-service
sed -i "s|image:.*order-service.*|image: ${ACR_NAME}/order-service:latest|g" kubernetes/order-service/deployment.yaml

# Update payment-service
sed -i "s|image:.*payment-service.*|image: ${ACR_NAME}/payment-service:latest|g" kubernetes/payment-service/deployment.yaml

# Update delivery-service
sed -i "s|image:.*delivery-service.*|image: ${ACR_NAME}/delivery-service:latest|g" kubernetes/delivery-service/deployment.yaml

# Update notification-service
sed -i "s|image:.*notification-service.*|image: ${ACR_NAME}/notification-service:latest|g" kubernetes/notification-service/deployment.yaml

# Update api-gateway
sed -i "s|image:.*api-gateway.*|image: ${ACR_NAME}/api-gateway:latest|g" kubernetes/api-gateway/deployment.yaml

# Update frontend
sed -i "s|image:.*frontend.*|image: ${ACR_NAME}/frontend:latest|g" kubernetes/frontend/deployment.yaml

echo "✅ All Kubernetes manifests updated to use ACR registry: ${ACR_NAME}"
