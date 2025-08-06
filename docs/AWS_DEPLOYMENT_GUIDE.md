# AWS Deployment Guide for Food Delivery System

This guide will help you deploy your Spring Boot microservices application with Angular frontend to AWS using a complete DevOps pipeline.

## 📋 Prerequisites

### Required Tools
1. **AWS CLI** - For interacting with AWS services
2. **Terraform** - For infrastructure provisioning
3. **kubectl** - For Kubernetes management
4. **eksctl** - For EKS cluster management
5. **Docker** - For containerization

### AWS Requirements
1. AWS Account with billing set up
2. IAM user with appropriate permissions
3. Domain name (optional, for custom domain)

## 🚀 Quick Start

### Step 1: Install Required Tools

**For Windows (PowerShell as Administrator):**
```powershell
# Run the setup script
.\scripts\setup-aws-tools.ps1
```

**Manual Installation:**
- AWS CLI: https://aws.amazon.com/cli/
- Terraform: https://terraform.io/downloads
- kubectl: https://kubernetes.io/docs/tasks/tools/install-kubectl/
- eksctl: https://eksctl.io/installation/
- Docker Desktop: https://docs.docker.com/desktop/

### Step 2: Configure AWS

1. **Create IAM User:**
   ```bash
   # Go to AWS Console > IAM > Users > Create User   aws --version
   # Attach the policy from aws/iam-policy.json
   ```

2. **Configure AWS CLI:**
   ```bash
   aws configure
   # Enter your Access Key ID
   # Enter your Secret Access Key
   # Enter your region (e.g., us-west-2)
   # Enter output format (json)
   ```

3. **Verify AWS Configuration:**
   ```bash
   aws sts get-caller-identity
   ```

### Step 3: Configure Terraform Variables

1. **Edit terraform/terraform.tfvars:**
   ```hcl
   aws_region = "us-west-2"
   cluster_name = "food-delivery-cluster"
   environment = "dev"
   db_password = "YourSecurePassword123!"
   ```

2. **Review other variables in terraform/variables.tf** and adjust as needed.

### Step 4: Deploy Infrastructure

**Option 1: Automated Deployment (Recommended)**
```powershell
# For Windows
.\scripts\deploy-to-aws.ps1

# For Linux/Mac
chmod +x scripts/deploy-to-aws.sh
./scripts/deploy-to-aws.sh
```

**Option 2: Manual Step-by-Step Deployment**

1. **Create Terraform Backend:**
   ```bash
   # Create S3 bucket for Terraform state
   aws s3 mb s3://your-terraform-state-bucket --region us-west-2
   ```

2. **Deploy Infrastructure:**
   ```bash
   cd terraform
   terraform init
   terraform plan -var-file="terraform.tfvars"
   terraform apply -var-file="terraform.tfvars"
   cd ..
   ```

3. **Update kubeconfig:**
   ```bash
   aws eks update-kubeconfig --region us-west-2 --name food-delivery-cluster
   ```

4. **Install AWS Load Balancer Controller:**
   ```bash
   # See scripts/deploy-to-aws.sh for detailed commands
   ```

### Step 5: Build and Deploy Application

1. **Build and Push Docker Images:**
   ```bash
   # Get ECR login
   aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-west-2.amazonaws.com

   # Build and push each service
   docker build -t <account-id>.dkr.ecr.us-west-2.amazonaws.com/food-delivery/api-gateway:latest backend/api-gateway/
   docker push <account-id>.dkr.ecr.us-west-2.amazonaws.com/food-delivery/api-gateway:latest
   # Repeat for other services...
   ```

2. **Deploy to Kubernetes:**
   ```bash
   # Update image URLs in manifests first
   # Then apply manifests
   kubectl apply -f kubernetes/aws/namespace.yaml
   kubectl apply -f kubernetes/aws/configmap.yaml
   kubectl apply -f kubernetes/aws/secrets.yaml
   kubectl apply -f kubernetes/aws/api-gateway/
   ```

## 🔧 Configuration Details

### Database Configuration
- **Type:** Amazon RDS PostgreSQL
- **Version:** 15.4
- **Instance:** db.t3.micro (adjustable)
- **Storage:** 20GB GP2 (expandable)

### Kubernetes Cluster
- **Type:** Amazon EKS
- **Version:** 1.28
- **Node Group:** t3.medium instances
- **Auto Scaling:** 1-10 nodes

### Container Registry
- **Type:** Amazon ECR
- **Repositories:** Created for each microservice
- **Image Scanning:** Enabled

### Load Balancing
- **Type:** Application Load Balancer (ALB)
- **SSL/TLS:** AWS Certificate Manager
- **Ingress Controller:** AWS Load Balancer Controller

## 🔄 CI/CD Pipeline

### GitHub Actions Setup

