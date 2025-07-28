#!/bin/bash

set -e

echo "Applying Kubernetes resources for food-ordering-system..."

# Set namespace variable
NAMESPACE=food-ordering

# Apply namespace
kubectl apply -f kubernetes/namespace.yaml

# Apply global config and secrets
kubectl apply -f kubernetes/configmap.yaml -n $NAMESPACE
kubectl apply -f kubernetes/secrets.yaml -n $NAMESPACE

# Apply Postgres resources
kubectl apply -f kubernetes/postgres/postgres-pvc.yaml -n $NAMESPACE
kubectl apply -f kubernetes/postgres/postgres-initdb-configmap.yaml -n $NAMESPACE
kubectl apply -f kubernetes/postgres/postgres-deployment.yaml -n $NAMESPACE
kubectl apply -f kubernetes/postgres/postgres-service.yaml -n $NAMESPACE

# Apply each backend microservice
for service in api-gateway user-service restaurant-service order-service payment-service delivery-service notification-service
do
  echo "Applying $service..."
  kubectl apply -f kubernetes/$service/deployment.yaml -n $NAMESPACE
  kubectl apply -f kubernetes/$service/service.yaml -n $NAMESPACE
done

# Apply frontend
kubectl apply -f kubernetes/frontend/deployment.yaml -n $NAMESPACE
kubectl apply -f kubernetes/frontend/service.yaml -n $NAMESPACE

# Apply Ingress
kubectl apply -f kubernetes/ingress.yaml -n $NAMESPACE

echo "✅ Deployment complete!"
