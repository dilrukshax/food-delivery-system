# GitHub Actions Setup Script for Food Delivery System (PowerShell)
# This script helps you set up the necessary secrets and configurations for CI/CD

Write-Host "🚀 Food Delivery System - GitHub Actions Setup" -ForegroundColor Magenta
Write-Host "===============================================" -ForegroundColor Magenta

# Check if required tools are installed
$awsCliInstalled = Get-Command aws -ErrorAction SilentlyContinue
$ghCliInstalled = Get-Command gh -ErrorAction SilentlyContinue

if (-not $awsCliInstalled) {
    Write-Host "❌ AWS CLI is required but not installed. Please install AWS CLI." -ForegroundColor Red
    Write-Host "Download from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

if (-not $ghCliInstalled) {
    Write-Host "❌ GitHub CLI is required but not installed. Please install GitHub CLI." -ForegroundColor Red
    Write-Host "Download from: https://cli.github.com/" -ForegroundColor Yellow
    exit 1
}

# Get AWS Account ID
Write-Host "📋 Getting AWS Account Information..." -ForegroundColor Green
try {
    $awsAccountId = aws sts get-caller-identity --query Account --output text
    if ($LASTEXITCODE -ne 0) {
        throw "AWS CLI command failed"
    }
    Write-Host "✅ AWS Account ID: $awsAccountId" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to get AWS Account ID. Please ensure AWS CLI is configured." -ForegroundColor Red
    Write-Host "Run: aws configure" -ForegroundColor Yellow
    exit 1
}

# Get current AWS credentials
try {
    $awsAccessKeyId = aws configure get aws_access_key_id
    $awsSecretAccessKey = aws configure get aws_secret_access_key
    
    if ([string]::IsNullOrEmpty($awsAccessKeyId) -or [string]::IsNullOrEmpty($awsSecretAccessKey)) {
        throw "AWS credentials not found"
    }
}
catch {
    Write-Host "❌ AWS credentials not found. Please configure AWS CLI first." -ForegroundColor Red
    Write-Host "Run: aws configure" -ForegroundColor Yellow
    exit 1
}

# Check if we're in a git repository
try {
    git rev-parse --git-dir 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Not in git repository"
    }
}
catch {
    Write-Host "❌ Not in a git repository. Please run this script from your project root." -ForegroundColor Red
    exit 1
}

# Check if GitHub CLI is authenticated
try {
    gh auth status 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "GitHub CLI not authenticated"
    }
}
catch {
    Write-Host "❌ GitHub CLI not authenticated. Please run 'gh auth login' first." -ForegroundColor Red
    exit 1
}

Write-Host "🔐 Setting up GitHub Secrets..." -ForegroundColor Green

# Set GitHub secrets
try {
    echo $awsAccountId | gh secret set AWS_ACCOUNT_ID
    echo $awsAccessKeyId | gh secret set AWS_ACCESS_KEY_ID  
    echo $awsSecretAccessKey | gh secret set AWS_SECRET_ACCESS_KEY
    Write-Host "✅ GitHub secrets configured successfully!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to set GitHub secrets. Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🏗️ Creating ECR Repositories..." -ForegroundColor Green

# List of services
$services = @("api-gateway", "user-service", "restaurant-service", "order-service", "payment-service", "delivery-service", "notification-service", "frontend")

# Create ECR repositories
foreach ($service in $services) {
    Write-Host "Creating ECR repository for $service..." -ForegroundColor Yellow
    try {
        aws ecr create-repository --repository-name $service --region us-west-2 2>$null | Out-Null
    }
    catch {
        Write-Host "Repository $service might already exist" -ForegroundColor Gray
    }
}

Write-Host "✅ ECR repositories created!" -ForegroundColor Green

Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "==============" -ForegroundColor Cyan
Write-Host "1. ✅ GitHub secrets are configured" -ForegroundColor Green
Write-Host "2. ✅ ECR repositories are created" -ForegroundColor Green
Write-Host "3. 🔄 Push your code to trigger the CI/CD pipeline:" -ForegroundColor Yellow
Write-Host "   git add ." -ForegroundColor White
Write-Host "   git commit -m 'Add CI/CD pipeline'" -ForegroundColor White
Write-Host "   git push origin main" -ForegroundColor White
Write-Host ""
Write-Host "4. 🌐 Monitor your deployment:" -ForegroundColor Yellow

try {
    $repoInfo = gh repo view --json owner,name | ConvertFrom-Json
    $repoFullName = "$($repoInfo.owner.login)/$($repoInfo.name)"
    Write-Host "   - GitHub Actions: https://github.com/$repoFullName/actions" -ForegroundColor White
}
catch {
    Write-Host "   - GitHub Actions: Check your repository's Actions tab" -ForegroundColor White
}

Write-Host "   - AWS Console: https://console.aws.amazon.com/eks/home?region=us-west-2" -ForegroundColor White
Write-Host ""
Write-Host "5. 📱 Manual deployment (if needed):" -ForegroundColor Yellow
Write-Host "   Go to Actions tab → Deploy to Production → Run workflow" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Setup complete! Your CI/CD pipeline is ready!" -ForegroundColor Magenta
