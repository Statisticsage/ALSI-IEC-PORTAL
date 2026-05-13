# IEC Election Portal - Production Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Security Hardening
- [x] Fixed Next.js configuration errors (reactStrictMode)
- [x] Resolved all npm audit vulnerabilities (upgraded to Next.js canary)
- [x] Replaced vulnerable `xlsx` dependency with secure `exceljs`
- [x] Added production-grade security headers in `next.config.ts`
- [x] Implemented rate limiting middleware
- [x] Enhanced middleware with security headers and CORS

### 2. Environment Configuration
- [x] Created `.env.production.example` template
- [ ] Set up production environment variables:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` (Supabase project URL)
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Public anon key)
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (Service role key - SECRET)
  - [ ] `RESEND_API_KEY` (Email service API key)
  - [ ] `IEC_GMAIL_USER` (Official IEC email)
  - [ ] `IEC_GMAIL_APP_PASSWORD` (Gmail app password)
  - [ ] `NODE_ENV=production`

### 3. Database Security
- [ ] Verify RLS (Row Level Security) policies are active
- [ ] Ensure sensitive columns are masked for anon users
- [ ] Check RPC functions have proper SECURITY DEFINER
- [ ] Test database connections with service role key

### 4. Build Verification
- [x] Build completes successfully (`npm run build`)
- [x] No TypeScript errors
- [x] All dependencies resolved
- [ ] Test production build locally

## 🚀 Deployment Steps

### 1. Prepare Production Environment
```bash
# Copy environment template
cp .env.production.example .env.production

# Fill in actual values (DO NOT commit .env.production)
# Edit .env.production with real credentials
```

### 2. Deploy to Cloudflare Workers
```bash
# Build and deploy
npm run deploy

# Or manually:
npm run build
npm run preview
```

### 3. Post-Deployment Verification
- [ ] Verify site loads at production URL
- [ ] Test admin login functionality
- [ ] Test registration forms
- [ ] Verify email notifications work
- [ ] Check security headers are present
- [ ] Test rate limiting is active
- [ ] Verify audit logging works

## 🔒 Security Headers Verification

Check these headers are present in production:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy` (in production)
- `Strict-Transport-Security` (HTTPS only)

## 📊 Rate Limits Configuration

Current rate limits:
- **Login**: 5 attempts per 15 minutes
- **Registration**: 3 attempts per hour
- **API**: 100 requests per 15 minutes
- **Export**: 10 exports per hour

## 🚨 Critical Security Notes

1. **NEVER commit `.env.production`** to version control
2. **CHANGE default admin credentials** in production
3. **USE strong, unique passwords** for all services
4. **ENABLE 2FA** on all admin accounts
5. **MONITOR audit logs** regularly
6. **BACKUP database** regularly
7. **KEEP dependencies updated**

## 📱 Production URL
- **Staging**: https://iec-staging.alsi-election-org.workers.dev
- **Production**: https://iec.alsi-election-org.workers.dev

## 🆘 Emergency Contacts

- **Technical Lead**: [Contact info]
- **Database Admin**: [Contact info]
- **Security Team**: [Contact info]

---

## 📋 Deployment Commands

```bash
# Build for production
npm run build

# Deploy to Cloudflare
npm run deploy

# Preview locally
npm run preview

# Check production build
npm run build && npm start
```

## 🔍 Monitoring Setup

After deployment, set up monitoring for:
- Error rates (4xx, 5xx)
- Response times
- Rate limit hits
- Failed login attempts
- Database connection issues

---

**Last Updated**: May 13, 2026  
**Version**: 1.0.0  
**Status**: Ready for Production Deployment
