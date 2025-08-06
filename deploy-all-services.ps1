# Deploy all microservices to EKS
param(
    [string]$region = "us-west-2",
    [string]$account = "608542499398"
)

$ecr_registry = "$account.dkr.ecr.$region.amazonaws.com"

# Function to build, tag and push Docker image
function Build-And-Push-Service {
    param(
        [string]$serviceName,
        [string]$buildPath
    )
    
    Write-Host "Building and pushing $serviceName..."
    
    # Build the image
    docker build -t $serviceName $buildPath
    
    # Tag for ECR
    docker tag "$serviceName`:latest" "$ecr_registry/$serviceName`:latest"
    
    # Push to ECR
    docker push "$ecr_registry/$serviceName`:latest"
    
    Write-Host "$serviceName pushed successfully!"
}

# List of services to build and deploy
$services = @(
    @{name="service-registry"; path="backend/service-registry"},
    @{name="user-service"; path="backend/user-service"},
    @{name="restaurant-service"; path="backend/restaurant-service"},
    @{name="order-service"; path="backend/order-service"},
    @{name="payment-service"; path="backend/payment-service"},
    @{name="delivery-service"; path="backend/delivery-service"},
    @{name="notification-service"; path="backend/notification-service"},
    @{name="frontend"; path="frontend"}
)

Write-Host "Starting deployment of all services to EKS..."
Write-Host "Registry: $ecr_registry"

# Build and push all services
foreach ($service in $services) {
    try {
        Build-And-Push-Service -serviceName $service.name -buildPath $service.path
    } catch {
        Write-Host "Error building $($service.name): $_" -ForegroundColor Red
    }
}

# Deploy all Kubernetes resources
Write-Host "Deploying Kubernetes resources..."

# Deploy PostgreSQL first
kubectl apply -f kubernetes/aws/postgres/

# Deploy all microservices
kubectl apply -f kubernetes/aws/api-gateway/
kubectl apply -f kubernetes/aws/service-registry/
kubectl apply -f kubernetes/aws/user-service/
kubectl apply -f kubernetes/aws/restaurant-service/
kubectl apply -f kubernetes/aws/order-service/
kubectl apply -f kubernetes/aws/payment-service/
kubectl apply -f kubernetes/aws/delivery-service/
kubectl apply -f kubernetes/aws/notification-service/
kubectl apply -f kubernetes/aws/frontend/

# Deploy ingress
kubectl apply -f kubernetes/aws/ingress.yaml

Write-Host "All services deployed! Getting ingress URL..."

# Wait for load balancer to be ready
Write-Host "Waiting for load balancer to be ready..."
kubectl wait --namespace food-delivery --for=condition=ready pod --selector=app.kubernetes.io/name=ingress-nginx --timeout=300s

# Get the load balancer URL
$ingress_ip = kubectl get service -n food-delivery ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

Write-Host "================================"
Write-Host "DEPLOYMENT COMPLETE!"
Write-Host "Your website will be available at:"
Write-Host "http://$ingress_ip"
Write-Host "================================"
