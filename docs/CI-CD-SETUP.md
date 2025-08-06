# Food Delivery System - CI/CD Pipeline Documentation

This repository includes a complete CI/CD pipeline using GitHub Actions for building, testing, and deploying the Food Delivery System to AWS EKS.

## 🚀 Pipeline Overview

The CI/CD pipeline consists of the following jobs:

1. **Backend Testing** - Tests all Spring Boot microservices
2. **Frontend Testing** - Tests the Angular application
3. **Build & Push** - Builds Docker images and pushes to AWS ECR
4. **Deploy** - Deploys to AWS EKS cluster

## 📋 Prerequisites

Before setting up the CI/CD pipeline, ensure you have:

### Required Tools
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate permissions
- [GitHub CLI](https://cli.github.com/) installed and authenticated
- [Docker](https://www.docker.com/) (for local testing only)
- [kubectl](https://kubernetes.io/docs/tasks/tools/) configured for your EKS cluster

### AWS Resources
- EKS Cluster (`food-delivery-cluster`)
- ECR repositories for each service
- IAM user with appropriate permissions

### Required AWS Permissions
Your AWS user/role needs the following permissions:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecr:*",
                "eks:DescribeCluster",
                "eks:ListClusters",
                "sts:GetCallerIdentity"
            ],
            "Resource": "*"
        }
    ]
}
```

## 🔧 Setup Instructions

### Step 1: Run Setup Script

**For Windows (PowerShell):**
```powershell
.\scripts\setup-github-actions.ps1
```

**For Linux/Mac (Bash):**
```bash
chmod +x scripts/setup-github-actions.sh
./scripts/setup-github-actions.sh
```

This script will:
- Validate your AWS and GitHub CLI setup
- Create GitHub repository secrets
- Create ECR repositories for all services

### Step 2: Manual Setup (Alternative)

If you prefer manual setup:

#### 2.1 Create GitHub Secrets

Go to your repository → Settings → Secrets and variables → Actions, and add:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `AWS_ACCOUNT_ID` | Your AWS Account ID | `123456789012` |
| `AWS_ACCESS_KEY_ID` | AWS Access Key | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |

#### 2.2 Create ECR Repositories

```bash
# Create repositories for all services
aws ecr create-repository --repository-name api-gateway --region us-west-2
aws ecr create-repository --repository-name user-service --region us-west-2
aws ecr create-repository --repository-name restaurant-service --region us-west-2
aws ecr create-repository --repository-name order-service --region us-west-2
aws ecr create-repository --repository-name payment-service --region us-west-2
aws ecr create-repository --repository-name delivery-service --region us-west-2
aws ecr create-repository --repository-name notification-service --region us-west-2
aws ecr create-repository --repository-name frontend --region us-west-2
```

## 🔄 Pipeline Workflows

### 1. Main CI/CD Pipeline (`.github/workflows/ci-cd.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main`

**Jobs:**
- **test-backend**: Tests all Spring Boot services in parallel
- **test-frontend**: Tests Angular application
- **build-and-push**: Builds and pushes Docker images to ECR (main branch only)
- **deploy**: Deploys to EKS cluster (main branch only)

### 2. Manual Deployment (`.github/workflows/deploy.yml`)

**Triggers:**
- Manual trigger via GitHub Actions UI

**Features:**
- Choose environment (production/staging)
- Specify image tag to deploy
- Deploy specific versions

## 🏗️ How to Deploy

### Automatic Deployment
1. Make changes to your code
2. Commit and push to `main` branch:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```
3. Pipeline automatically runs and deploys

### Manual Deployment
1. Go to GitHub repository → Actions tab
2. Select "Deploy to Production" workflow
3. Click "Run workflow"
4. Choose environment and image tag
5. Click "Run workflow"

## 📁 Project Structure

```
.github/
└── workflows/
    ├── ci-cd.yml          # Main CI/CD pipeline
    └── deploy.yml         # Manual deployment workflow

scripts/
├── setup-github-actions.sh   # Setup script (Bash)
└── setup-github-actions.ps1  # Setup script (PowerShell)

backend/
├── api-gateway/           # API Gateway service
├── user-service/          # User management service
├── restaurant-service/    # Restaurant management service
├── order-service/         # Order processing service
├── payment-service/       # Payment processing service
├── delivery-service/      # Delivery management service
└── notification-service/  # Notification service

frontend/                  # Angular frontend application

kubernetes/               # Kubernetes manifests
├── namespace.yaml
├── configmap.yaml
├── secrets.yaml
├── ingress.yaml
├── api-gateway/
├── user-service/
└── frontend/
```

## 🐳 Docker Images

Each service has its own Dockerfile and builds independently:

- **Backend Services**: Multi-stage builds using Eclipse Temurin JDK 17
- **Frontend**: Multi-stage build with Node.js 20 and Nginx

Images are tagged with:
- `latest` - Latest version from main branch
- `<commit-sha>` - Specific commit version

## 🔍 Monitoring & Debugging

### Check Pipeline Status
```bash
# View recent workflow runs
gh run list

# View specific run details
gh run view <run-id>

# View logs
gh run view <run-id> --log
```

### Check Deployment Status
```bash
# Update kubeconfig
aws eks update-kubeconfig --name food-delivery-cluster --region us-west-2

# Check pods
kubectl get pods -n food-delivery

# Check services
kubectl get services -n food-delivery

# Check ingress
kubectl get ingress -n food-delivery

# View pod logs
kubectl logs -f deployment/api-gateway -n food-delivery
```

### Common Issues

#### 1. ECR Authentication Failed
```bash
# Re-authenticate Docker with ECR
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-west-2.amazonaws.com
```

#### 2. kubectl Access Denied
```bash
# Update kubeconfig
aws eks update-kubeconfig --name food-delivery-cluster --region us-west-2

# Check cluster access
kubectl auth can-i get pods --namespace food-delivery
```

#### 3. Image Pull Errors
- Verify ECR repositories exist
- Check IAM permissions for ECR access
- Ensure ECR secret is created in Kubernetes

## 🌐 Accessing Your Application

After successful deployment:

1. Get the load balancer URL:
   ```bash
   kubectl get ingress food-delivery-ingress -n food-delivery
   ```

2. Access your application:
   - **Frontend**: `http://<load-balancer-url>`
   - **API**: `http://<load-balancer-url>/api`

## 🔒 Security Best Practices

- AWS credentials are stored as GitHub secrets
- ECR images are scanned for vulnerabilities
- Kubernetes secrets are used for ECR authentication
- RBAC is configured for cluster access

## 📊 Pipeline Metrics

The pipeline provides the following information:
- Build times for each service
- Test results and coverage
- Image sizes and vulnerabilities
- Deployment status and health checks

## 🆘 Support

If you encounter issues:

1. Check the [GitHub Actions logs](../../actions)
2. Verify AWS resources in the [AWS Console](https://console.aws.amazon.com/eks/home?region=us-west-2)
3. Check Kubernetes cluster status
4. Review the troubleshooting section above

## 🚀 Next Steps

After setting up CI/CD:

1. **Add more services** - Follow the same pattern for additional microservices
2. **Environment branches** - Create staging/production environments
3. **Advanced monitoring** - Add Prometheus, Grafana, or CloudWatch
4. **Security scanning** - Integrate additional security tools
5. **Performance testing** - Add load testing to the pipeline

---

**Happy deploying! 🎉**
