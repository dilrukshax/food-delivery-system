# AWS Tools Setup Script for Windows
# Run this script as Administrator

Write-Host "Setting up AWS deployment tools..." -ForegroundColor Green

# Install Chocolatey if not already installed
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
}

# Install AWS CLI
Write-Host "Installing AWS CLI..." -ForegroundColor Yellow
choco install awscli -y

# Install Terraform
Write-Host "Installing Terraform..." -ForegroundColor Yellow
choco install terraform -y

# Install kubectl
Write-Host "Installing kubectl..." -ForegroundColor Yellow
choco install kubernetes-cli -y

# Install eksctl
Write-Host "Installing eksctl..." -ForegroundColor Yellow
choco install eksctl -y

# Install Docker Desktop (if not already installed)
Write-Host "Installing Docker Desktop..." -ForegroundColor Yellow
choco install docker-desktop -y

Write-Host "Installation complete! Please restart your terminal." -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Configure AWS CLI: aws configure" -ForegroundColor White
Write-Host "2. Create AWS IAM user with appropriate permissions" -ForegroundColor White
Write-Host "3. Run terraform init in the terraform directory" -ForegroundColor White
