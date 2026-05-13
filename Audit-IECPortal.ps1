# ================================================================
# IEC Election Portal — Full Frontend Structure Audit Script
# Run from: D:\iec-election-portal
# Usage:    .\Audit-IECPortal.ps1
# Output:   Creates audit report in same directory
# ================================================================

param(
    [string]$RootPath = "D:\iec-election-portal",
    [string]$OutputFile = "D:\iec-election-portal\FRONTEND_AUDIT_REPORT.txt"
)

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$report = @()

function Write-Section($title) {
    $line = "=" * 70
    $report += ""
    $report += $line
    $report += "  $title"
    $report += $line
    Write-Host "`n$line" -ForegroundColor Cyan
    Write-Host "  $title" -ForegroundColor Cyan
    Write-Host $line -ForegroundColor Cyan
}

function Write-Item($label, $value, $color = "White") {
    $entry = "  $label : $value"
    $report += $entry
    Write-Host "  " -NoNewline
    Write-Host $label -NoNewline -ForegroundColor Gray
    Write-Host " : " -NoNewline
    Write-Host $value -ForegroundColor $color
}

function Write-Flag($message, $severity = "INFO") {
    $colors = @{ "CRITICAL" = "Red"; "WARNING" = "Yellow"; "OK" = "Green"; "INFO" = "Cyan" }
    $color = $colors[$severity]
    $prefix = @{ "CRITICAL" = "[CRITICAL]"; "WARNING" = "[WARNING] "; "OK" = "[OK]      "; "INFO" = "[INFO]    " }
    $entry = "  $($prefix[$severity]) $message"
    $report += $entry
    Write-Host "  $($prefix[$severity]) " -NoNewline -ForegroundColor $color
    Write-Host $message
}

# ----------------------------------------------------------------
$report += "IEC ELECTION PORTAL — FULL FRONTEND AUDIT REPORT"
$report += "Generated : $timestamp"
$report += "Root Path : $RootPath"
$report += ""

Write-Host "`n================================================================" -ForegroundColor Magenta
Write-Host "  IEC Election Portal — Frontend Security & Structure Audit" -ForegroundColor Magenta
Write-Host "  $timestamp" -ForegroundColor Magenta
Write-Host "================================================================`n" -ForegroundColor Magenta

# ================================================================
Write-Section "1. ROOT DIRECTORY STRUCTURE"
# ================================================================
Get-ChildItem -Path $RootPath -Force | ForEach-Object {
    $type = if ($_.PSIsContainer) { "[DIR] " } else { "[FILE]" }
    $size = if (-not $_.PSIsContainer) { "$([math]::Round($_.Length/1KB, 1)) KB" } else { "" }
    $entry = "  $type $($_.Name) $size"
    $report += $entry
    $color = if ($_.PSIsContainer) { "Yellow" } else { "White" }
    Write-Host "  $type " -NoNewline -ForegroundColor $color
    Write-Host $_.Name -NoNewline -ForegroundColor $color
    if ($size) { Write-Host "  ($size)" -ForegroundColor DarkGray } else { Write-Host "" }
}

