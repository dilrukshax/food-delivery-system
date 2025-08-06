# Cleanup script for Azure resources
# WARNING: This will delete all resources created by the setup

param(
    [Parameter(Mandatory=$true)]
    [string]$Environment = "dev",
    
    [Parameter(Mandatory=$true)]
    [string]$ProjectName = "food-delivery",
    
    [switch]$Force
)

$ErrorActionPreference = "Stop"

# Color codes for output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if user is logged into Azure
function Test-AzureLogin {
    Write-Status "Checking Azure CLI login status..."
    try {
        az account show | Out-Null
        Write-Success "Azure CLI is logged in"
        return $true
    } catch {
        Write-Error "Please log in to Azure CLI first: az login"
        return $false
    }
}

# Main cleanup function
function Remove-AzureResources {
    if (-not $Force) {
        $confirmation = Read-Host "This will DELETE ALL Azure resources for the $ProjectName project in the $Environment environment. Type 'DELETE' to confirm"
        if ($confirmation -ne "DELETE") {
            Write-Warning "Operation cancelled"
            return
        }
    }
    
    Write-Status "Starting cleanup of Azure resources..."
    
    # Get all resource groups matching our pattern
    $resourceGroups = az group list --query "[?contains(name, 'rg-$ProjectName') || contains(name, 'rg-terraform-state-$ProjectName') || contains(name, 'rg-preview-$ProjectName')].name" -o tsv
    
    foreach ($rg in $resourceGroups) {
        if ($rg) {
            Write-Status "Deleting resource group: $rg"
            az group delete --name $rg --yes --no-wait
        }
    }
    
    # Clean up service principal
    $spName = "sp-github-actions-$ProjectName-$Environment"
    Write-Status "Deleting service principal: $spName"
    az ad sp delete --id "http://$spName" 2>$null
    
    Write-Success "Cleanup initiated. Resource deletion is running in the background."
    Write-Warning "It may take several minutes for all resources to be fully deleted."
}

# Main execution
if (Test-AzureLogin) {
    Remove-AzureResources
} else {
    exit 1
}
