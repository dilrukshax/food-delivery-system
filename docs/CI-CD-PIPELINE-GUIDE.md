# CI/CD Pipeline Documentation

## Overview

The Food Delivery System now uses **separate, optimized CI/CD pipelines** for frontend and backend deployments. This approach provides:

- **🎯 Selective Deployment**: Only deploy what has changed
- **⚡ Faster Builds**: Parallel execution of frontend and backend pipelines  
- **🔧 Better Isolation**: Independent testing and deployment cycles
- **📊 Enhanced Monitoring**: Clear separation of deployment status

## Pipeline Structure

### 1. Backend CI/CD Pipeline (`backend-ci-cd.yml`)

**Triggers:**
- Changes in `backend/**` directories
- Changes in `kubernetes/**` (except frontend)
- Changes in `docker-compose.yml`
- Manual dispatch with force deploy option

**Jobs:**
1. **Detect Changes** - Analyzes which backend services have changes
2. **Test Backend** - Runs tests for changed services only (matrix strategy)
3. **Build and Push** - Builds Docker images for changed services
4. **Deploy Backend** - Deploys only the changed services to EKS

**Smart Features:**
- Only builds and deploys services that have actual changes
- Matrix strategy for parallel testing of multiple services
- Conditional deployment based on file changes
- Automatic ECR repository creation

### 2. Frontend CI/CD Pipeline (`frontend-ci-cd.yml`)

**Triggers:**
- Changes in `frontend/**` directory
- Changes in `kubernetes/frontend/**`
- Changes in `kubernetes/ingress.yaml`
- Manual dispatch with force deploy option

**Jobs:**
1. **Detect Changes** - Checks for frontend-specific changes
2. **Test Frontend** - Runs tests, linting, and builds the frontend
3. **Build and Push** - Creates and pushes frontend Docker image
4. **Deploy Frontend** - Deploys frontend to EKS with ingress updates

**Frontend Testing Improvements:**
- ✅ **Fixed CI Testing**: Proper headless Chrome configuration
- ✅ **Code Coverage**: Generates test coverage reports
- ✅ **Artifact Management**: Uploads build and coverage artifacts
- ✅ **Production Builds**: Optimized builds for deployment

### 3. Orchestrator Pipeline (`orchestrator.yml`)

**Purpose:** Provides a unified entry point for deployments

**Triggers:**
- Any push to main/develop branches
- Pull requests to main
- Manual dispatch with granular deployment options

**Features:**
- Analyzes all changes and triggers appropriate pipelines
- Supports force deployment options
- Provides unified deployment summary

## Fixed Issues

### ✅ Frontend Testing
- **Before**: Tests were skipped with a placeholder message
- **After**: Proper headless Chrome testing with coverage reports
- **Configuration**: Added `karma.conf.js` with CI-specific settings
- **Commands**: New `test:ci` and `test:headless` npm scripts

### ✅ Conditional Deployment
- **Before**: Always deployed everything regardless of changes
- **After**: Only deploys components that have actual changes
- **Backend**: Detects changes per service and builds only what's needed
- **Frontend**: Skips deployment if no frontend changes detected

### ✅ Pipeline Separation
- **Before**: Single monolithic pipeline that was slow and hard to debug
- **After**: Separate pipelines that can run in parallel and independently
- **Benefits**: Faster feedback, easier troubleshooting, better resource utilization

## Usage

### Automatic Deployment
1. **Push changes** to `main` or `develop` branch
2. **Pipeline detects** which components changed
3. **Only changed components** are built and deployed
4. **Monitor progress** in GitHub Actions tab

### Manual Deployment
Use workflow dispatch for manual control:

```yaml
# Backend only
- deploy_backend: true

# Frontend only  
- deploy_frontend: true

# Everything
- deploy_all: true
```

### Monitoring Deployments

#### Backend Deployment Status
```bash
# Check backend pods
kubectl get pods -l app=api-gateway -n food-delivery
kubectl get pods -l app=user-service -n food-delivery

# Check backend services
kubectl get services -n food-delivery

# View logs
kubectl logs -l app=api-gateway -n food-delivery --tail=50
```

#### Frontend Deployment Status
```bash
# Check frontend pod
kubectl get pods -l app=frontend -n food-delivery

# Check frontend service
kubectl get service frontend -n food-delivery

# View frontend logs
kubectl logs -l app=frontend -n food-delivery --tail=50
```

#### Application URL
```bash
# Get application URL
kubectl get ingress -n food-delivery
```

## File Structure

```
.github/workflows/
├── backend-ci-cd.yml      # Backend pipeline
├── frontend-ci-cd.yml     # Frontend pipeline  
├── orchestrator.yml       # Unified orchestrator
├── deploy.yml            # Manual deployment workflow
└── ci-cd-legacy.yml      # Old pipeline (reference)
```

## Environment Variables

### Required Secrets
- `AWS_ACCESS_KEY_ID` - AWS access key for ECR and EKS
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_ACCOUNT_ID` - AWS account ID for ECR registry

### Default Values
- `AWS_REGION`: us-west-2
- `EKS_CLUSTER_NAME`: food-delivery-cluster
- `ECR_REGISTRY`: {AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com

## Best Practices

### Development Workflow
1. **Make focused changes** - Change only frontend OR backend when possible
2. **Test locally first** - Run tests before pushing
3. **Monitor deployments** - Check pipeline status and application health
4. **Use feature branches** - Create PRs for review before merging to main

### Troubleshooting
1. **Check pipeline logs** in GitHub Actions
2. **Verify Kubernetes status** with kubectl commands
3. **Check application logs** in the pods
4. **Validate ingress configuration** for frontend access

### Performance Tips
- **Small, focused commits** trigger faster deployments
- **Frontend and backend changes in separate commits** for optimal pipeline utilization
- **Use manual dispatch** for emergency deployments
- **Monitor resource usage** in AWS to optimize costs

## Migration from Legacy Pipeline

The old pipeline (`ci-cd-legacy.yml`) has been preserved for reference. Key differences:

| Aspect | Legacy | New Approach |
|--------|--------|--------------|
| **Deployment** | Always deploy everything | Deploy only what changed |
| **Testing** | Frontend tests skipped | Proper CI testing with coverage |
| **Speed** | Slow, sequential | Fast, parallel execution |
| **Debugging** | Single large pipeline | Separate, focused pipelines |
| **Flexibility** | Manual only | Automatic + manual options |

## Monitoring and Alerts

### Pipeline Success/Failure
- GitHub Actions provides email notifications
- Check the Actions tab for detailed logs
- Pipeline summaries show deployment status

### Application Health
- Monitor pod status: `kubectl get pods -n food-delivery`
- Check application logs: `kubectl logs -l app=<service> -n food-delivery`
- Verify ingress: `kubectl get ingress -n food-delivery`

## Future Enhancements

- **Integration tests** between frontend and backend
- **Automated rollback** on deployment failures
- **Blue-green deployments** for zero-downtime updates
- **Performance monitoring** and alerts
- **Security scanning** in CI pipeline
