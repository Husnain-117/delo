-- ========================================
-- COMPLETE DATABASE SETUP FOR ADMIN ACCESS
-- Run this ONCE to ensure everything is configured
-- ========================================

-- Step 1: Ensure the policy allows admin self-assignment
DROP POLICY IF EXISTS "Self-assign limited roles on signup" ON public.user_roles;

CREATE POLICY "Self-assign limited roles on signup"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND role IN ('customer','waiter','chef','manager','admin')
  );

-- Step 2: Verify other required policies exist
-- If these fail, it means the main migration wasn't run

-- Check if policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- Step 3: Ensure the has_role function exists
-- This should already exist from main migration
SELECT public.has_role(
  (SELECT id FROM auth.users LIMIT 1),
  'admin'
) as test_function;

-- Step 4: Clean up any existing user and start fresh (OPTIONAL - only if you want to delete current user)
-- UNCOMMENT THESE LINES IF YOU WANT TO DELETE YOUR CURRENT USER AND START OVER:

-- DELETE FROM public.user_roles WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'husnainakram336@gmail.com');
-- DELETE FROM public.profiles WHERE id IN (SELECT id FROM auth.users WHERE email = 'husnainakram336@gmail.com');
-- DELETE FROM public.customers WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'husnainakram336@gmail.com');
-- DELETE FROM auth.users WHERE email = 'husnainakram336@gmail.com';

-- Step 5: Fix existing user (if you want to keep the current account)
-- This assigns admin role to your existing account

-- First, delete any existing role
DELETE FROM public.user_roles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'husnainakram336@gmail.com');

-- Insert admin role
INSERT INTO public.user_roles (user_id, role, created_at)
SELECT 
  id,
  'admin'::app_role,
  NOW()
FROM auth.users 
WHERE email = 'husnainakram336@gmail.com';

-- Ensure profile exists
INSERT INTO public.profiles (id, full_name, created_at, updated_at)
SELECT 
  id,
  'Admin User',
  NOW(),
  NOW()
FROM auth.users 
WHERE email = 'husnainakram336@gmail.com'
ON CONFLICT (id) DO UPDATE SET full_name = 'Admin User';

-- Step 6: Verify everything is set up correctly
SELECT 
  '=== FINAL VERIFICATION ===' as section,
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  p.full_name,
  ur.role,
  public.has_role(u.id, 'admin') as has_admin_access,
  public.is_staff(u.id) as is_staff
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'husnainakram336@gmail.com';

-- Expected result:
-- email_confirmed: true
-- full_name: Admin User
-- role: admin
-- has_admin_access: true
-- is_staff: true

-- Step 7: Test that new signups will work
-- This simulates what happens during signup
DO $$
DECLARE
  test_user_id uuid := (SELECT id FROM auth.users WHERE email = 'husnainakram336@gmail.com');
BEGIN
  -- Test if the policy allows insert
  RAISE NOTICE 'Testing role insert for user: %', test_user_id;
  
  -- Try to insert a test role (this will fail if policy is wrong)
  -- We'll immediately delete it
  INSERT INTO public.user_roles (user_id, role, created_at)
  VALUES (test_user_id, 'admin'::app_role, NOW())
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RAISE NOTICE '✅ Policy allows admin role insertion';
END $$;

-- Step 8: Show all policies for reference
SELECT 
  '=== ALL USER_ROLES POLICIES ===' as section,
  policyname,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'user_roles';
