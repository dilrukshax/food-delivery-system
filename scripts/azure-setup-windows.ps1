# Azure Setup Script for Food Delivery System (Windows PowerShell)
# This script automates the Azure setup process for beginners

param(
    [string]$ProjectName = "fooddelivery",
    [string]$Location = "eastus"
)

$ErrorActionPreference = "Stop"

# Color functions for better output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" "Green"
}

function Write-Info {
    param([string]$Message)
    Write-ColorOutput "ℹ️  $Message" "Cyan"
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠️  $Message" "Yellow"
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "❌ $Message" "Red"
}

# Function to check if Azure CLI is installed
function Test-AzureCLI {
    try {
        $null = az --version
        return $true
    }
    catch {
        return $false
    }
}

# Function to install Azure CLI on Windows
function Install-AzureCLI {
    Write-Info "Azure CLI not found. Would you like to install it? (y/n)"
    $response = Read-Host
    
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Info "Downloading and installing Azure CLI..."
        
        # Download Azure CLI installer
        $installerUrl = "https://aka.ms/installazurecliwindows"
        $installerPath = "$env:TEMP\AzureCLI.msi"
        
        try {
            Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath
            Start-Process msiexec.exe -Wait -ArgumentList "/I $installerPath /quiet"
            
            # Refresh environment variables
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
            
            Write-Success "Azure CLI installed successfully!"
            Write-Warning "Please restart PowerShell and run this script again."
            exit 0
        }
        catch {
            Write-Error "Failed to install Azure CLI. Please install manually from: https://aka.ms/installazurecliwindows"
            exit 1
        }
    }
    else {
        Write-Error "Azure CLI is required. Please install it from: https://aka.ms/installazurecliwindows"
        exit 1
    }
}

# Function to login to Azure
function Connect-Azure {
    Write-Info "Checking Azure login status..."
    
    try {
        $account = az account show 2>$null | ConvertFrom-Json
        Write-Success "Already logged in as: $($account.user.name)"
        return $account
    }
    catch {
        Write-Info "Please log in to Azure..."
        az login
        $account = az account show | ConvertFrom-Json
        Write-Success "Logged in as: $($account.user.name)"
        return $account
    }
}

# Function to create service principal
function New-ServicePrincipal {
    param([string]$SubscriptionId)
    
    Write-Info "Creating Service Principal for GitHub Actions..."
    
    $spName = "sp-github-$ProjectName-$(Get-Date -Format 'yyyyMMdd')"
    
    try {
        $sp = az ad sp create-for-rbac `
            --name $spName `
            --role "Contributor" `
            --scopes "/subscriptions/$SubscriptionId" `
            --sdk-auth | ConvertFrom-Json
        
        Write-Success "Service Principal created successfully!"
        return $sp
    }
    catch {
        Write-Error "Failed to create Service Principal: $_"
        throw
    }
}

# Function to create Azure Container Registry
function New-ContainerRegistry {
    param([string]$ResourceGroupName)
    
    Write-Info "Creating Azure Container Registry..."
    
    $timestamp = Get-Date -Format "yyyyMMddHHmm"
    $acrName = "acr$ProjectName$timestamp"
    
    try {
        # Create ACR
        $acr = az acr create `
            --resource-group $ResourceGroupName `
            --name $acrName `
            --sku Standard `
            --admin-enabled true | ConvertFrom-Json
        
        # Get credentials
        $credentials = az acr credential show --name $acrName | ConvertFrom-Json
        
        Write-Success "Container Registry created: $($acr.loginServer)"
        
        return @{
            LoginServer = $acr.loginServer
            Username = $credentials.username
            Password = $credentials.passwords[0].value
        }
    }
    catch {
        Write-Error "Failed to create Container Registry: $_"
        throw
    }
}

# Function to create Terraform state storage
function New-TerraformStorage {
    param([string]$ResourceGroupName)
    
    Write-Info "Creating Terraform state storage..."
    
    $timestamp = Get-Date -Format "yyyyMMddHHmm"
    $storageAccountName = "saterraform$timestamp"
    
    try {
        # Create storage account
        $storage = az storage account create `
            --resource-group $ResourceGroupName `
            --name $storageAccountName `
            --sku Standard_LRS `
            --encryption-services blob | ConvertFrom-Json
        
        # Create container
        az storage container create `
            --name "tfstate" `
            --account-name $storageAccountName | Out-Null
        
        Write-Success "Terraform storage created: $storageAccountName"
        
        return @{
            ResourceGroup = $ResourceGroupName
            StorageAccount = $storageAccountName
            Container = "tfstate"
        }
    }
    catch {
        Write-Error "Failed to create Terraform storage: $_"
        throw
    }
}

# Function to generate PostgreSQL password
function New-PostgreSQLPassword {
    $chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%"
    $password = ""
    for ($i = 0; $i -lt 24; $i++) {
        $password += $chars[(Get-Random -Maximum $chars.Length)]
    }
    return $password + "1!"  # Ensure it meets complexity requirements
}

