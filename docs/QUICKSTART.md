# 🚀 Quick Start Guide - GitHub Actions CI/CD

Follow these steps to set up automated CI/CD for your Food Delivery System.

## ⚡ Prerequisites (5 minutes)

1. **Install Required Tools:**
   ```bash
   # Install GitHub CLI
   # Windows: winget install GitHub.cli
   # Mac: brew install gh
   # Linux: https://github.com/cli/cli/blob/trunk/docs/install_linux.md
   
   # Install AWS CLI
   # https://aws.amazon.com/cli/
   ```

2. **Authenticate:**
   ```bash
   # Login to GitHub
   gh auth login
   
   # Configure AWS CLI
   aws configure
   ```

## 🏗️ Setup (2 minutes)

**Windows:**
```powershell
.\scripts\setup-github-actions.ps1
```

**Linux/Mac:**
```bash
chmod +x scripts/setup-github-actions.sh
./scripts/setup-github-actions.sh
```

## 🚀 Deploy (1 minute)

```bash
git add .
git commit -m "Add CI/CD pipeline"
git push origin main
```

## 🎉 That's it!

- ✅ Pipeline will automatically run on every push to `main`
- ✅ Docker images will be built and pushed to ECR
- ✅ Application will be deployed to EKS
- ✅ Access your app at the load balancer URL

## 📱 Monitor Progress

1. **GitHub Actions:** https://github.com/YOUR_USERNAME/food-delivery-system/actions
2. **AWS Console:** https://console.aws.amazon.com/eks/home?region=us-west-2

## 🔧 Manual Deployment

Need to deploy manually?
1. Go to Actions tab → "Deploy to Production"
2. Click "Run workflow"
3. Choose environment and image tag
4. Click "Run workflow"

---

**Need help?** Check the [full documentation](CI-CD-SETUP.md) or [troubleshooting guide](TROUBLESHOOTING.md).
