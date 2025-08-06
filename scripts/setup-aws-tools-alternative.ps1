# Alternative AWS Tools Setup Script for Windows
# This script uses direct downloads and winget instead of Chocolatey

param(
    [switch]$SkipDocker = $false
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors for output
function Write-Status {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Test-AdminRights {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Install-AwsCli {
    Write-Status "Installing AWS CLI..."
    
    try {
        # Check if already installed
        if (Get-Command aws -ErrorAction SilentlyContinue) {
            Write-Status "AWS CLI is already installed"
            return
        }

        # Download and install AWS CLI
        $awsUrl = "https://awscli.amazonaws.com/AWSCLIV2.msi"
        $awsInstaller = "$env:TEMP\AWSCLIV2.msi"
        
        Write-Status "Downloading AWS CLI..."
        Invoke-WebRequest -Uri $awsUrl -OutFile $awsInstaller
        
        Write-Status "Installing AWS CLI..."
        Start-Process msiexec.exe -Wait -ArgumentList "/i $awsInstaller /quiet"
        
        # Add to PATH for current session
        $env:PATH += ";C:\Program Files\Amazon\AWSCLIV2\"
        
        Remove-Item $awsInstaller -Force
        Write-Status "AWS CLI installed successfully"
    }
    catch {
        Write-Error "Failed to install AWS CLI: $($_.Exception.Message)"
    }
}

function Install-Terraform {
    Write-Status "Installing Terraform..."
    
    try {
        # Check if already installed
        if (Get-Command terraform -ErrorAction SilentlyContinue) {
            Write-Status "Terraform is already installed"
            return
        }

        # Download Terraform
        $terraformUrl = "https://releases.hashicorp.com/terraform/1.6.6/terraform_1.6.6_windows_amd64.zip"
        $terraformZip = "$env:TEMP\terraform.zip"
        $terraformDir = "C:\terraform"
        
        Write-Status "Downloading Terraform..."
        Invoke-WebRequest -Uri $terraformUrl -OutFile $terraformZip
        
        # Create directory and extract
        if (!(Test-Path $terraformDir)) {
            New-Item -ItemType Directory -Path $terraformDir -Force
        }
        
        Expand-Archive -Path $terraformZip -DestinationPath $terraformDir -Force
        
        # Add to PATH
        $currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
        if ($currentPath -notlike "*$terraformDir*") {
            [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$terraformDir", "Machine")
        }
        $env:PATH += ";$terraformDir"
        
        Remove-Item $terraformZip -Force
        Write-Status "Terraform installed successfully"
    }
    catch {
        Write-Error "Failed to install Terraform: $($_.Exception.Message)"
    }
}

function Install-Kubectl {
    Write-Status "Installing kubectl..."
    
    try {
        # Check if already installed
        if (Get-Command kubectl -ErrorAction SilentlyContinue) {
            Write-Status "kubectl is already installed"
            return
        }

        # Download kubectl
        $kubectlUrl = "https://dl.k8s.io/release/v1.28.0/bin/windows/amd64/kubectl.exe"
        $kubectlDir = "C:\kubectl"
        $kubectlPath = "$kubectlDir\kubectl.exe"
        
        Write-Status "Downloading kubectl..."
        if (!(Test-Path $kubectlDir)) {
            New-Item -ItemType Directory -Path $kubectlDir -Force
        }
        
        Invoke-WebRequest -Uri $kubectlUrl -OutFile $kubectlPath
        
        # Add to PATH
        $currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
        if ($currentPath -notlike "*$kubectlDir*") {
            [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$kubectlDir", "Machine")
        }
        $env:PATH += ";$kubectlDir"
        
        Write-Status "kubectl installed successfully"
    }
    catch {
        Write-Error "Failed to install kubectl: $($_.Exception.Message)"
    }
}

function Install-Eksctl {
    Write-Status "Installing eksctl..."
    
    try {
        # Check if already installed
        if (Get-Command eksctl -ErrorAction SilentlyContinue) {
            Write-Status "eksctl is already installed"
            return
        }

        # Download eksctl
        $eksctlUrl = "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_Windows_amd64.zip"
        $eksctlZip = "$env:TEMP\eksctl.zip"
        $eksctlDir = "C:\eksctl"
        
        Write-Status "Downloading eksctl..."
        Invoke-WebRequest -Uri $eksctlUrl -OutFile $eksctlZip
        
        # Create directory and extract
        if (!(Test-Path $eksctlDir)) {
            New-Item -ItemType Directory -Path $eksctlDir -Force
        }
        
        Expand-Archive -Path $eksctlZip -DestinationPath $eksctlDir -Force
        
        # Add to PATH
        $currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
        if ($currentPath -notlike "*$eksctlDir*") {
            [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$eksctlDir", "Machine")
        }
        $env:PATH += ";$eksctlDir"
        
        Remove-Item $eksctlZip -Force
        Write-Status "eksctl installed successfully"
    }
    catch {
        Write-Error "Failed to install eksctl: $($_.Exception.Message)"
    }
}

function Install-DockerDesktop {
    if ($SkipDocker) {
        Write-Status "Skipping Docker Desktop installation"
        return
    }

    Write-Status "Installing Docker Desktop..."
    
    try {
        # Check if already installed
        if (Get-Command docker -ErrorAction SilentlyContinue) {
            Write-Status "Docker is already installed"
            return
        }

        # Download Docker Desktop
        $dockerUrl = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
        $dockerInstaller = "$env:TEMP\DockerDesktopInstaller.exe"
        
        Write-Status "Downloading Docker Desktop..."
        Invoke-WebRequest -Uri $dockerUrl -OutFile $dockerInstaller
        
        Write-Status "Installing Docker Desktop..."
        Start-Process $dockerInstaller -Wait -ArgumentList "install --quiet"
        
        Remove-Item $dockerInstaller -Force
        Write-Status "Docker Desktop installed successfully"
        Write-Warning "Please restart your computer after Docker installation completes"
    }
    catch {
        Write-Error "Failed to install Docker Desktop: $($_.Exception.Message)"
        Write-Status "You can install Docker Desktop manually from: https://docs.docker.com/desktop/install/windows-install/"
    }
}

function Install-Git {
    Write-Status "Checking Git installation..."
    
    try {
        # Check if already installed
        if (Get-Command git -ErrorAction SilentlyContinue) {
            Write-Status "Git is already installed"
            return
        }

        Write-Status "Installing Git..."
        # Download Git
        $gitUrl = "https://github.com/git-for-windows/git/releases/download/v2.42.0.windows.2/Git-2.42.0.2-64-bit.exe"
        $gitInstaller = "$env:TEMP\GitInstaller.exe"
        
        Invoke-WebRequest -Uri $gitUrl -OutFile $gitInstaller
        Start-Process $gitInstaller -Wait -ArgumentList "/SILENT"
        
        Remove-Item $gitInstaller -Force
        Write-Status "Git installed successfully"
    }
    catch {
        Write-Error "Failed to install Git: $($_.Exception.Message)"
    }
}

# Main execution
Write-Host "AWS Tools Alternative Setup Script" -ForegroundColor Magenta
Write-Host "==================================" -ForegroundColor Magenta

if (!(Test-AdminRights)) {
    Write-Error "This script requires Administrator privileges. Please run as Administrator."
    exit 1
}

Write-Status "Starting installation of AWS deployment tools..."

# Install each tool
Install-Git
Install-AwsCli
Install-Terraform
Install-Kubectl
Install-Eksctl
Install-DockerDesktop

Write-Host "`nInstallation Summary:" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan

# Check installations
$tools = @(
    @{Name = "AWS CLI"; Command = "aws"; Expected = $true},
    @{Name = "Terraform"; Command = "terraform"; Expected = $true},
    @{Name = "kubectl"; Command = "kubectl"; Expected = $true},
    @{Name = "eksctl"; Command = "eksctl"; Expected = $true},
    @{Name = "Docker"; Command = "docker"; Expected = !$SkipDocker},
    @{Name = "Git"; Command = "git"; Expected = $true}
)

foreach ($tool in $tools) {
    if ($tool.Expected) {
        $installed = Get-Command $tool.Command -ErrorAction SilentlyContinue
        if ($installed) {
            Write-Host "✓ $($tool.Name) - Installed" -ForegroundColor Green
        } else {
            Write-Host "✗ $($tool.Name) - Not Found" -ForegroundColor Red
        }
    } else {
        Write-Host "- $($tool.Name) - Skipped" -ForegroundColor Yellow
    }
}

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "1. Restart your PowerShell terminal" -ForegroundColor White
Write-Host "2. Configure AWS CLI: aws configure" -ForegroundColor White
Write-Host "3. Create AWS IAM user with appropriate permissions" -ForegroundColor White
Write-Host "4. Run the deployment script: .\scripts\deploy-to-aws.ps1" -ForegroundColor White

if (!$SkipDocker) {
    Write-Host "`nNote: If Docker was installed, you may need to restart your computer." -ForegroundColor Yellow
}
}
