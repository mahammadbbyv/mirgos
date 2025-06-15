# Mirgos Refactored Version Launcher
# This PowerShell script helps launch the refactored version of Mirgos game for testing

Write-Host "Starting Mirgos Refactored Version..." -ForegroundColor Cyan

# Define paths
$backendPath = "c:\Users\Bemga\OneDrive - ITM STEP MMC\Desktop\mirgos\be"
$frontendPath = "c:\Users\Bemga\OneDrive - ITM STEP MMC\Desktop\mirgos\fe"
$testPagePath = Join-Path $frontendPath "connection-test.html"

# Kill any existing Node.js processes using port 3002 (our refactored backend port)
try {
    $tcpConnections = Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue
    if ($tcpConnections) {
        foreach ($conn in $tcpConnections) {
            $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "Stopping existing process on port 3002: $($process.Name) (PID: $($process.Id))" -ForegroundColor Yellow
                Stop-Process -Id $process.Id -Force
            }
        }
    }
} catch {
    Write-Host "No processes using port 3002 found." -ForegroundColor Gray
}

# Start the refactored backend server
Write-Host "Starting backend server on port 3002..." -ForegroundColor Green
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "Set-Location '$backendPath'; node start-refactored.js" -WindowStyle Normal

# Wait for backend to initialize
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Open the connection test page in the default browser
Write-Host "Opening connection test page..." -ForegroundColor Green
Start-Process $testPagePath

Write-Host "Done! The connection test page should be open in your browser." -ForegroundColor Cyan
Write-Host "You can use it to test connectivity with the refactored backend." -ForegroundColor Cyan
