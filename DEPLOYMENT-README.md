# Food Delivery System - Azure DevOps Deployment

This repository contains a complete microservices-based food delivery system deployed on Microsoft Azure using modern DevOps practices.

## 🏗️ Architecture

### Tech Stack
- **Backend**: Java 17 + Spring Boot (8 microservices)
- **Frontend**: Angular + Nginx
- **Database**: PostgreSQL (Azure Database for PostgreSQL)
- **Container Registry**: Azure Container Registry (ACR)
- **Orchestration**: Azure Kubernetes Service (AKS)
- **Infrastructure**: Terraform
- **CI/CD**: GitHub Actions
- **Monitoring**: Azure Monitor + Log Analytics

### Microservices
1. **API Gateway** (Port 8080) - Entry point for all client requests
2. **User Service** (Port 8081) - User management and authentication
3. **Restaurant Service** (Port 8082) - Restaurant and menu management
4. **Order Service** (Port 8083) - Order processing and management
5. **Payment Service** (Port 8084) - Payment processing
6. **Delivery Service** (Port 8085) - Delivery management and tracking
7. **Notification Service** (Port 8086) - Email/SMS notifications
8. **Service Registry** (Port 8761) - Eureka service discovery
9. **Frontend** (Port 80) - Angular web application

## 🚀 Quick Start

### Prerequisites
- Azure subscription with sufficient permissions
- GitHub account
- Azure CLI installed
- Terraform >= 1.6.0
- Docker (for local development)

### 1. Initial Setup

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd food-delivery-system
   ```

2. **Run the setup script**:
   ```bash
   # On Linux/macOS
   chmod +x scripts/setup-azure.sh
   ./scripts/setup-azure.sh
   
   # On Windows (PowerShell)
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   # Then run the equivalent commands manually
   ```

3. **Configure GitHub Secrets**:
   Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

   ```
   AZURE_CREDENTIALS          # Service Principal credentials (JSON)
   ACR_LOGIN_SERVER           # Container registry login server
   ACR_USERNAME               # Container registry username
   ACR_PASSWORD               # Container registry password
   POSTGRES_ADMIN_PASSWORD    # PostgreSQL admin password
   TERRAFORM_STATE_RG         # Terraform state resource group
   TERRAFORM_STATE_SA         # Terraform state storage account
   TERRAFORM_STATE_CONTAINER  # Terraform state container name
   ```

### 2. Configure Terraform Variables

1. **Copy the example variables**:
   ```bash
   cp terraform/terraform.tfvars.example terraform/terraform.tfvars
   ```

2. **Edit the variables**:
   ```hcl
   environment = "dev"           # or "staging", "prod"
   location    = "East US"       # your preferred Azure region
   node_count  = 3              # number of AKS nodes
   vm_size     = "Standard_D2s_v3"  # AKS node size
   
   tags = {
     Project     = "Food Delivery System"
     Environment = "dev"
     ManagedBy   = "Terraform"
     Owner       = "Your Team"
   }
   ```

### 3. Deploy to Azure

1. **Trigger the CI/CD pipeline**:
   ```bash
   git add .
   git commit -m "Initial deployment setup"
   git push origin main
   ```

2. **Monitor the deployment**:
   - Go to your GitHub repository → Actions
   - Watch the CI pipeline build and push images
   - Watch the CD pipeline deploy infrastructure and applications

3. **Get the application URLs**:
   ```bash
   # After deployment, get the external IPs
   kubectl get services -n food-delivery
   ```

## 🔄 CI/CD Pipelines

### CI Pipeline (`ci.yml`)
Triggers on: Push to main/develop, Pull Requests

**Stages**:
1. **Lint and Test**
   - Run backend tests for all services
   - Run frontend linting and tests
   - Cache Maven dependencies

2. **Build and Push**
   - Build Docker images for all services
   - Push to Azure Container Registry
   - Multi-architecture builds (linux/amd64)
   - Docker layer caching

3. **Security Scan**
   - Trivy vulnerability scanning
   - Upload results to GitHub Security tab

### CD Pipeline (`cd.yml`)
Triggers on: Successful CI completion, Manual workflow dispatch

**Stages**:
1. **Deploy Infrastructure**
   - Initialize Terraform backend
   - Plan and apply infrastructure changes
   - Output key values for application deployment

2. **Deploy Applications**
   - Update Kubernetes secrets with actual values
   - Deploy services in correct order (service registry → backends → frontend)
   - Perform rolling updates with health checks
   - Run smoke tests

3. **Notify Deployment Status**
   - Success/failure notifications

## 🏗️ Infrastructure

### Azure Resources Created
- **Resource Group**: Contains all resources
- **AKS Cluster**: Kubernetes cluster for application hosting
- **Azure Container Registry**: Private container registry
- **PostgreSQL Flexible Server**: Managed database with private networking
- **Virtual Network**: Network isolation with subnets
- **Log Analytics Workspace**: Centralized logging
- **Key Vault**: Secrets management
- **Private DNS Zone**: Private DNS for PostgreSQL

### Kubernetes Resources
- **Namespace**: `food-delivery` - Application isolation
- **ConfigMaps**: Environment-specific configuration
- **Secrets**: Sensitive data (database passwords, etc.)
- **Deployments**: Application deployments with health checks
- **Services**: Service discovery and load balancing
- **LoadBalancers**: External access for API Gateway and Frontend

## 🛠️ Local Development

### Using Docker Compose
```bash
# Start all services locally
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Service URLs (Local)
- Frontend: http://localhost:80
- API Gateway: http://localhost:8080
- User Service: http://localhost:8081
- Restaurant Service: http://localhost:8082
- Order Service: http://localhost:8083
- Payment Service: http://localhost:8084
- Delivery Service: http://localhost:8085
- Notification Service: http://localhost:8086
- Service Registry: http://localhost:8761

