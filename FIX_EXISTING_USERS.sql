-- ========================================
-- Fix Existing Users - Email Confirmation
-- ========================================

-- Step 1: Check current user status
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ Not Confirmed'
    ELSE '✅ Confirmed'
  END as status
FROM auth.users
ORDER BY created_at DESC;

-- Step 2: Manually confirm all unconfirmed users (DEVELOPMENT ONLY)
-- WARNING: Only run this in development environment
UPDATE auth.users 
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  confirmed_at = COALESCE(confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- Step 3: Verify all users are now confirmed
SELECT 
  email,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ Not Confirmed'
    ELSE '✅ Confirmed'
  END as status
FROM auth.users;

-- Step 4: Check if users have profiles
SELECT 
  u.email,
  CASE WHEN p.id IS NOT NULL THEN '✅ Has Profile' ELSE '❌ No Profile' END as profile_status,
  CASE WHEN ur.id IS NOT NULL THEN '✅ Has Role' ELSE '❌ No Role' END as role_status,
  ur.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at DESC;

-- Step 5: Fix missing profiles (if any)
-- This will create profiles for users who signed up but don't have one
INSERT INTO public.profiles (id, full_name, created_at, updated_at)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', 'User'),
  NOW(),
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 6: Fix missing roles (assign customer by default)
INSERT INTO public.user_roles (user_id, role, created_at)
SELECT 
  u.id,
  'customer'::app_role,
  NOW()
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 7: Final verification - show complete user status
SELECT 
  u.email,
  u.email_confirmed_at IS NOT NULL as is_confirmed,
  p.full_name,
  ur.role,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at DESC;
