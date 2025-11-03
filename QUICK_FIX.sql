-- ========================================
-- QUICK FIX - Copy and paste this ENTIRE script into Supabase SQL Editor
-- This will fix the role assignment issue immediately
-- ========================================

-- Remove restrictive policies
DROP POLICY IF EXISTS "Self-assign limited roles on signup" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Create permissive policy for development
CREATE POLICY "Allow self role assignment"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all roles"
  ON public.user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Fix your existing account
DELETE FROM public.user_roles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'husnainakram336@gmail.com');

INSERT INTO public.user_roles (user_id, role, created_at)
SELECT id, 'admin'::app_role, NOW()
FROM auth.users 
WHERE email = 'husnainakram336@gmail.com';

-- Verify it worked
SELECT 
  u.email,
  ur.role,
  CASE 
    WHEN ur.role = 'admin' THEN '✅ SUCCESS - Admin role assigned'
    WHEN ur.role IS NULL THEN '❌ FAILED - No role assigned'
    ELSE '⚠️ WRONG ROLE - ' || ur.role
  END as status
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'husnainakram336@gmail.com';
