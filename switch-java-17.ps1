# Switch to Java 17 for development and CI/CD compatibility
Write-Host "Switching to Java 17..." -ForegroundColor Green

# Set environment variables for current session
$env:JAVA_HOME="C:\Program Files\Java\jdk-17"
$env:PATH="C:\Program Files\Java\jdk-17\bin;$env:PATH"

# Verify the switch
Write-Host "Current Java version:" -ForegroundColor Yellow
java -version

Write-Host "`nJava 17 is now active for this PowerShell session." -ForegroundColor Green
Write-Host "You can now run Maven commands with Java 17 compatibility." -ForegroundColor Cyan

# Optional: Display Maven version
Write-Host "`nMaven version:" -ForegroundColor Yellow
mvn -version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Maven not found in PATH. Use ./mvnw instead." -ForegroundColor Orange
}