# Function to display GitHub secrets
function Show-GitHubSecrets {
    param(
        [object]$ServicePrincipal,
        [object]$ACRCredentials,
        [object]$TerraformStorage,
        [string]$PostgreSQLPassword
    )
    
    Write-Info "`n" + "="*60
    Write-Info "GITHUB SECRETS CONFIGURATION"
    Write-Info "="*60
    
    Write-ColorOutput "`nCopy and paste these values into your GitHub repository secrets:" "Yellow"
    Write-ColorOutput "(Settings → Secrets and variables → Actions → New repository secret)`n" "Gray"
    
    # Format service principal JSON properly
    $spJson = $ServicePrincipal | ConvertTo-Json -Compress
    
    Write-ColorOutput "Secret Name: AZURE_CREDENTIALS" "Cyan"
    Write-ColorOutput "Value:" "White"
    Write-ColorOutput $spJson "Green"
    Write-ColorOutput "`n" + "-"*60 + "`n" "Gray"
    
    Write-ColorOutput "Secret Name: ACR_LOGIN_SERVER" "Cyan"
    Write-ColorOutput "Value: $($ACRCredentials.LoginServer)" "Green"
    Write-ColorOutput "`n" + "-"*60 + "`n" "Gray"
    
    Write-ColorOutput "Secret Name: ACR_USERNAME" "Cyan"
    Write-ColorOutput "Value: $($ACRCredentials.Username)" "Green"
    Write-ColorOutput "`n" + "-"*60 + "`n" "Gray"
    
    Write-ColorOutput "Secret Name: ACR_PASSWORD" "Cyan"
    Write-ColorOutput "Value: $($ACRCredentials.Password)" "Green"
    Write-ColorOutput "`n" + "-"*60 + "`n" "Gray"
    
    Write-ColorOutput "Secret Name: POSTGRES_ADMIN_PASSWORD" "Cyan"
    Write-ColorOutput "Value: $PostgreSQLPassword" "Green"
    Write-ColorOutput "`n" + "-"*60 + "`n" "Gray"
    
    Write-ColorOutput "Secret Name: TERRAFORM_STATE_RG" "Cyan"
    Write-ColorOutput "Value: $($TerraformStorage.ResourceGroup)" "Green"
    Write-ColorOutput "`n" + "-"*60 + "`n" "Gray"
    
    Write-ColorOutput "Secret Name: TERRAFORM_STATE_SA" "Cyan"
    Write-ColorOutput "Value: $($TerraformStorage.StorageAccount)" "Green"
    Write-ColorOutput "`n" + "-"*60 + "`n" "Gray"
    
    Write-ColorOutput "Secret Name: TERRAFORM_STATE_CONTAINER" "Cyan"
    Write-ColorOutput "Value: $($TerraformStorage.Container)" "Green"
    Write-ColorOutput "`n" + "-"*60 + "`n" "Gray"
    
    Write-Success "All secrets are ready to be configured in GitHub!"
}

# Main execution
function Main {
    Write-Info "🚀 Azure Setup Script for Food Delivery System"
    Write-Info "=" * 50
    
    # Check and install Azure CLI if needed
    if (-not (Test-AzureCLI)) {
        Install-AzureCLI
    }
    
    Write-Success "Azure CLI is ready!"
    
    # Login to Azure
    $account = Connect-Azure
    $subscriptionId = $account.id
    
    # Create resource group
    $resourceGroupName = "rg-$ProjectName-setup"
    Write-Info "Creating resource group: $resourceGroupName"
    
    try {
        az group create --name $resourceGroupName --location $Location | Out-Null
        Write-Success "Resource group created successfully!"
    }
    catch {
        Write-Warning "Resource group might already exist, continuing..."
    }
    
    # Create all Azure resources
    try {
        $servicePrincipal = New-ServicePrincipal -SubscriptionId $subscriptionId
        $acrCredentials = New-ContainerRegistry -ResourceGroupName $resourceGroupName
        $terraformStorage = New-TerraformStorage -ResourceGroupName $resourceGroupName
        $postgresPassword = New-PostgreSQLPassword
        
        # Display results
        Show-GitHubSecrets -ServicePrincipal $servicePrincipal -ACRCredentials $acrCredentials -TerraformStorage $terraformStorage -PostgreSQLPassword $postgresPassword
        
        Write-Info "`n🎉 Setup completed successfully!"
        Write-Info "Next steps:"
        Write-Info "1. Copy all the secrets above into your GitHub repository"
        Write-Info "2. Commit and push your code to trigger the deployment"
        Write-Info "3. Monitor the GitHub Actions for deployment progress"
        
    }
    catch {
        Write-Error "Setup failed: $_"
        Write-Info "You may need to clean up resources manually in the Azure portal"
        exit 1
    }
}

# Run the main function
Main
