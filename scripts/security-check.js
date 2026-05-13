#!/usr/bin/env node

// ============================================================
// IEC ELECTION PORTAL - PRE-DEPLOYMENT SECURITY VERIFICATION
// ============================================================

const fs = require('fs');
const path = require('path');

console.log('🔒 IEC Election Portal - Security Verification\n');

// Check for required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY',
  'RESEND_API_KEY',
  'IEC_GMAIL_USER',
  'IEC_GMAIL_APP_PASSWORD'
];

// Check for forbidden development variables
const forbiddenVars = [
  'NEXT_PUBLIC_DEBUG=true',
  'SKIP_AUTH=true',
  'NODE_ENV=development'
];

// Security checks
const checks = [];

// 1. Check if .env.local exists and has required vars
checks.push({
  name: 'Environment Variables Configuration',
  check: () => {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
      return { pass: false, message: '.env.local file not found' };
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const missing = requiredEnvVars.filter(v => !envContent.includes(v.split('=')[0]));
    
    if (missing.length > 0) {
      return { pass: false, message: `Missing env vars: ${missing.join(', ')}` };
    }
    
    return { pass: true, message: 'All required environment variables present' };
  }
});

// 2. Check for production template
checks.push({
  name: 'Production Template Exists',
  check: () => {
    const templatePath = path.join(process.cwd(), '.env.production.example');
    if (!fs.existsSync(templatePath)) {
      return { pass: false, message: '.env.production.example not found' };
    }
    return { pass: true, message: 'Production template exists' };
  }
});

// 3. Check package.json for security
checks.push({
  name: 'Package Security',
  check: () => {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Check for vulnerable dependencies
    if (packageJson.dependencies?.xlsx) {
      return { pass: false, message: 'Vulnerable xlsx dependency found' };
    }
    
    if (packageJson.dependencies?.['@xlsx/worker-sheet']) {
      return { pass: false, message: 'Vulnerable @xlsx/worker-sheet dependency found' };
    }
    
    return { pass: true, message: 'No vulnerable dependencies detected' };
  }
});

// 4. Check Next.js config security
checks.push({
  name: 'Next.js Security Configuration',
  check: () => {
    const configPath = path.join(process.cwd(), 'next.config.ts');
    if (!fs.existsSync(configPath)) {
      return { pass: false, message: 'next.config.ts not found' };
    }
    
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Check for security headers
    const requiredHeaders = [
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy'
    ];
    
    const missing = requiredHeaders.filter(header => !configContent.includes(header));
    
    if (missing.length > 0) {
      return { pass: false, message: `Missing security headers: ${missing.join(', ')}` };
    }
    
    return { pass: true, message: 'Security headers configured' };
  }
});

// 5. Check middleware exists
checks.push({
  name: 'Security Middleware',
  check: () => {
    const middlewarePath = path.join(process.cwd(), 'middleware.ts');
    if (!fs.existsSync(middlewarePath)) {
      return { pass: false, message: 'middleware.ts not found' };
    }
    
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
    
    if (!middlewareContent.includes('rateLimit')) {
      return { pass: false, message: 'Rate limiting not implemented in middleware' };
    }
    
    return { pass: true, message: 'Security middleware with rate limiting found' };
  }
});

// 6. Check .gitignore for security
checks.push({
  name: 'Git Security',
  check: () => {
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      return { pass: false, message: '.gitignore not found' };
    }
    
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    
    const requiredIgnores = [
      '.env.local',
      '.env.production',
      '.env.staging'
    ];
    
    const missing = requiredIgnores.filter(pattern => !gitignoreContent.includes(pattern));
    
    if (missing.length > 0) {
      return { pass: false, message: `Missing .gitignore patterns: ${missing.join(', ')}` };
    }
    
    return { pass: true, message: 'Environment files properly ignored' };
  }
});

// Run all checks
let allPassed = true;
console.log('Running security checks...\n');

checks.forEach((check, index) => {
  const result = check.check();
  const status = result.pass ? '✅' : '❌';
  console.log(`${status} ${check.name}: ${result.message}`);
  
  if (!result.pass) {
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('🎉 All security checks passed! Ready for deployment.');
  console.log('\nNext steps:');
  console.log('1. Copy .env.production.example to .env.production');
  console.log('2. Fill in actual production values');
  console.log('3. Run: npm run build');
  console.log('4. Run: npm run deploy');
} else {
  console.log('⚠️  Security issues found. Please fix before deployment.');
  process.exit(1);
}
