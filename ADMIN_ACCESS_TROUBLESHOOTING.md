# Admin Access Troubleshooting Guide

## Problem: "Access Restricted" on Admin Panel

You're logged in but can't access the Admin Panel. This means the role isn't properly assigned.

---

## Quick Fix (Run These SQL Queries)

### Step 1: Check Current Status
```sql
SELECT 
  u.email,
  ur.role as current_role,
  p.full_name
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'husnainakram336@gmail.com';
```

**Expected Result**: Should show `role: admin`
**If NULL or different**: Continue to Step 2

---

### Step 2: Assign Admin Role
```sql
-- Delete any existing role
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
```

---

### Step 3: Verify Role Assignment
```sql
SELECT 
  u.email,
  ur.role,
  public.has_role(u.id, 'admin') as can_access_admin
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'husnainakram336@gmail.com';
```

**Expected Result**:
- `role: admin`
- `can_access_admin: true`

---

### Step 4: Check Profile Exists
```sql
SELECT 
  u.email,
  p.full_name,
  p.id IS NOT NULL as has_profile
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'husnainakram336@gmail.com';
```

**If `has_profile: false`**, create it:
```sql
INSERT INTO public.profiles (id, full_name, created_at, updated_at)
SELECT 
  id,
  'Admin User',
  NOW(),
  NOW()
FROM auth.users 
WHERE email = 'husnainakram336@gmail.com'
ON CONFLICT (id) DO NOTHING;
```

---

## After Running SQL

### 1. Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for these logs:
   ```
   🔍 Current User Role: admin
   👤 Current User: husnainakram336@gmail.com
   ```

### 2. Check Role Display on Page
- Under your email, you should see: `Current Role: admin`
- If it shows `Loading...` or `customer`, the role wasn't fetched

### 3. Refresh the Page
- After running SQL, **sign out and sign in again**
- Or hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)

---

## Common Issues & Solutions

### Issue 1: Role shows as "customer" instead of "admin"

**Cause**: The signup process defaulted to customer or the role wasn't inserted.

**Fix**: Run Step 2 SQL above to reassign admin role, then sign out and sign in.

---

### Issue 2: Role shows as "Loading..." forever

**Cause**: The `user_roles` table query is failing (possibly RLS policy issue).

**Fix**: Check RLS policies exist:
```sql
SELECT * FROM pg_policies WHERE tablename = 'user_roles';
```

Should have:
- `Users can view their own roles` (SELECT)
- `Self-assign limited roles on signup` (INSERT)
- `Admins can manage roles` (ALL)

If missing, run the main migration again.

---

### Issue 3: Console shows "null" for userRole

**Cause**: The role fetch query in `AuthContext` is failing.

**Fix**: 
1. Check browser console for errors
2. Verify you can query `user_roles` table:
   ```sql
   SELECT * FROM public.user_roles LIMIT 5;
   ```
3. Check RLS policies allow SELECT for authenticated users

---

### Issue 4: "Access Restricted" even after role is correct

**Cause**: The `RoleSelection` page logic checks `userRole` against allowed roles.

**Check**: Look at browser console for:
```
🔍 Current User Role: admin
```

If it shows `admin`, but still restricted, check the code logic in `RoleSelection.tsx`:
```typescript
available: ['admin', 'manager'].includes(userRole || ''),
```

---

## Nuclear Option: Complete Reset

If nothing works, delete the user and start fresh:

```sql
-- Get user ID first
SELECT id FROM auth.users WHERE email = 'husnainakram336@gmail.com';

-- Delete from all tables (replace USER_ID)
DELETE FROM public.user_roles WHERE user_id = 'USER_ID';
DELETE FROM public.profiles WHERE id = 'USER_ID';
DELETE FROM public.customers WHERE user_id = 'USER_ID';

-- Delete from auth (this will cascade)
DELETE FROM auth.users WHERE email = 'husnainakram336@gmail.com';
```

Then:
1. Sign up again
2. Select **Admin** role
3. Immediately run Step 2 SQL to ensure admin role
4. Sign in

---

## Verification Checklist

After fix, verify ALL of these:

- [ ] SQL query shows `role: admin`
- [ ] SQL query shows `can_access_admin: true`
- [ ] Browser console shows `🔍 Current User Role: admin`
- [ ] Page shows `Current Role: admin` under email
- [ ] Admin Panel card shows "Open Panel" button (not "Access Restricted")
- [ ] Clicking "Open Panel" navigates to `/admin` route

---

## Still Not Working?

1. **Copy the output** of this query:
   ```sql
   SELECT 
     u.id,
     u.email,
     u.email_confirmed_at IS NOT NULL as confirmed,
     p.full_name,
     ur.role,
     public.has_role(u.id, 'admin') as has_admin,
     public.is_staff(u.id) as is_staff
   FROM auth.users u
   LEFT JOIN public.profiles p ON u.id = p.id
   LEFT JOIN public.user_roles ur ON u.id = ur.user_id
   WHERE u.email = 'husnainakram336@gmail.com';
   ```

2. **Copy browser console logs** (everything with 🔍 or 👤)

3. **Take screenshot** of the Role Selection page

4. Share all three and I'll help debug further.
