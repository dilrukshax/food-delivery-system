# AWS Deployment PowerShell Script
param(
    [Parameter(Mandatory=$false)]
    [string]$AwsRegion = "us-west-2",
    
    [Parameter(Mandatory=$false)]
    [string]$ClusterName = "food-delivery-cluster"
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors for output
function Write-Status {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Test-CommandExists {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Test-Requirements {
    Write-Status "Checking requirements..."
    
    $requiredCommands = @("aws", "kubectl", "terraform", "docker")
    $missing = @()
    
    foreach ($cmd in $requiredCommands) {
        if (-not (Test-CommandExists $cmd)) {
            $missing += $cmd
        }
    }
    
    if ($missing.Count -gt 0) {
        Write-Error "Missing required commands: $($missing -join ', ')"
        Write-Host "Please install missing tools and try again."
        exit 1
    }
    
    Write-Status "All requirements satisfied."
}

function Test-AwsAuth {
    Write-Status "Checking AWS authentication..."
    
    try {
        aws sts get-caller-identity --output text | Out-Null
        Write-Status "AWS authentication successful."
    }
    catch {
        Write-Error "AWS authentication failed. Please run 'aws configure' first."
        exit 1
    }
}

function New-TerraformBackend {
    Write-Status "Setting up Terraform backend..."
    
    $bucketName = "food-delivery-terraform-state-$(Get-Date -Format 'yyyyMMddHHmmss')"
    
    try {
        aws s3 mb "s3://$bucketName" --region $AwsRegion
        aws s3api put-bucket-versioning --bucket $bucketName --versioning-configuration Status=Enabled
        
        # Update terraform backend configuration
        $terraformMainPath = "terraform\main.tf"
        if (Test-Path $terraformMainPath) {
            (Get-Content $terraformMainPath) -replace "food-delivery-terraform-state", $bucketName | Set-Content $terraformMainPath
        }
        
        Write-Status "Terraform backend created: $bucketName"
    }
    catch {
        Write-Error "Failed to create Terraform backend: $_"
        exit 1
    }
}

function Deploy-Infrastructure {
    Write-Status "Deploying infrastructure with Terraform..."
    
    Push-Location terraform
    
    try {
        terraform init
        terraform plan -var-file="terraform.tfvars"
        
        $confirmation = Read-Host "Do you want to proceed with the infrastructure deployment? (y/N)"
        if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
            terraform apply -var-file="terraform.tfvars" -auto-approve
            Write-Status "Infrastructure deployment completed."
        }
        else {
            Write-Warning "Infrastructure deployment cancelled."
            exit 1
        }
    }
    catch {
        Write-Error "Infrastructure deployment failed: $_"
        exit 1
    }
    finally {
        Pop-Location
    }
}

function Update-KubeConfig {
    Write-Status "Updating kubeconfig..."
    
    try {
        aws eks update-kubeconfig --region $AwsRegion --name $ClusterName
        Write-Status "Kubeconfig updated."
    }
    catch {
        Write-Error "Failed to update kubeconfig: $_"
        exit 1
    }
}

function Install-AwsLoadBalancerController {
    Write-Status "Installing AWS Load Balancer Controller..."
    
    try {
        # Download policy
        Invoke-WebRequest -Uri "https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.5.4/docs/install/iam_policy.json" -OutFile "iam_policy.json"
        
        # Create IAM policy
        aws iam create-policy --policy-name AWSLoadBalancerControllerIAMPolicy --policy-document file://iam_policy.json 2>$null
        
        # Create service account
        eksctl create iamserviceaccount --cluster=$ClusterName --namespace=kube-system --name=aws-load-balancer-controller --role-name AmazonEKSLoadBalancerControllerRole --attach-policy-arn="arn:aws:iam::$((aws sts get-caller-identity --query Account --output text)):policy/AWSLoadBalancerControllerIAMPolicy" --approve
        
        # Install cert-manager
        kubectl apply --validate=false -f https://github.com/jetstack/cert-manager/releases/download/v1.12.0/cert-manager.yaml
        
        # Wait for cert-manager
        kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=cert-manager -n cert-manager --timeout=300s
        
        # Install AWS Load Balancer Controller
        Invoke-WebRequest -Uri "https://github.com/kubernetes-sigs/aws-load-balancer-controller/releases/download/v2.5.4/v2_5_4_full.yaml" -OutFile "v2_5_4_full.yaml"
        (Get-Content "v2_5_4_full.yaml") -replace "your-cluster-name", $ClusterName | Set-Content "v2_5_4_full.yaml"
        kubectl apply -f v2_5_4_full.yaml
        
        # Cleanup
        Remove-Item -Force -ErrorAction SilentlyContinue "iam_policy.json", "v2_5_4_full.yaml"
        
        Write-Status "AWS Load Balancer Controller installed."
    }
    catch {
        Write-Error "Failed to install AWS Load Balancer Controller: $_"
        exit 1
    }
}

function Build-AndPushImages {
    Write-Status "Building and pushing Docker images..."
    
    try {
        # Get ECR login
        $accountId = aws sts get-caller-identity --query Account --output text
        aws ecr get-login-password --region $AwsRegion | docker login --username AWS --password-stdin "$accountId.dkr.ecr.$AwsRegion.amazonaws.com"
        
        # Services to build
        $services = @("api-gateway", "user-service", "restaurant-service", "order-service", "payment-service", "delivery-service", "notification-service")
        
        foreach ($service in $services) {
            Write-Status "Building $service..."
            
            $ecrRepository = "$accountId.dkr.ecr.$AwsRegion.amazonaws.com/food-delivery/$service"
            
            docker build -t "$ecrRepository:latest" "backend\$service\"
            docker push "$ecrRepository:latest"
            
            Write-Status "$service image pushed successfully."
        }
        
        # Build and push frontend
        Write-Status "Building frontend..."
        $ecrRepository = "$accountId.dkr.ecr.$AwsRegion.amazonaws.com/food-delivery/frontend"
        docker build -t "$ecrRepository:latest" "frontend\"
        docker push "$ecrRepository:latest"
        
        Write-Status "All images pushed successfully."
    }
    catch {
        Write-Error "Failed to build and push images: $_"
        exit 1
    }
}

function Deploy-ToKubernetes {
    Write-Status "Deploying to Kubernetes..."
    
    try {
        # Get account ID
        $accountId = aws sts get-caller-identity --query Account --output text
        
        # Update image URLs in manifests
        $yamlFiles = Get-ChildItem -Path "kubernetes\aws" -Filter "*.yaml" -Recurse
        foreach ($file in $yamlFiles) {
            (Get-Content $file.FullName) -replace "YOUR_ACCOUNT_ID", $accountId | Set-Content $file.FullName
        }
        
        # Create ECR secret
        $dockerPassword = aws ecr get-login-password --region $AwsRegion
        kubectl create secret docker-registry ecr-secret --docker-server="$accountId.dkr.ecr.$AwsRegion.amazonaws.com" --docker-username=AWS --docker-password=$dockerPassword --namespace=food-delivery --dry-run=client -o yaml | kubectl apply -f -
        
        # Apply Kubernetes manifests
        kubectl apply -f kubernetes\aws\namespace.yaml
        kubectl apply -f kubernetes\aws\configmap.yaml
        kubectl apply -f kubernetes\aws\secrets.yaml
        kubectl apply -f kubernetes\aws\api-gateway\
        
        # Wait for deployment
        kubectl rollout status deployment/api-gateway -n food-delivery --timeout=300s
        
        Write-Status "Kubernetes deployment completed."
    }
    catch {
        Write-Error "Failed to deploy to Kubernetes: $_"
        exit 1
    }
}

function Get-DeploymentInfo {
    Write-Status "Getting deployment information..."
    
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
            Write-Status "Your application will be available at: http://$albUrl"
        }
        else {
            Write-Warning "Load balancer is still being created. Please check again in a few minutes."
        }
    }
    catch {
        Write-Warning "Could not retrieve load balancer URL. Check ingress status manually."
    }
}

# Main execution
function Main {
    Write-Host "Food Delivery System - AWS Deployment Script (PowerShell)" -ForegroundColor Magenta
    Write-Host "==========================================================" -ForegroundColor Magenta
    
    Test-Requirements
    Test-AwsAuth
    
    Write-Host "`nThis script will:" -ForegroundColor Cyan
    Write-Host "1. Create Terraform backend"
    Write-Host "2. Deploy infrastructure"
    Write-Host "3. Update kubeconfig"
    Write-Host "4. Install AWS Load Balancer Controller"
    Write-Host "5. Build and push Docker images"
    Write-Host "6. Deploy to Kubernetes"
    
    $confirmation = Read-Host "`nDo you want to continue? (y/N)"
    if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
        Write-Warning "Deployment cancelled."
        exit 1
    }
    
    New-TerraformBackend
    Deploy-Infrastructure
    Update-KubeConfig
    Install-AwsLoadBalancerController
    Build-AndPushImages
    Deploy-ToKubernetes
    Get-DeploymentInfo
    
    Write-Status "Deployment completed successfully!"
}

# Run main function
Main
