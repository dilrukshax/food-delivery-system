#!/bin/bash

# GitHub Actions Setup Script for Food Delivery System
# This script helps you set up the necessary secrets and configurations for CI/CD

echo "🚀 Food Delivery System - GitHub Actions Setup"
echo "=============================================="

# Check if required tools are installed
command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI is required but not installed. Aborting." >&2; exit 1; }
command -v gh >/dev/null 2>&1 || { echo "❌ GitHub CLI is required but not installed. Aborting." >&2; exit 1; }

# Get AWS Account ID
echo "📋 Getting AWS Account Information..."
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
if [ $? -ne 0 ]; then
    echo "❌ Failed to get AWS Account ID. Please ensure AWS CLI is configured."
    exit 1
fi

echo "✅ AWS Account ID: $AWS_ACCOUNT_ID"

# Get current AWS credentials
AWS_ACCESS_KEY_ID=$(aws configure get aws_access_key_id)
AWS_SECRET_ACCESS_KEY=$(aws configure get aws_secret_access_key)

if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "❌ AWS credentials not found. Please configure AWS CLI first."
    echo "Run: aws configure"
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository. Please run this script from your project root."
    exit 1
fi

# Check if GitHub CLI is authenticated
if ! gh auth status >/dev/null 2>&1; then
    echo "❌ GitHub CLI not authenticated. Please run 'gh auth login' first."
    exit 1
fi

echo "🔐 Setting up GitHub Secrets..."

# Set GitHub secrets
gh secret set AWS_ACCOUNT_ID --body "$AWS_ACCOUNT_ID"
gh secret set AWS_ACCESS_KEY_ID --body "$AWS_ACCESS_KEY_ID"
gh secret set AWS_SECRET_ACCESS_KEY --body "$AWS_SECRET_ACCESS_KEY"

echo "✅ GitHub secrets configured successfully!"

echo ""
echo "🏗️  Creating ECR Repositories..."

# List of services
SERVICES=("api-gateway" "user-service" "restaurant-service" "order-service" "payment-service" "delivery-service" "notification-service" "frontend")

# Create ECR repositories
for service in "${SERVICES[@]}"; do
    echo "Creating ECR repository for $service..."
    aws ecr create-repository --repository-name "$service" --region us-west-2 >/dev/null 2>&1 || echo "Repository $service might already exist"
done

echo "✅ ECR repositories created!"

echo ""
echo "📝 Next Steps:"
echo "=============="
echo "1. ✅ GitHub secrets are configured"
echo "2. ✅ ECR repositories are created"
echo "3. 🔄 Push your code to trigger the CI/CD pipeline:"
echo "   git add ."
echo "   git commit -m 'Add CI/CD pipeline'"
echo "   git push origin main"
echo ""
echo "4. 🌐 Monitor your deployment:"
echo "   - GitHub Actions: https://github.com/$(gh repo view --json owner,name -q '.owner.login + \"/\" + .name')/actions"
echo "   - AWS Console: https://console.aws.amazon.com/eks/home?region=us-west-2"
echo ""
echo "5. 📱 Manual deployment (if needed):"
echo "   Go to Actions tab → Deploy to Production → Run workflow"
echo ""
echo "🎉 Setup complete! Your CI/CD pipeline is ready!"
