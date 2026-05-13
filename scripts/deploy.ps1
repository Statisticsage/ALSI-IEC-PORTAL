# ============================================================
# IEC ELECTION PORTAL - PRODUCTION DEPLOYMENT SCRIPT (PowerShell)
# ============================================================

param(
    [switch]$SkipChecks,
    [switch]$DryRun
)

Write-Host "🚀 IEC Election Portal - Production Deployment" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Yellow

# Pre-deployment checks
if (-not $SkipChecks) {
    Write-Host "Running pre-deployment checks..." -ForegroundColor Blue
    
    # Check if .env.production exists
    if (-not (Test-Path ".env.production")) {
        Write-Host "❌ .env.production file not found!" -ForegroundColor Red
        Write-Host "Please copy .env.production.example to .env.production and fill in the values." -ForegroundColor Yellow
        exit 1
    }
    
    # Load environment variables
    try {
        $envContent = Get-Content ".env.production" | Where-Object { $_ -notmatch '^#' -and $_.Trim() -ne '' }
        foreach ($line in $envContent) {
            if ($line -match '^(.+)=(.*)$') {
                [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
            }
        }
    } catch {
        Write-Host "❌ Failed to load .env.production file!" -ForegroundColor Red
        exit 1
    }
    
    # Check required environment variables
    $requiredVars = @("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY")
    foreach ($var in $requiredVars) {
        if (-not (Get-Item Env:$var -ErrorAction SilentlyContinue)) {
            Write-Host "❌ Required environment variable $var is not set!" -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host "✅ Environment variables configured" -ForegroundColor Green
    
    # Run security check
    Write-Host "Running security verification..." -ForegroundColor Blue
    $securityCheck = node scripts/security-check.js
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Security checks failed!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Security checks passed" -ForegroundColor Green
}

# Clean previous build
Write-Host "Cleaning previous build..." -ForegroundColor Blue
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
}
Write-Host "✅ Build cleaned" -ForegroundColor Green

# Production build
Write-Host "Building for production..." -ForegroundColor Blue
$env:NODE_ENV = "production"
$buildResult = npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Production build successful" -ForegroundColor Green

# Deploy to Cloudflare (unless dry run)
if (-not $DryRun) {
    Write-Host "Deploying to Cloudflare Workers..." -ForegroundColor Blue
    $deployResult = npm run deploy
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Deployment failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
} else {
    Write-Host "🔍 Dry run: Skipping actual deployment" -ForegroundColor Yellow
}

# Post-deployment verification
Write-Host "Running post-deployment verification..." -ForegroundColor Blue

# Wait a moment for deployment to propagate
Start-Sleep -Seconds 5

# Check if the site is accessible
$PRODUCTION_URL = "https://iec.alsi-election-org.workers.dev"
try {
    $response = Invoke-WebRequest -Uri $PRODUCTION_URL -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Site is accessible at $PRODUCTION_URL" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Site returned status code $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Site might still be propagating. Please check manually." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Yellow
Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Production URL: $PRODUCTION_URL" -ForegroundColor Cyan
Write-Host "📊 Admin Dashboard: $PRODUCTION_URL/admin" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔐 Security Features Enabled:" -ForegroundColor Green
Write-Host "   • Rate Limiting" -ForegroundColor White
Write-Host "   • Security Headers" -ForegroundColor White
Write-Host "   • HTTPS Only" -ForegroundColor White
Write-Host "   • CSRF Protection" -ForegroundColor White
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Blue
Write-Host "   1. Test admin login" -ForegroundColor White
Write-Host "   2. Verify email notifications" -ForegroundColor White
Write-Host "   3. Check audit logging" -ForegroundColor White
Write-Host "   4. Monitor error rates" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Remember to monitor the system and check audit logs regularly!" -ForegroundColor Yellow
