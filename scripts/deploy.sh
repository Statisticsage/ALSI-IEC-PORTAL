#!/bin/bash

# ============================================================
# IEC ELECTION PORTAL - PRODUCTION DEPLOYMENT SCRIPT
# ============================================================

set -e  # Exit on any error

echo "🚀 IEC Election Portal - Production Deployment"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Pre-deployment checks
echo "Running pre-deployment checks..."

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found!"
    echo "Please copy .env.production.example to .env.production and fill in the values."
    exit 1
fi

# Check if required environment variables are set
source .env.production

required_vars=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Required environment variable $var is not set!"
        exit 1
    fi
done

print_status "Environment variables configured"

# Run security check
echo "Running security verification..."
node scripts/security-check.js
if [ $? -ne 0 ]; then
    print_error "Security checks failed!"
    exit 1
fi

print_status "Security checks passed"

# Clean previous build
echo "Cleaning previous build..."
rm -rf .next
print_status "Build cleaned"

# Production build
echo "Building for production..."
$env:NODE_ENV="production" npm run build
if [ $? -ne 0 ]; then
    print_error "Build failed!"
    exit 1
fi

print_status "Production build successful"

# Deploy to Cloudflare
echo "Deploying to Cloudflare Workers..."
npm run deploy
if [ $? -ne 0 ]; then
    print_error "Deployment failed!"
    exit 1
fi

print_status "Deployment successful!"

# Post-deployment verification
echo "Running post-deployment verification..."

# Wait a moment for deployment to propagate
sleep 5

# Check if the site is accessible
PRODUCTION_URL="https://iec.alsi-election-org.workers.dev"
if curl -f -s -o /dev/null "$PRODUCTION_URL"; then
    print_status "Site is accessible at $PRODUCTION_URL"
else
    print_warning "Site might still be propagating. Please check manually."
fi

echo ""
echo "=============================================="
print_status "Deployment completed successfully!"
echo ""
echo "📍 Production URL: $PRODUCTION_URL"
echo "📊 Admin Dashboard: $PRODUCTION_URL/admin"
echo ""
echo "🔐 Security Features Enabled:"
echo "   • Rate Limiting"
echo "   • Security Headers"
echo "   • HTTPS Only"
echo "   • CSRF Protection"
echo ""
echo "📋 Next Steps:"
echo "   1. Test admin login"
echo "   2. Verify email notifications"
echo "   3. Check audit logging"
echo "   4. Monitor error rates"
echo ""
print_warning "Remember to monitor the system and check audit logs regularly!"
