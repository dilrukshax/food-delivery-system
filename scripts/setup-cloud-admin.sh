#!/bin/bash

# Cloud Admin Setup Script for Food Delivery System
# This script creates the admin user in your cloud PostgreSQL database

set -e

echo "🚀 Food Delivery System - Cloud Admin Setup"
echo "==========================================="

# Configuration
NAMESPACE="food-delivery"
POSTGRES_SERVICE="postgres-service"
POSTGRES_PORT="5432"
DATABASE_NAME="user_service_db"

# Check if kubectl is available and connected to the cluster
if ! kubectl cluster-info >/dev/null 2>&1; then
    echo "❌ Error: kubectl is not configured or cluster is not accessible"
    echo "Please ensure you're connected to your EKS cluster:"
    echo "aws eks update-kubeconfig --region YOUR_REGION --name YOUR_CLUSTER_NAME"
    exit 1
fi

# Check if namespace exists
if ! kubectl get namespace $NAMESPACE >/dev/null 2>&1; then
    echo "❌ Error: Namespace '$NAMESPACE' not found"
    echo "Please ensure your application is deployed"
    exit 1
fi

# Check if PostgreSQL service exists
if ! kubectl get service $POSTGRES_SERVICE -n $NAMESPACE >/dev/null 2>&1; then
    echo "❌ Error: PostgreSQL service '$POSTGRES_SERVICE' not found"
    echo "Please ensure PostgreSQL is deployed"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Method 1: Using Kubernetes Job (Recommended)
echo "📋 Method 1: Creating admin user using Kubernetes Job..."

# Apply the admin setup job
kubectl apply -f kubernetes/admin-setup-job.yaml

# Wait for job completion
echo "⏳ Waiting for admin setup job to complete..."
if kubectl wait --for=condition=complete job/create-admin-user -n $NAMESPACE --timeout=120s; then
    echo "✅ Admin setup job completed successfully!"
    
    # Show job logs
    echo ""
    echo "📄 Job logs:"
    kubectl logs job/create-admin-user -n $NAMESPACE
    
    # Cleanup the job
    echo ""
    echo "🧹 Cleaning up job..."
    kubectl delete job create-admin-user -n $NAMESPACE
else
    echo "❌ Admin setup job failed or timed out"
    echo "📄 Job logs:"
    kubectl logs job/create-admin-user -n $NAMESPACE || true
    echo "📋 Job description:"
    kubectl describe job create-admin-user -n $NAMESPACE || true
    exit 1
fi

echo ""
echo "🎉 Admin user created successfully!"
echo ""
echo "📋 Admin Login Credentials:"
echo "  Email: admin@fooddelivery.com"
echo "  Password: admin123"
echo ""
echo "🌐 Access your application:"
echo "  1. Get the application URL:"
echo "     kubectl get ingress -n $NAMESPACE"
echo "  2. Navigate to: http://YOUR_LOAD_BALANCER_URL/auth/login"
echo "  3. Login with the admin credentials above"
echo "  4. Access admin features at: http://YOUR_LOAD_BALANCER_URL/admin"
echo ""
echo "✅ Cloud admin setup completed!"
