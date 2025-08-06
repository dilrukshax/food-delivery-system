#!/bin/bash

# Environment Setup Script
set -e

ENVIRONMENT=${1:-dev}
AWS_REGION=${2:-us-west-2}

echo "Setting up environment: $ENVIRONMENT"

# Create environment-specific namespace
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Namespace
metadata:
  name: food-delivery-$ENVIRONMENT
  labels:
    name: food-delivery-$ENVIRONMENT
    environment: $ENVIRONMENT
EOF

# Create environment-specific configmap
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config-$ENVIRONMENT
  namespace: food-delivery-$ENVIRONMENT
data:
  ENVIRONMENT: "$ENVIRONMENT"
  AWS_REGION: "$AWS_REGION"
  LOG_LEVEL: $([ "$ENVIRONMENT" = "prod" ] && echo "WARN" || echo "DEBUG")
  SPRING_PROFILES_ACTIVE: "aws,$ENVIRONMENT"
EOF

echo "Environment $ENVIRONMENT setup completed!"
