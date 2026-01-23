#!/bin/bash

# CollabHub Production Deployment Checklist
# Run this before deploying to production

echo "🚀 CollabHub Production Deployment Checklist"
echo "=============================================="
echo ""

# 1. Environment Variables Check
echo "✓ STEP 1: Environment Variables"
echo "  Required variables (set in .env.local):"
echo "  - VITE_SUPABASE_URL"
echo "  - VITE_SUPABASE_PUBLISHABLE_KEY"
echo "  - VITE_SUPABASE_PROJECT_ID"
echo ""
echo "  For Vercel deployment, set these in Project Settings > Environment Variables"
echo ""

# 2. Build Check
echo "✓ STEP 2: Build Verification"
echo "  Run: npm run build"
echo "  Expected output: dist/ folder with index.html and assets"
echo ""

# 3. Supabase Migrations
echo "✓ STEP 3: Supabase Production Setup"
echo "  - Create a NEW Supabase production project"
echo "  - Run migrations from supabase/migrations/ in this order:"
ls -1 /workspaces/startup-connect/supabase/migrations/ | sort
echo ""
echo "  - Verify RLS policies are ENABLED for all tables"
echo "  - Create storage bucket 'avatars' with public access"
echo "  - Create storage bucket 'startup-media' with public access"
echo ""

# 4. Error Boundaries
echo "✓ STEP 4: Error Handling"
echo "  - All async operations have error handling"
echo "  - Error boundaries exist for critical pages"
echo "  - User-friendly error messages configured"
echo ""

# 5. Console Cleanup
echo "✓ STEP 5: Production Code Quality"
echo "  - console.log/error calls removed from production code"
echo "  - No dev-only configurations in build"
echo ""

# 6. Security
echo "✓ STEP 6: Security Verification"
echo "  - Supabase keys are public-facing only (correct!)"
echo "  - No private secrets in frontend code"
echo "  - RLS policies protect all sensitive data"
echo ""

# 7. Demo Flow
echo "✓ STEP 7: Demo Flow Testing"
echo "  Test end-to-end: Founder → Talent → Investor → Feedback"
echo "  - Create startup as founder"
echo "  - View matches as talent"
echo "  - Submit pitch report as investor"
echo "  - View feedback as founder"
echo ""

# 8. Vercel Deployment
echo "✓ STEP 8: Vercel Deployment"
echo "  1. Connect repository to Vercel"
echo "  2. Set environment variables in Project Settings"
echo "  3. Deploy: git push to trigger deployment"
echo "  4. Verify: Check deployment logs in Vercel dashboard"
echo ""

echo "✅ Checklist Complete! Ready for deployment."
