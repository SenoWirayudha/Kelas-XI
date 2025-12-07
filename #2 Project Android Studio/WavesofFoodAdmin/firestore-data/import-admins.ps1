# Script PowerShell untuk import collection admins ke Firestore
# Pastikan Firebase CLI sudah terinstall: npm install -g firebase-tools

Write-Host "🔥 Firebase Admins Collection Import Script" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Yellow

# Check if Firebase CLI is installed
try {
    $firebaseVersion = firebase --version
    Write-Host "✅ Firebase CLI detected: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Firebase CLI not found. Please install: npm install -g firebase-tools" -ForegroundColor Red
    exit 1
}

# Check if logged in to Firebase
Write-Host "`nChecking Firebase authentication..." -ForegroundColor Blue
$loginStatus = firebase projects:list 2>&1

if ($loginStatus -match "Error") {
    Write-Host "🔐 Please login to Firebase first..." -ForegroundColor Yellow
    firebase login
}

# List available projects
Write-Host "`n📋 Available Firebase projects:" -ForegroundColor Blue
firebase projects:list

# Ask user to select project
$projectId = Read-Host "`nEnter your Firebase Project ID"

if ([string]::IsNullOrEmpty($projectId)) {
    Write-Host "❌ Project ID is required!" -ForegroundColor Red
    exit 1
}

# Use the project
firebase use $projectId

Write-Host "`n🚀 Starting import process..." -ForegroundColor Green

# Import using Firebase CLI (if firestore import is available)
# Alternative: Use the Node.js script
Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
npm init -y
npm install firebase-admin

Write-Host "`n📥 Importing admins collection..." -ForegroundColor Blue
node import-admins.js

Write-Host "`n✨ Import completed! Next steps:" -ForegroundColor Green
Write-Host "1. ✅ Collection 'admins' created in Firestore" -ForegroundColor White
Write-Host "2. ✅ Authentication users created" -ForegroundColor White
Write-Host "3. 🔑 Default login credentials:" -ForegroundColor White
Write-Host "   Email: admin@wavesoffood.com" -ForegroundColor Cyan
Write-Host "   Password: admin123456" -ForegroundColor Cyan
Write-Host "4. ⚠️  Please change the password after first login!" -ForegroundColor Yellow

Read-Host "`nPress Enter to continue..."
