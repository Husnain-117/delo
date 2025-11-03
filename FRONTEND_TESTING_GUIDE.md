# Frontend Testing Guide - Admin Signup

## What I Fixed

### 1. Enhanced Error Handling in AuthContext
- ✅ Added detailed console logging for each step
- ✅ Catches and displays specific errors for profile/role creation
- ✅ Shows clear error messages if role assignment fails
- ✅ Logs success/failure for debugging

### 2. Better User Feedback
- Shows which role was assigned in success message
- Warns if role assignment fails but account was created
- Provides actionable error messages

---

## How to Test the Fixed Signup

### Step 1: Ensure Database is Ready

Run `COMPLETE_DB_SETUP.sql` in Supabase SQL Editor. This will:
- Update the policy to allow admin self-assignment
- Fix your existing account (assign admin role)
- Verify everything is configured correctly

### Step 2: Test with Existing Account

1. **Open your app** in browser
2. **Open Developer Tools** (F12)
3. **Go to Console tab**
4. **Sign out** if logged in
5. **Sign in** with: husnainakram336@gmail.com
6. **Check console** - should see:
   ```
   🔍 Current User Role: admin
   👤 Current User: husnainakram336@gmail.com
   ```
7. **Check page** - should show "Current Role: admin"
8. **Admin Panel** should show "Open Panel" button

### Step 3: Test New Signup (Optional)

If you want to test the complete signup flow:

1. **Sign out**
2. **Go to Sign Up tab**
3. **Open Console** (F12)
4. **Fill in form**:
   - Full Name: Test User
   - Role: **Admin (Dev Only)**
   - Email: test@example.com
   - Password: test123
5. **Click Create Account**
6. **Watch Console** - you should see:
   ```
   🔧 Creating profile and role for user: [user-id]
   🎭 Selected role: admin
   ✅ Profile created successfully
   🎯 Normalized role: admin
   ✅ Role assigned successfully: admin
   ```
7. **If role fails**, you'll see:
   ```
   ❌ Role insertion failed: [error details]
   ```
   And a toast notification explaining the error

### Step 4: Verify in Database

After signup, run this in Supabase:
```sql
SELECT 
  u.email,
  ur.role,
  p.full_name
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'test@example.com';
```

Should show:
- `role: admin`
- `full_name: Test User`

---

## Common Issues & Solutions

### Issue 1: Console shows "❌ Role insertion failed"

**Error message will show the specific reason**. Common causes:

1. **Policy violation**: 
   - Error: "new row violates row-level security policy"
   - Fix: Run `COMPLETE_DB_SETUP.sql` to update policy

2. **Invalid role**:
   - Error: "invalid input value for enum app_role"
   - Fix: Check that 'admin' is in the enum (should be from main migration)

3. **Duplicate role**:
   - Error: "duplicate key value violates unique constraint"
   - Fix: User already has this role, just sign in

### Issue 2: Profile creation fails

**Error**: "duplicate key value violates unique constraint"
- This means profile already exists
- Not critical - role assignment should still work

### Issue 3: Role shows as "customer" instead of "admin"

**Cause**: The role insert silently failed or was blocked

**Fix**: 
1. Check console for error messages
2. Run the manual SQL to assign admin role
3. Sign out and sign in again

---

## Debug Checklist

When testing signup, verify these console logs appear:

- [ ] `🔧 Creating profile and role for user: [id]`
- [ ] `🎭 Selected role: admin`
- [ ] `✅ Profile created successfully` (or warning if failed)
- [ ] `🎯 Normalized role: admin`
- [ ] `✅ Role assigned successfully: admin` (this is the critical one)

If you see `❌ Role insertion failed`, the error message will tell you exactly what went wrong.

---

## Production Considerations

Before deploying to production:

1. **Change the policy** to NOT allow admin self-assignment:
   ```sql
   DROP POLICY IF EXISTS "Self-assign limited roles on signup" ON public.user_roles;
   
   CREATE POLICY "Self-assign limited roles on signup"
     ON public.user_roles FOR INSERT
     WITH CHECK (
       auth.uid() = user_id
       AND role IN ('customer','waiter','chef')  -- NO admin/manager
     );
   ```

2. **Remove admin option** from signup dropdown in `Auth.tsx`

3. **Create admin management UI** in Admin Panel to assign roles

4. **Enable email confirmation** in Supabase settings

---

## Quick Commands

### Fix existing user (your account):
```sql
DELETE FROM public.user_roles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'husnainakram336@gmail.com');
INSERT INTO public.user_roles (user_id, role) SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'husnainakram336@gmail.com';
```

### Check user status:
```sql
SELECT u.email, ur.role, p.full_name FROM auth.users u LEFT JOIN user_roles ur ON u.id=ur.user_id LEFT JOIN profiles p ON u.id=p.id WHERE u.email='husnainakram336@gmail.com';
```

### Delete test user:
```sql
DELETE FROM auth.users WHERE email = 'test@example.com';
```
