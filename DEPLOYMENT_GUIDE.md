# CollabHub Deployment Guide

This guide covers deploying CollabHub to production on Vercel with Supabase backend.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
3. [Backend Setup (Supabase)](#backend-setup-supabase)
4. [Environment Configuration](#environment-configuration)
5. [Verification Checklist](#verification-checklist)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js 20.x or later
- npm or bun package manager
- GitHub account (for Vercel integration)
- Supabase account (https://supabase.com)

---

## Frontend Deployment (Vercel)

### Step 1: Prepare Your Repository

```bash
# Ensure all changes are committed
git status

# The repository should have:
# - .env.example (checked in)
# - vercel.json (checked in)
# - No .env.local or .env.* secrets
```

### Step 2: Create Vercel Project

1. Visit https://vercel.com/new
2. Import your GitHub repository
3. Choose project name: `collabhub`
4. Framework: Auto-detect (Vite)
5. Root Directory: `./` (default)
6. Click "Deploy"

### Step 3: Configure Environment Variables

In Vercel Project Settings → Environment Variables, add:

```
VITE_SUPABASE_URL: https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY: <your-publishable-key>
VITE_SUPABASE_PROJECT_ID: <your-project-id>
```

**Important**: These variables are PUBLIC and exposed in the browser. They should NOT contain any secrets. All authentication is handled by Supabase RLS policies, not secrets.

### Step 4: Verify Deployment

1. Wait for Vercel to build and deploy
2. Visit your production URL (e.g., `https://collabhub.vercel.app`)
3. Test authentication flow:
   - Register a new account
   - Sign in
   - View dashboard

---

## Backend Setup (Supabase)

### Step 1: Create Production Supabase Project

1. Go to https://app.supabase.com/projects
2. Click "New Project"
3. Enter project name: `collabhub-prod`
4. Choose region closest to your users
5. Set secure database password
6. Click "Create new project"

### Step 2: Get API Keys

Once project is created:

1. Go to Project Settings → API
2. Copy `Project URL` → `VITE_SUPABASE_URL`
3. Copy `anon public` key → `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Go to General settings, copy `Project ID` → `VITE_SUPABASE_PROJECT_ID`

### Step 3: Run Database Migrations

**Option A: Using Supabase CLI**

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-id <your-project-id>

# Push all migrations
supabase push
```

**Option B: Manual Migration (SQL Editor)**

1. Go to Supabase dashboard → SQL Editor
2. For each file in `supabase/migrations/` (in order):
   - Copy file contents
   - Paste in SQL Editor
   - Click "Run"

**Migration Order:**
- `20251228055558_*.sql`
- `20251228063412_*.sql`
- `20251228064027_*.sql`
- `20251231_skill_gap_fields.sql`
- `20251231_trust_safety_features.sql`
- `20260104055251_*.sql`
- `20260104082540_*.sql`
- `20260104085123_*.sql`
- `20260104090812_*.sql`
- `20260104152902_*.sql`
- `20260123084021_*.sql`
- `20260123_hardening_fixes.sql`

### Step 4: Set Up Storage Buckets

1. Go to Supabase dashboard → Storage
2. Create bucket `avatars`:
   - Visibility: Public
   - File size limit: 10 MB
3. Create bucket `startup-media`:
   - Visibility: Public
   - File size limit: 50 MB

### Step 5: Verify RLS Policies

1. Go to Authentication → Policies
2. Confirm RLS is ENABLED for all tables:
   - profiles
   - startups
   - startup_interests
   - matches
   - conversations
   - messages
   - notifications
   - endorsements
   - pitch_reports

**Check**: Each table should show a lock icon 🔒

---

## Environment Configuration

### Local Development (.env.local)

Create `.env.local` in project root (NOT in git):

```bash
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<dev-key>
VITE_SUPABASE_PROJECT_ID=<dev-project-id>
```

Never commit this file. Use `.env.example` as reference.

### Build Configuration

The `vercel.json` file contains:
- Build command: `npm run build`
- Output directory: `dist/`
- Node version: 20.x
- Install command: `npm install`

### Production Environment Vars

Set in Vercel:
- **VITE_SUPABASE_URL**: Production Supabase URL
- **VITE_SUPABASE_PUBLISHABLE_KEY**: Production public key
- **VITE_SUPABASE_PROJECT_ID**: Production project ID

---

## Verification Checklist

### Frontend

- [ ] Build succeeds: `npm run build`
- [ ] Dist folder created with index.html
- [ ] No environment secrets in code
- [ ] All routes work in production
- [ ] Error boundaries present

### Backend

- [ ] All 12 migrations applied successfully
- [ ] RLS policies enabled on all tables
- [ ] Storage buckets created and accessible
- [ ] Real-time subscriptions configured

### Security

- [ ] No console.log in production code
- [ ] Error messages are user-friendly
- [ ] Supabase keys are PUBLIC only
- [ ] No hardcoded secrets in repository
- [ ] CORS properly configured in Supabase

### Functionality

- [ ] User registration works
- [ ] Profile creation works
- [ ] Founder can create startup
- [ ] Talent can view matches
- [ ] Investor can submit pitch report
- [ ] Messaging sends and receives
- [ ] Notifications fire correctly

---

## Troubleshooting

### Build Fails on Vercel

**Error**: `VITE_SUPABASE_URL not found`

**Solution**: Add environment variables in Vercel Project Settings

### White Screen After Deployment

**Error**: Page loads but shows nothing

**Solution**:
1. Check browser console for errors
2. Verify env variables are set in Vercel
3. Check Supabase status at status.supabase.com

### Can't Connect to Supabase

**Error**: Network error when logging in

**Solution**:
1. Verify VITE_SUPABASE_URL is correct
2. Check Supabase project is running
3. Verify RLS policies aren't blocking

### RLS Policy Errors

**Error**: "permission denied" in database operations

**Solution**:
1. Check user is authenticated
2. Verify RLS policy for the operation
3. Run migrations in correct order
4. Reset RLS: Auth → Policies → Enable/Disable toggle

### Storage Bucket Errors

**Error**: Can't upload avatar or media

**Solution**:
1. Verify buckets exist in Storage
2. Check bucket is set to Public
3. Verify file size limits
4. Check bucket names match code (`avatars`, `startup-media`)

---

## Monitoring & Maintenance

### Supabase Monitoring

1. Go to Project Dashboard
2. Monitor:
   - Query performance
   - Storage usage
   - Concurrent connections
   - Error logs

### Vercel Monitoring

1. Go to Deployments tab
2. Check build logs
3. Monitor response times
4. Review error tracking

### Best Practices

- **Backups**: Enable Supabase daily backups
- **Logs**: Check Vercel build logs regularly
- **Performance**: Monitor database query times
- **Security**: Review RLS policies quarterly
- **Updates**: Keep dependencies current

---

## Rollback Procedure

If deployment fails:

1. **Vercel Rollback**:
   - Go to Deployments
   - Find previous working deployment
   - Click "Redeploy"

2. **Supabase Rollback**:
   - Backups available under Settings → Backups
   - Contact Supabase support for restoration

---

## Support

For deployment issues:
- Check Vercel status: https://www.vercel-status.com
- Check Supabase status: https://status.supabase.com
- Review Vercel docs: https://vercel.com/docs
- Review Supabase docs: https://supabase.com/docs

---

**Last Updated**: January 23, 2026
**Hardening Score**: 8.5/10
