-- ========================================
-- Check and Fix User Role for Admin Access
-- ========================================

-- Step 1: Find your user ID and current role
SELECT 
  u.id as user_id,
  u.email,
  u.email_confirmed_at IS NOT NULL as is_confirmed,
  p.full_name,
  ur.role as current_role,
  CASE 
    WHEN ur.role IS NULL THEN '❌ NO ROLE ASSIGNED'
    WHEN ur.role = 'admin' THEN '✅ Admin Role'
    ELSE '⚠️ Role: ' || ur.role
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'husnainakram336@gmail.com';

-- Step 2: Delete existing role (if any) and assign admin
-- Replace 'husnainakram336@gmail.com' with your email if different
DELETE FROM public.user_roles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'husnainakram336@gmail.com');

INSERT INTO public.user_roles (user_id, role, created_at)
SELECT 
  id,
  'admin'::app_role,
  NOW()
FROM auth.users 
WHERE email = 'husnainakram336@gmail.com';

-- Step 3: Verify admin role is assigned
SELECT 
  u.email,
  ur.role,
  CASE 
    WHEN ur.role = 'admin' THEN '✅ ADMIN ACCESS GRANTED'
    ELSE '❌ WRONG ROLE'
  END as verification
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'husnainakram336@gmail.com';

-- Step 4: Test the has_role function
SELECT 
  u.email,
  public.has_role(u.id, 'admin') as has_admin_role,
  public.is_staff(u.id) as is_staff
FROM auth.users u
WHERE u.email = 'husnainakram336@gmail.com';

-- Step 5: Check if profile exists
SELECT 
  u.email,
  CASE WHEN p.id IS NOT NULL THEN '✅ Profile Exists' ELSE '❌ No Profile' END as profile_status,
  p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'husnainakram336@gmail.com';

-- Step 6: Create profile if missing
INSERT INTO public.profiles (id, full_name, created_at, updated_at)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', 'Admin User'),
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email = 'husnainakram336@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = u.id);

-- Step 7: Final complete check
SELECT 
  '=== FINAL STATUS ===' as section,
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  p.full_name,
  ur.role,
  public.has_role(u.id, 'admin') as can_access_admin,
  public.is_staff(u.id) as is_staff_member
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'husnainakram336@gmail.com';