1. **Add GitHub Secrets:**
   ```
   AWS_ACCESS_KEY_ID: Your AWS access key
   AWS_SECRET_ACCESS_KEY: Your AWS secret key
   ```

2. **Pipeline Triggers:**
   - Push to `main` branch: Full deployment
   - Push to `develop` branch: Build and test only
   - Pull requests: Test only

3. **Pipeline Stages:**
   - Test (Backend & Frontend)
   - Build and Push Images
   - Deploy to EKS

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Users/Web     │    │  Load Balancer  │    │   EKS Cluster   │
│                 │◄──►│      (ALB)      │◄──►│                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                       ┌─────────────────┐             │
                       │  Amazon ECR     │◄────────────┤
                       │ (Container      │             │
                       │  Registry)      │             │
                       └─────────────────┘             │
                                                        │
                       ┌─────────────────┐             │
                       │  Amazon RDS     │◄────────────┘
                       │ (PostgreSQL)    │
                       └─────────────────┘
```

## 🌐 Service Architecture

```
Frontend (Angular) ──► API Gateway ──► Microservices
                                        ├─ User Service
                                        ├─ Restaurant Service
                                        ├─ Order Service
                                        ├─ Payment Service
                                        ├─ Delivery Service
                                        └─ Notification Service
```

## 📊 Monitoring and Logging

### Built-in Monitoring
- **CloudWatch:** AWS native monitoring
- **Container Insights:** EKS cluster monitoring
- **ALB Access Logs:** Request logging

### Application Health Checks
- **Spring Boot Actuator:** `/actuator/health`
- **Kubernetes Probes:** Liveness and readiness
- **Auto-scaling:** Based on CPU/Memory usage

## 🔐 Security

### Network Security
- **VPC:** Private subnets for applications
- **Security Groups:** Restrictive rules
- **NAT Gateway:** Outbound internet access

### Application Security
- **ECR Image Scanning:** Vulnerability detection
- **IAM Roles:** Least privilege access
- **Secrets Management:** Kubernetes secrets

### Database Security
- **RDS Encryption:** At rest and in transit
- **VPC Security Groups:** Database access control
- **Backup:** Automated daily backups

## 💰 Cost Optimization

### Resource Sizing
- **EKS Nodes:** t3.medium (adjustable)
- **RDS Instance:** db.t3.micro (adjustable)
- **Auto Scaling:** Min 1, Max 10 nodes

### Cost Monitoring
- **AWS Budgets:** Set spending alerts
- **Cost Explorer:** Track resource usage
- **Reserved Instances:** For production workloads

## 🛠️ Troubleshooting

### Common Issues

1. **Terraform Backend Error:**
   ```bash
   # Create S3 bucket manually
   aws s3 mb s3://your-unique-bucket-name
   ```

2. **EKS Access Denied:**
   ```bash
   # Update kubeconfig
   aws eks update-kubeconfig --region us-west-2 --name food-delivery-cluster
   ```

3. **Image Pull Errors:**
   ```bash
   # Recreate ECR secret
   kubectl delete secret ecr-secret -n food-delivery
   # Run the ECR secret creation command again
   ```

4. **Load Balancer Not Created:**
   ```bash
   # Check AWS Load Balancer Controller
   kubectl get pods -n kube-system | grep aws-load-balancer-controller
   ```

### Debugging Commands

```bash
# Check cluster status
kubectl get nodes

# Check pod status
kubectl get pods -n food-delivery

# Check service logs
kubectl logs -f deployment/api-gateway -n food-delivery

# Check ingress status
kubectl describe ingress food-delivery-ingress -n food-delivery

# Check terraform state
terraform show
```

## 🔄 Updates and Maintenance

### Application Updates
1. Push changes to GitHub
2. GitHub Actions will automatically build and deploy
3. Monitor deployment status in Kubernetes

### Infrastructure Updates
1. Modify Terraform files
2. Run `terraform plan` to review changes
3. Run `terraform apply` to apply changes

### Scaling
```bash
# Scale deployment
kubectl scale deployment api-gateway --replicas=3 -n food-delivery

# Scale cluster nodes (via Terraform)
# Update desired_size in terraform/variables.tf
terraform apply -var-file="terraform.tfvars"
```

## 📞 Support

### AWS Resources
- [AWS Documentation](https://docs.aws.amazon.com/)
- [EKS User Guide](https://docs.aws.amazon.com/eks/)
- [AWS Support](https://aws.amazon.com/support/)

### Community
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Terraform Documentation](https://terraform.io/docs/)
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)

---

## 🎯 Next Steps

1. **Custom Domain:** Set up Route 53 and ACM certificate
2. **Monitoring:** Add Prometheus and Grafana
3. **CI/CD Enhancements:** Add environment-specific deployments
4. **Security:** Implement service mesh (Istio)
5. **Backup Strategy:** Set up automated database and application backups
