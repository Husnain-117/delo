# Admin Role Setup Guide

## Current Status

✅ **Frontend**: Admin option added to signup dropdown
✅ **Backend**: AuthContext accepts and stores admin role
✅ **Database Policy**: Updated to allow admin self-assignment (DEV MODE)

---

## Step-by-Step: Sign Up as Admin

### 1. Update Database Policy (REQUIRED)

Go to Supabase Dashboard → SQL Editor and run:

```sql
-- Drop the old policy if it exists
DROP POLICY IF EXISTS "Self-assign limited roles on signup" ON public.user_roles;

-- Create new policy allowing admin self-assignment
CREATE POLICY "Self-assign limited roles on signup"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND role IN ('customer','waiter','chef','manager','admin')
  );
```

### 2. Sign Up with Admin Role

1. Go to your app: http://localhost:8080/auth
2. Click **Sign Up** tab
3. Fill in:
   - **Full Name**: Your name
   - **Role**: Select **Admin (Dev Only)**
   - **Email**: your-email@example.com
   - **Password**: minimum 6 characters
4. Click **Create Account**
5. Switch to **Login** tab
6. Sign in with your credentials

### 3. Verify Admin Access

After signing in:
1. You should see the **Role Selection** page
2. **Admin Panel** card should show **"Open Panel"** button (not "Access Restricted")
3. Click **Open Panel** to access admin dashboard

---

## Troubleshooting

### Problem: "Access Restricted" on Admin Panel

**Check 1: Verify role in database**
```sql
-- Replace with your email
SELECT u.email, ur.role 
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'your-email@example.com';
```

**Check 2: Manually assign admin role**
```sql
-- Get your user ID first
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Then insert admin role (replace YOUR_USER_ID)
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_ID', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

### Problem: Policy Error on Signup

If you get a policy violation error:
1. Ensure you ran the updated policy SQL above
2. Check existing policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'user_roles';
   ```
3. Drop all policies and recreate:
   ```sql
   DROP POLICY IF EXISTS "Self-assign limited roles on signup" ON public.user_roles;
   DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
   DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
   
   -- Recreate
   CREATE POLICY "Self-assign limited roles on signup"
     ON public.user_roles FOR INSERT
     WITH CHECK (auth.uid() = user_id AND role IN ('customer','waiter','chef','manager','admin'));
   
   CREATE POLICY "Users can view their own roles"
     ON public.user_roles FOR SELECT
     USING (auth.uid() = user_id);
   
   CREATE POLICY "Admins can manage roles"
     ON public.user_roles FOR ALL
     USING (public.has_role(auth.uid(), 'admin'));
   ```

### Problem: Can't see any data in Admin Dashboard

**Check RLS policies allow admin access:**
```sql
-- Verify has_role function works
SELECT public.has_role(auth.uid(), 'admin');
-- Should return true

-- Check if you can read tables
SELECT * FROM public.tables LIMIT 1;
SELECT * FROM public.orders LIMIT 1;
```

If queries fail, ensure RLS policies exist (they should from main migration).

---

## Alternative: Manual Admin Assignment (Production Method)

For production, you should NOT allow self-assignment of admin. Instead:

1. Sign up as **Customer**
2. Have an existing admin run:
   ```sql
   -- Get user ID
   SELECT id, email FROM auth.users WHERE email = 'new-admin@example.com';
   
   -- Assign admin role
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('USER_ID_HERE', 'admin');
   ```

3. Or create an admin management UI in the Admin Panel (Staff Management page)

---

## Security Note

⚠️ **IMPORTANT**: Before deploying to production, change the policy back to:

```sql
DROP POLICY IF EXISTS "Self-assign limited roles on signup" ON public.user_roles;

CREATE POLICY "Self-assign limited roles on signup"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND role IN ('customer','waiter','chef')  -- NO admin/manager
  );
```

Then use the Staff Management page or SQL to assign admin roles manually.
