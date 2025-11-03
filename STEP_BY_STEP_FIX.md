# STEP BY STEP FIX - Role Assignment Issue

## The Problem
When you sign up, the role is NOT being saved to the database because the RLS (Row Level Security) policy is blocking it.

---

## THE FIX (Do this RIGHT NOW)

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/dxhrfveksxsmswdrrblh
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Copy and Run QUICK_FIX.sql
1. Open the file: `QUICK_FIX.sql`
2. **Copy the ENTIRE contents**
3. **Paste into Supabase SQL Editor**
4. Click **Run** (or press Ctrl+Enter)

### Step 3: Check the Result
You should see output like:
```
email: husnainakram336@gmail.com
role: admin
status: ✅ SUCCESS - Admin role assigned
```

### Step 4: Test Signup Again
1. **Go to your app**
2. **Sign out**
3. **Sign up with a NEW email** (e.g., test2@example.com)
4. **Select Admin role**
5. **Open Console (F12)** and watch for:
   ```
   🔧 Creating profile and role for user: [id]
   🎭 Selected role: admin
   ✅ Profile created successfully
   🎯 Normalized role: admin
   ✅ Role assigned successfully: admin  ← THIS SHOULD APPEAR NOW
   ```

### Step 5: Sign In with Your Original Account
1. Sign in with: husnainakram336@gmail.com
2. You should see **Admin Panel** with "Open Panel" button
3. Click it to access admin dashboard

---

## What the Fix Does

### 1. Removes Restrictive Policies
The old policy only allowed `customer`, `waiter`, `chef` - it blocked `admin` and `manager`.

### 2. Creates New Permissive Policy
New policy allows ANY authenticated user to insert their own role (good for development).

### 3. Fixes Your Existing Account
Manually assigns admin role to your account so you can access the admin panel immediately.

---

## Verify It's Working

### Check in Database:
```sql
SELECT u.email, ur.role 
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at DESC;
```

Should show all users with their assigned roles.

### Check in Console:
When you sign up, you should see:
- ✅ `✅ Role assigned successfully: admin`

NOT:
- ❌ `❌ Role insertion failed`

---

## If It STILL Doesn't Work

### Check Console Error
After signup, check browser console for:
```
❌ Role insertion failed: [error message]
```

Common errors:

1. **"new row violates row-level security policy"**
   - The QUICK_FIX.sql didn't run properly
   - Re-run it and check for SQL errors

2. **"invalid input value for enum app_role"**
   - The role value is not in the enum
   - Check that 'admin' exists in app_role enum:
     ```sql
     SELECT unnest(enum_range(NULL::app_role));
     ```

3. **"duplicate key value violates unique constraint"**
   - User already has this role
   - Just sign in, don't sign up again

---

## For Production

Before going to production, change the policy to restrict admin:

```sql
DROP POLICY IF EXISTS "Allow self role assignment" ON public.user_roles;

CREATE POLICY "Allow limited self role assignment"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND role IN ('customer', 'waiter', 'chef')  -- NO admin/manager
  );
```

Then use the Admin Panel to assign admin/manager roles manually.

---

## Quick Commands Reference

### Fix existing user:
```sql
DELETE FROM user_roles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL');
INSERT INTO user_roles (user_id, role) SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'YOUR_EMAIL';
```

### Check all users and roles:
```sql
SELECT u.email, ur.role FROM auth.users u LEFT JOIN user_roles ur ON u.id=ur.user_id;
```

### Delete test user:
```sql
DELETE FROM auth.users WHERE email = 'test@example.com';
```
