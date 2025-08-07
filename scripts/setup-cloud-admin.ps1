# Cloud Admin Setup Script for Food Delivery System (Windows)
# This script creates the admin user in your cloud PostgreSQL database

param(
    [string]$Namespace = "food-delivery",
    [string]$PostgresService = "postgres-service",
    [string]$DatabaseName = "user_service_db"
)

Write-Host "Food Delivery System - Cloud Admin Setup" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green

# Check if kubectl is available and connected to the cluster
try {
    kubectl cluster-info 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "kubectl not connected"
    }
}
catch {
    Write-Host "ERROR: kubectl is not configured or cluster is not accessible" -ForegroundColor Red
    Write-Host "Please ensure you're connected to your EKS cluster:" -ForegroundColor Yellow
    Write-Host "aws eks update-kubeconfig --region YOUR_REGION --name YOUR_CLUSTER_NAME" -ForegroundColor Cyan
    exit 1
}

# Check if namespace exists
try {
    kubectl get namespace $Namespace 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "namespace not found"
    }
}
catch {
    Write-Host "ERROR: Namespace '$Namespace' not found" -ForegroundColor Red
    Write-Host "Please ensure your application is deployed" -ForegroundColor Yellow
    exit 1
}

# Check if PostgreSQL service exists
try {
    kubectl get service $PostgresService -n $Namespace 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "service not found"
    }
}
catch {
    Write-Host "ERROR: PostgreSQL service '$PostgresService' not found" -ForegroundColor Red
    Write-Host "Please ensure PostgreSQL is deployed" -ForegroundColor Yellow
    exit 1
}

Write-Host "SUCCESS: Prerequisites check passed" -ForegroundColor Green
Write-Host ""

# Method 1: Using Kubernetes Job (Recommended)
Write-Host "Method 1: Creating admin user using Kubernetes Job..." -ForegroundColor Cyan

# Apply the admin setup job
kubectl apply -f kubernetes/admin-setup-job.yaml

# Wait for job completion
Write-Host "Waiting for admin setup job to complete..." -ForegroundColor Yellow

$jobCompleted = $false
$timeout = 120
$elapsed = 0

while ($elapsed -lt $timeout -and -not $jobCompleted) {
    Start-Sleep -Seconds 5
    $elapsed += 5
    
    $jobStatus = kubectl get job create-admin-user -n $Namespace -o jsonpath='{.status.conditions[0].type}' 2>$null
    if ($jobStatus -eq "Complete") {
        $jobCompleted = $true
    }
    
    Write-Host "." -NoNewline -ForegroundColor Yellow
}

Write-Host ""

if ($jobCompleted) {
    Write-Host "SUCCESS: Admin setup job completed successfully!" -ForegroundColor Green
    
    # Show job logs
    Write-Host ""
    Write-Host "Job logs:" -ForegroundColor Cyan
    kubectl logs job/create-admin-user -n $Namespace
    
    # Cleanup the job
    Write-Host ""
    Write-Host "Cleaning up job..." -ForegroundColor Yellow
    kubectl delete job create-admin-user -n $Namespace
}
else {
    Write-Host "ERROR: Admin setup job failed or timed out" -ForegroundColor Red
    Write-Host "Job logs:" -ForegroundColor Cyan
    kubectl logs job/create-admin-user -n $Namespace 2>$null
    Write-Host "Job description:" -ForegroundColor Cyan
    kubectl describe job create-admin-user -n $Namespace 2>$null
    exit 1
}

Write-Host ""
Write-Host "SUCCESS: Admin user created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Admin Login Credentials:" -ForegroundColor Cyan
Write-Host "  Email: admin@fooddelivery.com" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Access your application:" -ForegroundColor Cyan
Write-Host "  1. Get the application URL:" -ForegroundColor White
Write-Host "     kubectl get ingress -n $Namespace" -ForegroundColor Yellow
Write-Host "  2. Navigate to: http://YOUR_LOAD_BALANCER_URL/auth/login" -ForegroundColor White
Write-Host "  3. Login with the admin credentials above" -ForegroundColor White
Write-Host "  4. Access admin features at: http://YOUR_LOAD_BALANCER_URL/admin" -ForegroundColor White
Write-Host ""
Write-Host "SUCCESS: Cloud admin setup completed!" -ForegroundColor Green
