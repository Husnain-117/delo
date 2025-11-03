-- ========================================
-- IMMEDIATE FIX: Allow Role Self-Assignment
-- Run this RIGHT NOW in Supabase SQL Editor
-- ========================================

-- Step 1: Check current policies
SELECT 
  policyname,
  cmd,
  qual as using_clause,
  with_check
FROM pg_policies 
WHERE tablename = 'user_roles';

-- Step 2: DROP ALL existing policies on user_roles
DROP POLICY IF EXISTS "Self-assign limited roles on signup" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Step 3: Create NEW policies that WILL WORK

-- Allow users to INSERT their own role during signup (ANY ROLE for dev)
CREATE POLICY "Allow self role assignment"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow admins to manage all roles
CREATE POLICY "Admins manage all roles"
  ON public.user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Step 4: Verify policies are created
SELECT 
  '=== NEW POLICIES ===' as info,
  policyname,
  cmd as command
FROM pg_policies 
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- Step 5: Test the policy by inserting a test role
-- This should work now
DO $$
DECLARE
  test_user_id uuid;
BEGIN
  -- Get your user ID
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'husnainakram336@gmail.com';
  
  IF test_user_id IS NOT NULL THEN
    -- Delete existing role
    DELETE FROM public.user_roles WHERE user_id = test_user_id;
    
    -- Insert admin role (this should work now)
    INSERT INTO public.user_roles (user_id, role, created_at)
    VALUES (test_user_id, 'admin'::app_role, NOW());
    
    RAISE NOTICE '✅ Successfully assigned admin role to your account';
  ELSE
    RAISE NOTICE '❌ User not found';
  END IF;
END $$;

-- Step 6: Verify your account has admin role
SELECT 
  u.email,
  ur.role,
  CASE WHEN ur.role = 'admin' THEN '✅ ADMIN ROLE ASSIGNED' ELSE '❌ WRONG ROLE' END as status
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'husnainakram336@gmail.com';

-- Step 7: Show what the policy will allow
SELECT 
  '=== POLICY TEST ===' as info,
  'The new policy allows ANY authenticated user to insert their own role' as explanation,
  'This is OK for development, but restrict it for production' as warning;
