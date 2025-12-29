-- Verification script to check if the migration was successful

-- 1. Check if 'investor' role exists in the enum
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'user_role' AND e.enumlabel = 'investor'
  ) THEN
    RAISE NOTICE '✓ investor role exists in user_role enum';
  ELSE
    RAISE WARNING '✗ investor role missing from user_role enum';
  END IF;
END $$;

-- 2. Check if investor_interests table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'investor_interests') THEN
    RAISE NOTICE '✓ investor_interests table exists';
  ELSE
    RAISE WARNING '✗ investor_interests table missing!';
  END IF;
END $$;

-- 3. Check if investor_interests table has the correct structure
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'investor_interests' AND column_name = 'investor_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'investor_interests' AND column_name = 'startup_id'
  ) THEN
    RAISE NOTICE '✓ investor_interests table has correct structure';
  ELSE
    RAISE WARNING '✗ investor_interests table structure is incorrect';
  END IF;
END $$;

-- 4. Check if RLS is enabled on investor_interests table
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'investor_interests' AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✓ RLS enabled on investor_interests table';
  ELSE
    RAISE WARNING '✗ RLS not enabled on investor_interests table';
  END IF;
END $$;

-- 5. Check if the handle_new_user function exists and has the correct structure
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
  ) THEN
    RAISE NOTICE '✓ handle_new_user function exists';
  ELSE
    RAISE WARNING '✗ handle_new_user function missing';
  END IF;
END $$;

-- 6. Check if the on_auth_user_created trigger exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
  ) THEN
    RAISE NOTICE '✓ on_auth_user_created trigger exists';
  ELSE
    RAISE WARNING '✗ on_auth_user_created trigger missing';
  END IF;
END $$;

-- 7. Check if investor_interest_created_trigger exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'investor_interest_created_trigger'
  ) THEN
    RAISE NOTICE '✓ investor_interest_created_trigger exists';
  ELSE
    RAISE WARNING '✗ investor_interest_created_trigger missing';
  END IF;
END $$;

-- 8. Check if the on_investor_interest_created function exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'on_investor_interest_created'
  ) THEN
    RAISE NOTICE '✓ on_investor_interest_created function exists';
  ELSE
    RAISE WARNING '✗ on_investor_interest_created function missing';
  END IF;
END $$;

-- 9. Check if the required indexes exist
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'investor_interests' AND indexname = 'idx_investor_interests_investor_id'
  ) THEN
    RAISE NOTICE '✓ idx_investor_interests_investor_id index exists';
  ELSE
    RAISE WARNING '✗ idx_investor_interests_investor_id index missing';
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'investor_interests' AND indexname = 'idx_investor_interests_startup_id'
  ) THEN
    RAISE NOTICE '✓ idx_investor_interests_startup_id index exists';
  ELSE
    RAISE WARNING '✗ idx_investor_interests_startup_id index missing';
  END IF;
END $$;

-- 10. List all user_role enum values
DO $$ 
BEGIN
  RAISE NOTICE 'Current user_role enum values: %', (
    SELECT array_agg(enumlabel ORDER BY enumsortorder) 
    FROM pg_enum 
    WHERE enumtypid = 'user_role'::regtype
  );
END $$;

RAISE NOTICE 'Verification complete!';