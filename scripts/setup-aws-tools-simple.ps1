# Simple AWS Tools Setup Script for Windows
# Run this script as Administrator

Write-Host "AWS Tools Setup Script" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green

# Function to check if running as admin
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Administrator)) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Install AWS CLI
Write-Host "Installing AWS CLI..." -ForegroundColor Yellow
try {
    if (Get-Command aws -ErrorAction SilentlyContinue) {
        Write-Host "AWS CLI already installed" -ForegroundColor Green
    } else {
        $awsUrl = "https://awscli.amazonaws.com/AWSCLIV2.msi"
        $awsInstaller = "$env:TEMP\AWSCLIV2.msi"
        
        Invoke-WebRequest -Uri $awsUrl -OutFile $awsInstaller
        Start-Process msiexec.exe -Wait -ArgumentList "/i $awsInstaller /quiet"
        Remove-Item $awsInstaller -Force
        
        # Refresh PATH
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
        
        Write-Host "AWS CLI installed successfully" -ForegroundColor Green
    }
} catch {
    Write-Host "Failed to install AWS CLI: $($_.Exception.Message)" -ForegroundColor Red
}

# Install Terraform
Write-Host "Installing Terraform..." -ForegroundColor Yellow
try {
    if (Get-Command terraform -ErrorAction SilentlyContinue) {
        Write-Host "Terraform already installed" -ForegroundColor Green
    } else {
        $terraformUrl = "https://releases.hashicorp.com/terraform/1.6.6/terraform_1.6.6_windows_amd64.zip"
        $terraformZip = "$env:TEMP\terraform.zip"
        $terraformDir = "C:\terraform"
        
        Invoke-WebRequest -Uri $terraformUrl -OutFile $terraformZip
        
        if (!(Test-Path $terraformDir)) {
            New-Item -ItemType Directory -Path $terraformDir -Force
        }
        
        Expand-Archive -Path $terraformZip -DestinationPath $terraformDir -Force
        
        # Add to system PATH
        $oldPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
        if ($oldPath -notlike "*$terraformDir*") {
            [Environment]::SetEnvironmentVariable("PATH", "$oldPath;$terraformDir", "Machine")
        }
        
        Remove-Item $terraformZip -Force
        Write-Host "Terraform installed successfully" -ForegroundColor Green
    }
} catch {
    Write-Host "Failed to install Terraform: $($_.Exception.Message)" -ForegroundColor Red
}

# Install kubectl
Write-Host "Installing kubectl..." -ForegroundColor Yellow
try {
    if (Get-Command kubectl -ErrorAction SilentlyContinue) {
        Write-Host "kubectl already installed" -ForegroundColor Green
    } else {
        $kubectlUrl = "https://dl.k8s.io/release/v1.28.0/bin/windows/amd64/kubectl.exe"
        $kubectlDir = "C:\kubectl"
        
        if (!(Test-Path $kubectlDir)) {
            New-Item -ItemType Directory -Path $kubectlDir -Force
        }
        
        Invoke-WebRequest -Uri $kubectlUrl -OutFile "$kubectlDir\kubectl.exe"
        
        # Add to system PATH
        $oldPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
        if ($oldPath -notlike "*$kubectlDir*") {
            [Environment]::SetEnvironmentVariable("PATH", "$oldPath;$kubectlDir", "Machine")
        }
        
        Write-Host "kubectl installed successfully" -ForegroundColor Green
    }
} catch {
    Write-Host "Failed to install kubectl: $($_.Exception.Message)" -ForegroundColor Red
}

# Install eksctl
Write-Host "Installing eksctl..." -ForegroundColor Yellow
try {
    if (Get-Command eksctl -ErrorAction SilentlyContinue) {
        Write-Host "eksctl already installed" -ForegroundColor Green
    } else {
        $eksctlUrl = "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_Windows_amd64.zip"
        $eksctlZip = "$env:TEMP\eksctl.zip"
        $eksctlDir = "C:\eksctl"
        
        Invoke-WebRequest -Uri $eksctlUrl -OutFile $eksctlZip
        
        if (!(Test-Path $eksctlDir)) {
            New-Item -ItemType Directory -Path $eksctlDir -Force
        }
        
        Expand-Archive -Path $eksctlZip -DestinationPath $eksctlDir -Force
        
        # Add to system PATH
        $oldPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
        if ($oldPath -notlike "*$eksctlDir*") {
            [Environment]::SetEnvironmentVariable("PATH", "$oldPath;$eksctlDir", "Machine")
        }
        
        Remove-Item $eksctlZip -Force
        Write-Host "eksctl installed successfully" -ForegroundColor Green
    }
} catch {
    Write-Host "Failed to install eksctl: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nInstallation completed!" -ForegroundColor Green
Write-Host "Please close this terminal and open a new one to refresh the PATH." -ForegroundColor Yellow
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Open a new PowerShell terminal" -ForegroundColor White
Write-Host "2. Run: aws configure" -ForegroundColor White
Write-Host "3. Run: .\scripts\deploy-to-aws.ps1" -ForegroundColor White

Read-Host "`nPress Enter to exit"