# ================================================================
Write-Section "2. APP DIRECTORY — ALL ROUTES"
# ================================================================
$appPath = Join-Path $RootPath "app"
if (Test-Path $appPath) {
    Get-ChildItem -Path $appPath -Recurse -File | ForEach-Object {
        $rel = $_.FullName.Replace($appPath, "").Replace("\", "/")
        $size = "$([math]::Round($_.Length/1KB, 1)) KB"
        $entry = "  app$rel  ($size)"
        $report += $entry

        $color = "White"
        if ($rel -match "admin") { $color = "Red" }
        elseif ($rel -match "api") { $color = "Cyan" }
        elseif ($rel -match "register") { $color = "Yellow" }

        Write-Host "  app$rel" -NoNewline -ForegroundColor $color
        Write-Host "  ($size)" -ForegroundColor DarkGray
    }
} else {
    Write-Flag "app/ directory not found at $appPath" "CRITICAL"
}

# ================================================================
Write-Section "3. COMPONENTS DIRECTORY"
# ================================================================
$compPath = Join-Path $RootPath "components"
if (Test-Path $compPath) {
    Get-ChildItem -Path $compPath -Recurse -File | ForEach-Object {
        $rel = $_.FullName.Replace($compPath, "").Replace("\", "/")
        $size = "$([math]::Round($_.Length/1KB, 1)) KB"
        $report += "  components$rel  ($size)"
        Write-Host "  components$rel" -NoNewline -ForegroundColor White
        Write-Host "  ($size)" -ForegroundColor DarkGray
    }
} else {
    Write-Flag "components/ directory not found" "WARNING"
}

# ================================================================
Write-Section "4. LIB DIRECTORY — BUSINESS LOGIC"
# ================================================================
$libPath = Join-Path $RootPath "lib"
if (Test-Path $libPath) {
    Get-ChildItem -Path $libPath -Recurse -File | ForEach-Object {
        $rel = $_.FullName.Replace($libPath, "").Replace("\", "/")
        $size = "$([math]::Round($_.Length/1KB, 1)) KB"
        $report += "  lib$rel  ($size)"

        $color = "White"
        if ($rel -match "auth|session|admin") { $color = "Red" }
        elseif ($rel -match "rate|limit|block") { $color = "Yellow" }

        Write-Host "  lib$rel" -NoNewline -ForegroundColor $color
        Write-Host "  ($size)" -ForegroundColor DarkGray
    }
}

# ================================================================
Write-Section "5. API ROUTES — ENDPOINT MAP"
# ================================================================
$apiPath = Join-Path $RootPath "app\api"
if (Test-Path $apiPath) {
    Get-ChildItem -Path $apiPath -Recurse -Filter "route.ts" | ForEach-Object {
        $rel = $_.FullName.Replace((Join-Path $RootPath "app"), "").Replace("\", "/").Replace("/route.ts", "")
        $size = "$([math]::Round($_.Length/1KB, 1)) KB"
        $report += "  POST/GET $rel  ($size)"
        Write-Host "  " -NoNewline
        Write-Host "ENDPOINT" -NoNewline -ForegroundColor Cyan
        Write-Host " $rel" -NoNewline
        Write-Host "  ($size)" -ForegroundColor DarkGray
    }
} else {
    Write-Flag "No api/ routes found under app/" "WARNING"
}

# ================================================================
Write-Section "6. ADMIN ROUTES — ACCESS CONTROL AUDIT"
# ================================================================
$adminPath = Join-Path $RootPath "app\admin"
if (Test-Path $adminPath) {
    Get-ChildItem -Path $adminPath -Recurse -File | ForEach-Object {
        $rel = $_.FullName.Replace($adminPath, "").Replace("\", "/")
        $size = "$([math]::Round($_.Length/1KB, 1)) KB"
        $report += "  [ADMIN] $rel  ($size)"
        Write-Host "  [ADMIN] " -NoNewline -ForegroundColor Red
        Write-Host $rel -NoNewline
        Write-Host "  ($size)" -ForegroundColor DarkGray

        # Check if file contains sessionStorage references
        $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
        if ($content -match "sessionStorage") {
            Write-Flag "  $rel uses sessionStorage — console-injectable!" "CRITICAL"
        }
        if ($content -match "localStorage") {
            Write-Flag "  $rel uses localStorage — persistent injection risk!" "WARNING"
        }
        if ($content -match "supabase.*anon|createClient.*NEXT_PUBLIC") {
            Write-Flag "  $rel calls Supabase directly from client-side!" "WARNING"
        }
        if ($content -match "password.*plain|plaintext") {
            Write-Flag "  $rel may handle plaintext passwords!" "CRITICAL"
        }
    }
} else {
    Write-Flag "No admin/ directory found under app/" "CRITICAL"
}

# ================================================================
Write-Section "7. MIDDLEWARE & SECURITY CONFIG"
# ================================================================
$mwFile = Join-Path $RootPath "middleware.ts"
if (Test-Path $mwFile) {
    $mwContent = Get-Content $mwFile -Raw
    $size = "$([math]::Round((Get-Item $mwFile).Length/1KB, 1)) KB"
    Write-Flag "middleware.ts found ($size)" "OK"

    if ($mwContent -match "admin") { Write-Flag "Admin route protection found" "OK" }
    else { Write-Flag "No admin route protection in middleware!" "CRITICAL" }

    if ($mwContent -match "rateLimit|rate_limit|Rate") { Write-Flag "Rate limiting referenced" "OK" }
    else { Write-Flag "No rate limiting in middleware!" "WARNING" }

    if ($mwContent -match "session|token|auth") { Write-Flag "Session/auth logic found" "OK" }
    else { Write-Flag "No session validation in middleware!" "CRITICAL" }

    if ($mwContent -match "X-Frame-Options|Content-Security-Policy") { Write-Flag "Security headers set" "OK" }
    else { Write-Flag "No security headers in middleware!" "WARNING" }
} else {
    Write-Flag "middleware.ts NOT FOUND — all routes unprotected!" "CRITICAL"
}

# ================================================================
Write-Section "8. ENVIRONMENT FILE AUDIT"
# ================================================================
$envFiles = @(".env.local", ".env.production", ".env", ".env.example", ".env.local.example")
foreach ($ef in $envFiles) {
    $efPath = Join-Path $RootPath $ef
    if (Test-Path $efPath) {
        $size = "$([math]::Round((Get-Item $efPath).Length/1KB, 1)) KB"
        Write-Flag "$ef exists ($size)" "OK"

        $content = Get-Content $efPath -Raw -ErrorAction SilentlyContinue
        if ($content -match "service_role|SERVICE_ROLE") {
            Write-Flag "  $ef contains SERVICE_ROLE key — must NEVER be NEXT_PUBLIC_!" "CRITICAL"
        }
        if ($content -match "NEXT_PUBLIC_.*SERVICE|NEXT_PUBLIC_.*SECRET") {
            Write-Flag "  $ef exposes secret as NEXT_PUBLIC — will leak to browser!" "CRITICAL"
        }
        if ($content -match "NEXT_PUBLIC_SUPABASE_URL") { Write-Flag "  Supabase URL configured" "OK" }
        if ($content -match "NEXT_PUBLIC_SUPABASE_ANON") { Write-Flag "  Supabase anon key configured" "OK" }
    }
}

$gitignore = Join-Path $RootPath ".gitignore"
if (Test-Path $gitignore) {
    $gi = Get-Content $gitignore -Raw
    if ($gi -match "\.env\.local" -and $gi -match "\.env\.production") {
        Write-Flag ".gitignore properly excludes .env files" "OK"
    } else {
        Write-Flag ".gitignore may not be excluding all .env files!" "WARNING"
    }
}

# ================================================================
Write-Section "9. PACKAGE.JSON — DEPENDENCY SECURITY"
# ================================================================
$pkgPath = Join-Path $RootPath "package.json"
if (Test-Path $pkgPath) {
    $pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
    Write-Item "Project name" $pkg.name
    Write-Item "Next.js version" $pkg.dependencies.'next'

    $dangerousPkgs = @("xlsx", "node-serialize", "eval", "vm2", "serialize-javascript")
    foreach ($dp in $dangerousPkgs) {
        if ($pkg.dependencies.$dp -or $pkg.devDependencies.$dp) {
            Write-Flag "DANGEROUS package found: $dp" "CRITICAL"
        }
    }

    $goodPkgs = @("exceljs", "@supabase/supabase-js", "bcrypt", "zod")
    foreach ($gp in $goodPkgs) {
        if ($pkg.dependencies.$gp) {
            Write-Flag "Secure package present: $gp" "OK"
        }
    }
}

# ================================================================
Write-Section "10. UNNECESSARY & RISK FILES"
# ================================================================
$riskyFiles = @(
    "reopen_portal.sql",
    "schedule_reopen.bat",
    "`$null",
    "*.sql",
    "*.bat",
    "*.sh",
    "SECURITY_AUDIT_REPORT.md",
    "COMPREHENSIVE_SECURITY_AUDIT.md",
    "DATABASE_SECURITY_AUDIT.md",
    "PRODUCTION_SECURITY_AUDIT_REPORT.md",
    "PROFESSIONAL_SECURITY_IMPLEMENTATION.md",
    "SECURITY_IMPLEMENTATION_GUIDE.md"
)

foreach ($pattern in $riskyFiles) {
    $found = Get-ChildItem -Path $RootPath -Filter $pattern -ErrorAction SilentlyContinue
    foreach ($f in $found) {
        Write-Flag "Risky/unnecessary file in root: $($f.Name) — should be deleted or moved" "WARNING"
    }
}

# ================================================================
Write-Section "11. ADMIN AUTH FILE DEEP SCAN"
# ================================================================
$adminAuthFiles = @(
    (Join-Path $RootPath "lib\adminAuth.ts"),
    (Join-Path $RootPath "lib\auth.ts"),
    (Join-Path $RootPath "lib\admin.ts")
)
foreach ($af in $adminAuthFiles) {
    if (Test-Path $af) {
        $content = Get-Content $af -Raw
        $fname = Split-Path $af -Leaf
        Write-Flag "$fname found" "OK"

        if ($content -match "sessionStorage") { Write-Flag "$fname uses sessionStorage — INSECURE" "CRITICAL" }
        if ($content -match "httpOnly|cookie") { Write-Flag "$fname uses httpOnly cookies — SECURE" "OK" }
        if ($content -match "verify_admin_session|verify_admin_password") { Write-Flag "$fname calls server-side verify functions" "OK" }
        if ($content -match "supabase\.from.*admin_users.*select") { Write-Flag "$fname queries admin_users directly from client!" "CRITICAL" }
        if ($content -match "bcrypt|crypt|hash") { Write-Flag "$fname handles password hashing" "OK" }
    }
}

# ================================================================
Write-Section "12. SUMMARY SCORE"
# ================================================================
$criticals = ($report | Where-Object { $_ -match "\[CRITICAL\]" }).Count
$warnings  = ($report | Where-Object { $_ -match "\[WARNING\]" }).Count
$oks       = ($report | Where-Object { $_ -match "\[OK\]" }).Count

Write-Item "Critical issues found" $criticals "Red"
Write-Item "Warnings found" $warnings "Yellow"
Write-Item "Checks passed" $oks "Green"

$score = [math]::Round(($oks / [math]::Max(1, $oks + $criticals + $warnings)) * 100, 0)
Write-Item "Security score" "$score%" $(if ($score -ge 80) { "Green" } elseif ($score -ge 60) { "Yellow" } else { "Red" })

# ================================================================
# Write report to file
# ================================================================
$report | Out-File -FilePath $OutputFile -Encoding UTF8
Write-Host "`n================================================================" -ForegroundColor Magenta
Write-Host "  Report saved to: $OutputFile" -ForegroundColor Green
Write-Host "================================================================`n" -ForegroundColor Magenta
