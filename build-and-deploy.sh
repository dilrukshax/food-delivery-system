#!/bin/bash
# Make script executable with: chmod +x build-and-deploy.sh

# Set Minikube's Docker daemon for building
eval $(minikube docker-env)

# Build all Docker images
echo "Building API Gateway..."
docker build -t food-ordering/api-gateway:latest -f backend/api-gateway/Dockerfile backend/api-gateway

echo "Building User Service..."
docker build -t food-ordering/user-service:latest -f backend/user-service/Dockerfile backend/user-service

echo "Building Restaurant Service..."
docker build -t food-ordering/restaurant-service:latest -f backend/restaurant-service/Dockerfile backend/restaurant-service

echo "Building Order Service..."
docker build -t food-ordering/order-service:latest -f backend/order-service/Dockerfile backend/order-service

echo "Building Payment Service..."
docker build -t food-ordering/payment-service:latest -f backend/payment-service/Dockerfile backend/payment-service

echo "Building Delivery Service..."
docker build -t food-ordering/delivery-service:latest -f backend/delivery-service/Dockerfile backend/delivery-service

echo "Building Notification Service..."
docker build -t food-ordering/notification-service:latest -f backend/notification-service/Dockerfile backend/notification-service

echo "Building Frontend..."
docker build -t food-ordering/frontend:latest -f frontend/food-ordering-frontend/Dockerfile frontend/food-ordering-frontend

# Apply Kubernetes configurations
echo "Applying Kubernetes configurations..."
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/secrets.yaml
kubectl apply -f kubernetes/postgres-pv.yaml
kubectl apply -f kubernetes/postgres-deployment.yaml
kubectl apply -f kubernetes/api-gateway-deployment.yaml
kubectl apply -f kubernetes/user-service-deployment.yaml
kubectl apply -f kubernetes/restaurant-service-deployment.yaml
kubectl apply -f kubernetes/order-service-deployment.yaml
kubectl apply -f kubernetes/payment-service-deployment.yaml
kubectl apply -f kubernetes/delivery-service-deployment.yaml
kubectl apply -f kubernetes/notification-service-deployment.yaml
kubectl apply -f kubernetes/frontend-deployment.yaml
kubectl apply -f kubernetes/ingress.yaml

echo "Done! Waiting for deployments to be ready..."
kubectl get pods -n food-ordering -w
