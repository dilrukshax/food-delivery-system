# Post-Infrastructure Deployment Script
# Run this after Terraform deployment completes

Write-Host "Food Delivery System - Post Deployment Setup" -ForegroundColor Magenta
Write-Host "=============================================" -ForegroundColor Magenta

# Step 1: Update kubeconfig
Write-Host "Step 1: Updating kubeconfig..." -ForegroundColor Green
try {
    aws eks update-kubeconfig --region us-west-2 --name food-delivery-cluster
    Write-Host "✓ Kubeconfig updated successfully" -ForegroundColor Green
}
catch {
    Write-Host "✗ Failed to update kubeconfig. EKS cluster might still be creating." -ForegroundColor Red
    Write-Host "Please wait and try again in a few minutes." -ForegroundColor Yellow
    exit 1
}

# Step 2: Install AWS Load Balancer Controller
Write-Host "`nStep 2: Installing AWS Load Balancer Controller..." -ForegroundColor Green

# Download IAM policy
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.5.4/docs/install/iam_policy.json" -OutFile "iam_policy.json"

# Create IAM policy (ignore if exists)
aws iam create-policy --policy-name AWSLoadBalancerControllerIAMPolicy --policy-document file://iam_policy.json 2>$null

# Get account ID
$accountId = aws sts get-caller-identity --query Account --output text

# Create service account
eksctl create iamserviceaccount --cluster=food-delivery-cluster --namespace=kube-system --name=aws-load-balancer-controller --role-name AmazonEKSLoadBalancerControllerRole --attach-policy-arn="arn:aws:iam::$accountId:policy/AWSLoadBalancerControllerIAMPolicy" --approve

# Install cert-manager
kubectl apply --validate=false -f https://github.com/jetstack/cert-manager/releases/download/v1.12.0/cert-manager.yaml

# Wait for cert-manager
Write-Host "Waiting for cert-manager to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=cert-manager -n cert-manager --timeout=300s

# Install AWS Load Balancer Controller
Invoke-WebRequest -Uri "https://github.com/kubernetes-sigs/aws-load-balancer-controller/releases/download/v2.5.4/v2_5_4_full.yaml" -OutFile "v2_5_4_full.yaml"
(Get-Content "v2_5_4_full.yaml") -replace "your-cluster-name", "food-delivery-cluster" | Set-Content "v2_5_4_full.yaml"
kubectl apply -f v2_5_4_full.yaml

# Cleanup
Remove-Item -Force -ErrorAction SilentlyContinue "iam_policy.json", "v2_5_4_full.yaml"

Write-Host "✓ AWS Load Balancer Controller installed" -ForegroundColor Green

# Step 3: Build and Push Docker Images
Write-Host "`nStep 3: Building and pushing Docker images..." -ForegroundColor Green

# Get ECR login
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin "$accountId.dkr.ecr.us-west-2.amazonaws.com"

# Build and push services
$services = @("api-gateway", "user-service", "restaurant-service", "order-service", "payment-service", "delivery-service", "notification-service")

foreach ($service in $services) {
    Write-Host "Building $service..." -ForegroundColor Yellow
    
    $ecrRepository = "$accountId.dkr.ecr.us-west-2.amazonaws.com/food-delivery/$service"
    
    docker build -t "$ecrRepository:latest" "backend\$service\"
    docker push "$ecrRepository:latest"
    
    Write-Host "✓ $service image pushed" -ForegroundColor Green
}

# Build and push frontend
Write-Host "Building frontend..." -ForegroundColor Yellow
$ecrRepository = "$accountId.dkr.ecr.us-west-2.amazonaws.com/food-delivery/frontend"
docker build -t "$ecrRepository:latest" "frontend\"
docker push "$ecrRepository:latest"
Write-Host "✓ Frontend image pushed" -ForegroundColor Green

# Step 4: Deploy to Kubernetes
Write-Host "`nStep 4: Deploying to Kubernetes..." -ForegroundColor Green

# Update image URLs in manifests
$yamlFiles = Get-ChildItem -Path "kubernetes\aws" -Filter "*.yaml" -Recurse
foreach ($file in $yamlFiles) {
    (Get-Content $file.FullName) -replace "YOUR_ACCOUNT_ID", $accountId | Set-Content $file.FullName
}

# Create ECR secret
$dockerPassword = aws ecr get-login-password --region us-west-2
kubectl create secret docker-registry ecr-secret --docker-server="$accountId.dkr.ecr.us-west-2.amazonaws.com" --docker-username=AWS --docker-password=$dockerPassword --namespace=food-delivery --dry-run=client -o yaml | kubectl apply -f -

# Apply Kubernetes manifests
kubectl apply -f kubernetes\aws\namespace.yaml
kubectl apply -f kubernetes\aws\configmap.yaml
kubectl apply -f kubernetes\aws\secrets.yaml
kubectl apply -f kubernetes\aws\api-gateway\
kubectl apply -f kubernetes\aws\user-service\
kubectl apply -f kubernetes\aws\frontend\
kubectl apply -f kubernetes\aws\ingress.yaml

# Wait for deployments
Write-Host "`nWaiting for deployments to be ready..."
kubectl rollout status deployment/api-gateway -n food-delivery --timeout=300s

# Step 5: Get Application URL
Write-Host "`nStep 5: Getting application information..." -ForegroundColor Green

Write-Host "`nServices:" -ForegroundColor Cyan
kubectl get services -n food-delivery

Write-Host "`nPods:" -ForegroundColor Cyan
kubectl get pods -n food-delivery

Write-Host "`nIngresses:" -ForegroundColor Cyan
kubectl get ingress -n food-delivery

# Get load balancer URL
try {
    $albUrl = kubectl get ingress food-delivery-ingress -n food-delivery -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
    if ($albUrl) {
        Write-Host "`n🎉 SUCCESS! Your application is available at:" -ForegroundColor Green
        Write-Host "Frontend: http://$albUrl" -ForegroundColor Cyan
        Write-Host "API: http://$albUrl/api" -ForegroundColor Cyan
    }
    else {
        Write-Host "`n⏳ Load balancer is still being created. Please check again in a few minutes using:" -ForegroundColor Yellow
        Write-Host "kubectl get ingress food-delivery-ingress -n food-delivery" -ForegroundColor White
    }
}
catch {
    Write-Host "`n⚠️ Could not retrieve load balancer URL. Check ingress status manually:" -ForegroundColor Yellow
    Write-Host "kubectl get ingress -n food-delivery" -ForegroundColor White
}

Write-Host "`n✅ Deployment completed!" -ForegroundColor Green
