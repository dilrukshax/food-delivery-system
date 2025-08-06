#!/bin/bash

# AWS EKS Deployment Script
set -e

echo "Starting AWS EKS deployment..."

# Variables
AWS_REGION=${AWS_REGION:-"us-west-2"}
CLUSTER_NAME=${CLUSTER_NAME:-"food-delivery-cluster"}
ECR_REPOSITORY_PREFIX="food-delivery"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."
    
    for cmd in aws kubectl terraform; do
        if ! command -v $cmd &> /dev/null; then
            print_error "$cmd is not installed. Please install it first."
            exit 1
        fi
    done
    
    print_status "All requirements satisfied."
}

# Check AWS authentication
check_aws_auth() {
    print_status "Checking AWS authentication..."
    
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS authentication failed. Please run 'aws configure' first."
        exit 1
    fi
    
    print_status "AWS authentication successful."
}

# Create S3 bucket for Terraform state
create_terraform_backend() {
    print_status "Setting up Terraform backend..."
    
    BUCKET_NAME="food-delivery-terraform-state-$(date +%s)"
    
    aws s3 mb s3://$BUCKET_NAME --region $AWS_REGION || true
    aws s3api put-bucket-versioning --bucket $BUCKET_NAME --versioning-configuration Status=Enabled
    
    # Update terraform backend configuration
    sed -i "s/food-delivery-terraform-state/$BUCKET_NAME/g" terraform/main.tf
    
    print_status "Terraform backend created: $BUCKET_NAME"
}

# Deploy infrastructure with Terraform
deploy_infrastructure() {
    print_status "Deploying infrastructure with Terraform..."
    
    cd terraform
    
    terraform init
    terraform plan -var-file="terraform.tfvars"
    
    read -p "Do you want to proceed with the infrastructure deployment? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        terraform apply -var-file="terraform.tfvars" -auto-approve
    else
        print_warning "Infrastructure deployment cancelled."
        exit 1
    fi
    
    cd ..
    print_status "Infrastructure deployment completed."
}

# Update kubeconfig
update_kubeconfig() {
    print_status "Updating kubeconfig..."
    
    aws eks update-kubeconfig --region $AWS_REGION --name $CLUSTER_NAME
    
    print_status "Kubeconfig updated."
}

# Install AWS Load Balancer Controller
install_aws_load_balancer_controller() {
    print_status "Installing AWS Load Balancer Controller..."
    
    # Download policy
    curl -o iam_policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.5.4/docs/install/iam_policy.json
    
    # Create IAM policy
    aws iam create-policy \
        --policy-name AWSLoadBalancerControllerIAMPolicy \
        --policy-document file://iam_policy.json || true
    
    # Create service account
    eksctl create iamserviceaccount \
        --cluster=$CLUSTER_NAME \
        --namespace=kube-system \
        --name=aws-load-balancer-controller \
        --role-name AmazonEKSLoadBalancerControllerRole \
        --attach-policy-arn=arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/AWSLoadBalancerControllerIAMPolicy \
        --approve
    
    # Install the controller
    kubectl apply \
        --validate=false \
        -f https://github.com/jetstack/cert-manager/releases/download/v1.12.0/cert-manager.yaml
    
    # Wait for cert-manager to be ready
    kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=cert-manager -n cert-manager --timeout=300s
    
    # Download and apply AWS Load Balancer Controller
    curl -Lo v2_5_4_full.yaml https://github.com/kubernetes-sigs/aws-load-balancer-controller/releases/download/v2.5.4/v2_5_4_full.yaml
    sed -i.bak -e "s|your-cluster-name|$CLUSTER_NAME|" v2_5_4_full.yaml
    kubectl apply -f v2_5_4_full.yaml
    
    # Remove the downloaded files
    rm -f iam_policy.json v2_5_4_full.yaml v2_5_4_full.yaml.bak
    
    print_status "AWS Load Balancer Controller installed."
}

# Build and push Docker images
build_and_push_images() {
    print_status "Building and pushing Docker images..."
    
    # Get ECR login
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com
    
    # Services to build
    services=("api-gateway" "user-service" "restaurant-service" "order-service" "payment-service" "delivery-service" "notification-service")
    
    for service in "${services[@]}"; do
        print_status "Building $service..."
        
        ECR_REPOSITORY="$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_PREFIX/$service"
        
        docker build -t $ECR_REPOSITORY:latest backend/$service/
        docker push $ECR_REPOSITORY:latest
        
        print_status "$service image pushed successfully."
    done
    
    # Build and push frontend
    print_status "Building frontend..."
    ECR_REPOSITORY="$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_PREFIX/frontend"
    docker build -t $ECR_REPOSITORY:latest frontend/
    docker push $ECR_REPOSITORY:latest
    
    print_status "All images pushed successfully."
}

# Deploy to Kubernetes
deploy_to_kubernetes() {
    print_status "Deploying to Kubernetes..."
    
    # Get account ID
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    
    # Update image URLs in manifests
    find kubernetes/aws -name "*.yaml" -exec sed -i "s/YOUR_ACCOUNT_ID/$ACCOUNT_ID/g" {} +
    
    # Create ECR secret
    kubectl create secret docker-registry ecr-secret \
        --docker-server=$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com \
        --docker-username=AWS \
        --docker-password=$(aws ecr get-login-password --region $AWS_REGION) \
        --namespace=food-delivery \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply Kubernetes manifests
    kubectl apply -f kubernetes/aws/namespace.yaml
    kubectl apply -f kubernetes/aws/configmap.yaml
    kubectl apply -f kubernetes/aws/secrets.yaml
    kubectl apply -f kubernetes/aws/api-gateway/
    
    # Wait for deployment
    kubectl rollout status deployment/api-gateway -n food-delivery --timeout=300s
    
    print_status "Kubernetes deployment completed."
}

# Get deployment information
get_deployment_info() {
    print_status "Getting deployment information..."
    
    echo "Services:"
    kubectl get services -n food-delivery
    
    echo ""
    echo "Pods:"
    kubectl get pods -n food-delivery
    
    echo ""
    echo "Ingresses:"
    kubectl get ingress -n food-delivery
    
    # Get load balancer URL
    ALB_URL=$(kubectl get ingress food-delivery-ingress -n food-delivery -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    if [ ! -z "$ALB_URL" ]; then
        print_status "Your application will be available at: http://$ALB_URL"
    else
        print_warning "Load balancer is still being created. Please check again in a few minutes."
    fi
}

# Main execution
main() {
    echo "Food Delivery System - AWS Deployment Script"
    echo "============================================"
    
    check_requirements
    check_aws_auth
    
    echo ""
    echo "This script will:"
    echo "1. Create Terraform backend"
    echo "2. Deploy infrastructure"
    echo "3. Update kubeconfig"
    echo "4. Install AWS Load Balancer Controller"
    echo "5. Build and push Docker images"
    echo "6. Deploy to Kubernetes"
    echo ""
    
    read -p "Do you want to continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Deployment cancelled."
        exit 1
    fi
    
    create_terraform_backend
    deploy_infrastructure
    update_kubeconfig
    install_aws_load_balancer_controller
    build_and_push_images
    deploy_to_kubernetes
    get_deployment_info
    
    print_status "Deployment completed successfully!"
}

# Run main function
main "$@"
