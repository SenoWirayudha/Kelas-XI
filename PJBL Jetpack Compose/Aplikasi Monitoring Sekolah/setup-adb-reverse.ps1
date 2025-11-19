# Script untuk setup ADB reverse untuk development
Write-Host "Setting up ADB reverse..." -ForegroundColor Cyan

# Path ke ADB
$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"

if (Test-Path $adbPath) {
    # Check device connected
    & $adbPath devices
    
    # Setup reverse
    & $adbPath reverse tcp:8000 tcp:8000
    
    Write-Host "`nADB reverse berhasil di-setup!" -ForegroundColor Green
    Write-Host "Port 8000 di device sekarang mengarah ke localhost:8000" -ForegroundColor Yellow
    Write-Host "`nPastikan Laravel server berjalan di:" -ForegroundColor Cyan
    Write-Host "http://127.0.0.1:8000" -ForegroundColor White
} else {
    Write-Host "ADB tidak ditemukan di: $adbPath" -ForegroundColor Red
    Write-Host "Pastikan Android SDK sudah terinstall" -ForegroundColor Yellow
}

Read-Host "`nPress Enter to exit"
