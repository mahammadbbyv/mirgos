# Launch Script for Mirgos Refactored Version
# This PowerShell script launches both the refactored backend and frontend

Write-Host "=== Launching Mirgos Refactored Version ===" -ForegroundColor Cyan
Write-Host "(This version uses port 3002 for the backend and port 5174 for the frontend)" -ForegroundColor Gray
Write-Host

# Define paths
$backendPath = "c:\Users\Bemga\OneDrive - ITM STEP MMC\Desktop\mirgos\be"
$frontendPath = "c:\Users\Bemga\OneDrive - ITM STEP MMC\Desktop\mirgos\fe"

# Kill any existing Node.js processes using our ports
try {
    Write-Host "Checking for processes using ports 3002 and 5174..." -ForegroundColor Yellow
    $tcpConnections = @()
    $tcpConnections += Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue
    $tcpConnections += Get-NetTCPConnection -LocalPort 5174 -ErrorAction SilentlyContinue
    
    foreach ($conn in $tcpConnections) {
        $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "Stopping process on port $($conn.LocalPort): $($process.Name) (PID: $($process.Id))" -ForegroundColor Yellow
            Stop-Process -Id $process.Id -Force
        }
    }
} catch {
    Write-Host "No conflicting processes found." -ForegroundColor Gray
}

# Start the refactored backend server
Write-Host "Starting backend server on port 3002..." -ForegroundColor Green
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "Set-Location '$backendPath'; node start-refactored.js" -WindowStyle Normal

# Wait for backend to initialize
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Start the refactored frontend
Write-Host "Starting frontend on port 5174..." -ForegroundColor Green
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendPath'; node start-refactored.js" -WindowStyle Normal

Write-Host "Done! Both services are starting." -ForegroundColor Cyan
Write-Host "Frontend URL: http://localhost:5174" -ForegroundColor Green
Write-Host "Backend URL: http://localhost:3000" -ForegroundColor Green
Write-Host 
Write-Host "You can also use the connection test page to verify connectivity:" -ForegroundColor Yellow
Write-Host "file://$frontendPath\connection-test.html" -ForegroundColor Yellow