## 🔧 Configuration

### Environment Variables
Each service uses these environment patterns:

**Spring Boot Services**:
```env
SPRING_PROFILES_ACTIVE=kubernetes
SPRING_DATASOURCE_URL=jdbc:postgresql://<host>:5432/<database>
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=<password>
EUREKA_CLIENT_SERVICE_URL_DEFAULTZONE=http://service-registry:8761/eureka
```

**Frontend**:
```env
API_GATEWAY_URL=http://api-gateway:8080
```

### Database Configuration
Each microservice has its own database:
- `user_service_db`
- `restaurant_service_db`
- `order_service_db`
- `payment_service_db`
- `delivery_service_db`
- `notification_service_db`

## 📊 Monitoring and Logging

### Azure Monitor Integration
- **Container Insights**: AKS cluster monitoring
- **Log Analytics**: Centralized logging
- **Application Insights**: APM (configure in each service)

### Health Checks
All services expose health endpoints:
- Spring Boot: `/actuator/health`
- Frontend: `/health`

### Viewing Logs
```bash
# Kubernetes logs
kubectl logs -f deployment/<service-name> -n food-delivery

# All pods in namespace
kubectl logs -f --selector app=<service-name> -n food-delivery

# Azure CLI
az monitor log-analytics query \
  --workspace <workspace-id> \
  --analytics-query "ContainerLog | where ContainerName contains 'food-delivery'"
```

## 🔒 Security

### Security Features
- **Non-root containers**: All containers run as non-root users
- **Network policies**: Kubernetes network isolation
- **Private networking**: Database in private subnet
- **Key Vault integration**: Secure secrets management
- **Security scanning**: Trivy vulnerability scanning in CI
- **HTTPS ready**: LoadBalancer supports SSL termination

### Security Headers (Frontend)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Strict-Transport-Security
- Content-Security-Policy

## 🎯 Scaling

### Horizontal Pod Autoscaling
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
  namespace: food-delivery
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Cluster Scaling
```bash
# Scale AKS cluster
az aks scale --resource-group <rg-name> --name <aks-name> --node-count 5
```

## 🧪 Testing

### Running Tests Locally
```bash
# Backend tests
cd backend/<service-name>
./mvnw test

# Frontend tests
cd frontend
npm test

# Integration tests
npm run test:e2e
```

### Testing in Kubernetes
```bash
# Port forward for testing
kubectl port-forward service/api-gateway 8080:8080 -n food-delivery

# Run health checks
curl http://localhost:8080/actuator/health
```

## 🚨 Troubleshooting

### Common Issues

1. **Pod stuck in Pending state**:
   ```bash
   kubectl describe pod <pod-name> -n food-delivery
   # Check for resource constraints or node issues
   ```

2. **Database connection issues**:
   ```bash
   # Check PostgreSQL connectivity
   kubectl exec -it <pod-name> -n food-delivery -- nslookup <postgres-fqdn>
   ```

3. **Service discovery issues**:
   ```bash
   # Check Eureka registration
   kubectl port-forward service/service-registry 8761:8761 -n food-delivery
   # Visit http://localhost:8761
   ```

4. **Image pull errors**:
   ```bash
   # Check ACR permissions
   az aks check-acr --resource-group <rg-name> --name <aks-name> --acr <acr-name>
   ```

### Debugging Commands
```bash
# Check all resources
kubectl get all -n food-delivery

# Check events
kubectl get events -n food-delivery --sort-by=.metadata.creationTimestamp

# Check logs
kubectl logs -f deployment/<service-name> -n food-delivery

# Check resource usage
kubectl top pods -n food-delivery
kubectl top nodes
```

## 🧹 Cleanup

### Delete Azure Resources
```bash
# Use the cleanup script
./scripts/cleanup-azure.ps1 -Environment "dev" -ProjectName "food-delivery" -Force

# Or manually delete resource groups
az group delete --name <resource-group-name> --yes --no-wait
```

### Reset Local Environment
```bash
# Stop and remove all containers
docker-compose down -v
docker system prune -f
```

## 📞 Support

### Getting Help
1. Check the troubleshooting section above
2. Review GitHub Actions logs for CI/CD issues
3. Check Azure portal for infrastructure issues
4. Review Kubernetes events and logs

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make changes and add tests
4. Submit a pull request

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

---

**Note**: Replace placeholder values (like `<your-repo-url>`) with actual values specific to your setup.
