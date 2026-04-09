$email = "admin@garagesales.com"
$senha = "admin123"
$apiUrl = "https://garagesales-api.onrender.com"

Write-Host "Converting admin to admin_master..." -ForegroundColor Cyan

# Step 1: Login
Write-Host "Step 1: Logging in..." -ForegroundColor Yellow
$loginResponse = Invoke-WebRequest -Uri "$apiUrl/api/auth/admin/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body "{`"email`": `"$email`", `"senha`": `"$senha`"}" `
  -UseBasicParsing

$loginData = $loginResponse.Content | ConvertFrom-Json
$token = $loginData.token
$adminId = $loginData.user.id

if (-not $token) {
    Write-Host "Error logging in!" -ForegroundColor Red
    Write-Host $loginResponse.Content
    exit 1
}

Write-Host "Login successful!" -ForegroundColor Green
Write-Host "Admin ID: $adminId" -ForegroundColor Green

# Step 2: Convert to admin_master
Write-Host "Step 2: Converting to admin_master..." -ForegroundColor Yellow
$convertResponse = Invoke-WebRequest -Uri "$apiUrl/api/admin/convert-to-master/$adminId" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"} `
  -UseBasicParsing

$convertData = $convertResponse.Content | ConvertFrom-Json

if ($convertData.message) {
    Write-Host "Success!" -ForegroundColor Green
    Write-Host "Message: $($convertData.message)" -ForegroundColor Green
    Write-Host "Role: $($convertData.user.role)" -ForegroundColor Green
} else {
    Write-Host "Error!" -ForegroundColor Red
    Write-Host $convertResponse.Content
    exit 1
}

Write-Host ""
Write-Host "Done! You are now Admin Master!" -ForegroundColor Green
Write-Host "Login again to update permissions." -ForegroundColor Cyan
