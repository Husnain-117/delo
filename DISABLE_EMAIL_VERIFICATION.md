# Disable Email Verification - Setup Guide

## Important Note
Email verification has been **disabled in the code** for easier development. However, you must also disable it in your Supabase Dashboard settings.

## Steps to Disable Email Verification in Supabase

### Step-by-Step Instructions:

1. **Go to your Supabase Dashboard**
   - You're currently in: Authentication → Configuration → Emails (this is for editing email templates)

2. **Navigate to Email Provider Settings:**
   - In the left sidebar, under **"CONFIGURATION"**, click on **"Sign In / Providers"**
   - OR click on **"Providers"** directly if visible

3. **Find Email Provider:**
   - Scroll to find the **"Email"** provider section
   - You should see settings like:
     - ✅ Enable email provider (should be ON)
     - ✅ Enable email signup (should be ON)
     - ❌ **Confirm email** ← **THIS IS WHAT YOU NEED TO TOGGLE OFF**

4. **Disable Email Confirmation:**
   - Find the toggle/switch for **"Confirm email"** or **"Enable email confirmation"**
   - **Toggle it OFF** (switch should be gray/disabled)
   - Click **"Save"** or **"Update"** button

5. **Verify Settings:**
   - After saving, your settings should look like:
     - ✅ Enable email provider: **ON**
     - ✅ Enable email signup: **ON**
     - ❌ Confirm email: **OFF** ← This is what you want!

### Option 2: SQL Query (For Existing Users)

If you have users who are already waiting for email confirmation:

```sql
-- Confirm all existing users (DEVELOPMENT ONLY)
UPDATE auth.users 
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  confirmed_at = COALESCE(confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;
```

## Current Flow (Email Verification Disabled)

1. **Sign Up** → User creates account
2. **Profile Completion** → User selects role immediately
3. **Role Panel** → User redirected to their panel

**No email verification step required.**

## Re-enabling Email Verification Later

When you're ready to enable email verification:

1. Go to Supabase Dashboard → Authentication → Providers → Email
2. Toggle **"Confirm email"** ON
3. Update the code to add email verification checks
4. Add back the EmailVerification route in App.tsx
5. Update AuthContext signUp to remove `emailRedirectTo: undefined`

---

**Status:** ✅ Email verification is currently **DISABLED** in code

