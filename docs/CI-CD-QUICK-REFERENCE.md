# 🚀 CI/CD Quick Reference

## Pipeline Overview
- **Backend Pipeline**: Deploys only changed backend services
- **Frontend Pipeline**: Deploys frontend when UI changes are made
- **Orchestrator**: Provides unified deployment analysis

## Deployment Triggers

### Automatic Deployment 🔄
| Change Type | Backend Pipeline | Frontend Pipeline |
|-------------|------------------|-------------------|
| `backend/**` | ✅ Triggered | ⏭️ Skipped |
| `frontend/**` | ⏭️ Skipped | ✅ Triggered |
| `kubernetes/frontend/**` | ⏭️ Skipped | ✅ Triggered |
| `kubernetes/**` (other) | ✅ Triggered | ⏭️ Skipped |
| Both frontend & backend | ✅ Both Triggered | ✅ Both Triggered |

### Manual Deployment 🎮
Access via GitHub Actions → Choose workflow → "Run workflow"

**Backend Pipeline:**
- ☑️ `force_deploy: true` - Deploy all backend services

**Frontend Pipeline:**  
- ☑️ `force_deploy: true` - Deploy frontend

**Orchestrator:**
- ☑️ `deploy_backend: true` - Force backend deployment
- ☑️ `deploy_frontend: true` - Force frontend deployment  
- ☑️ `deploy_all: true` - Force everything

## Quick Commands 

### Check Deployment Status
```bash
# All pods
kubectl get pods -n food-delivery

# Specific service
kubectl get pods -l app=api-gateway -n food-delivery
kubectl get pods -l app=frontend -n food-delivery

# Services and ingress
kubectl get services,ingress -n food-delivery
```

### View Logs
```bash
# Backend service logs
kubectl logs -l app=api-gateway -n food-delivery --tail=50

# Frontend logs  
kubectl logs -l app=frontend -n food-delivery --tail=50

# All deployment logs
kubectl logs -l "app in (api-gateway,user-service,frontend)" -n food-delivery --tail=20
```

### Get Application URL
```bash
kubectl get ingress food-delivery-ingress -n food-delivery
```

## Testing

### Frontend Testing ✅ FIXED
- **Local**: `npm test` (interactive)
- **CI**: `npm run test:ci` (headless with coverage)
- **Headless**: `npm run test:headless`

### Backend Testing
- **Individual Service**: `cd backend/service-name && ./mvnw test`
- **All Services**: Run via CI pipeline

## Troubleshooting

### Pipeline Failures
1. **Check GitHub Actions** tab for detailed logs
2. **Look for red X** marks in pipeline steps
3. **Check artifact uploads** for test results

### Deployment Issues
1. **Pod not starting**:
   ```bash
   kubectl describe pod <pod-name> -n food-delivery
   ```

2. **Service not accessible**:
   ```bash
   kubectl get endpoints -n food-delivery
   ```

3. **Image pull errors**:
   ```bash
   kubectl get events -n food-delivery --sort-by='.lastTimestamp'
   ```

## Development Workflow

### Best Practices ✨
1. **Focused commits** - Change only frontend OR backend when possible
2. **Test locally** before pushing
3. **Use feature branches** for PRs
4. **Monitor pipelines** after pushing

### Example Workflows

**Frontend-only change:**
```bash
git checkout -b fix/frontend-bug
# Make changes in frontend/
git add frontend/
git commit -m "fix: resolve navigation issue"
git push origin fix/frontend-bug
# Only frontend pipeline runs ⚡
```

**Backend-only change:**
```bash
git checkout -b feature/user-service
# Make changes in backend/user-service/
git add backend/user-service/
git commit -m "feat: add user profile endpoint"
git push origin feature/user-service  
# Only backend pipeline runs ⚡
```

**Emergency deployment:**
```bash
# Use manual trigger with force_deploy options
# GitHub Actions → Run workflow → Check appropriate boxes
```

## Pipeline Performance

### Timing Expectations ⏱️
- **Backend (single service)**: ~8-12 minutes
- **Backend (multiple services)**: ~15-25 minutes  
- **Frontend**: ~6-10 minutes
- **Both pipelines**: Run in parallel 🔥

### Optimization Tips
- Smaller, focused commits = faster builds
- Pre-test locally to avoid pipeline failures
- Use manual deployment for urgent fixes
- Monitor AWS costs with frequent deployments

---

💡 **Pro Tip**: Check the GitHub Actions summary for deployment URLs and status!

📖 **Full Documentation**: [CI-CD-PIPELINE-GUIDE.md](CI-CD-PIPELINE-GUIDE.md)
