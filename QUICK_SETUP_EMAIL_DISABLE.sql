-- Quick Setup: Disable Email Verification
-- Run this in Supabase SQL Editor after setting up your database

-- 1. Auto-confirm all existing users (if any)
UPDATE auth.users 
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  confirmed_at = COALESCE(confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- 2. Verify users are confirmed
SELECT 
  email,
  email_confirmed_at IS NOT NULL as is_confirmed,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- IMPORTANT: Also disable email confirmation in Supabase Dashboard:
-- Authentication → Providers → Email → Toggle "Confirm email" OFF

