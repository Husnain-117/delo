# How to Disable Email Confirmation in Supabase - Visual Guide

## Current Location vs Required Location

### ❌ Where You Are Now (WRONG):
**Authentication** → **Configuration** → **Emails**
- This only lets you edit email templates
- Cannot disable confirmation here

### ✅ Where You Need to Go (CORRECT):
**Authentication** → **Providers** → **Email** (or **Sign In / Providers** → **Email**)

---

## Detailed Steps:

### Step 1: Navigate to Providers
1. Look at the **left sidebar** in Supabase Dashboard
2. Under **"CONFIGURATION"**, you'll see:
   - Policies
   - **Sign In / Providers** ← **CLICK THIS**
   - Sessions
   - Rate Limits
   - Emails (where you are now)

### Step 2: Find Email Provider Settings
1. After clicking **"Sign In / Providers"**, you'll see a list of providers
2. Look for **"Email"** provider section
3. You should see something like:

```
📧 Email Provider
┌─────────────────────────────────────┐
│ [✓] Enable email provider          │
│ [✓] Enable email signup             │
│ [ ] Confirm email        ← TOGGLE THIS OFF │
│                                      │
│ [Save] [Cancel]                     │
└─────────────────────────────────────┘
```

### Step 3: Disable Confirmation
1. Find the checkbox/toggle for **"Confirm email"**
2. **Uncheck it** or **toggle it OFF**
3. Click **"Save"** or **"Update"**

### Step 4: Alternative Path
If you don't see "Sign In / Providers", try:
1. **Authentication** → **Providers** (directly)
2. Or **Authentication** → **Settings** → **Email Provider**

---

## What It Should Look Like After:

```
Email Provider Settings:
✅ Enable email provider: ON
✅ Enable email signup: ON
❌ Confirm email: OFF  ← This should be OFF
```

---

## Quick Checklist:

- [ ] Navigated to: Authentication → Sign In / Providers (or Providers)
- [ ] Found Email provider settings
- [ ] Found "Confirm email" toggle/checkbox
- [ ] Toggled it OFF
- [ ] Clicked Save
- [ ] Verified it's now OFF

---

## Still Can't Find It?

Try these alternative paths:
1. **Authentication** → **Providers** → **Email** → Settings
2. **Authentication** → **Settings** → Scroll down to Email settings
3. **Project Settings** → **Authentication** → **Email Provider**

The exact location may vary slightly based on your Supabase dashboard version.

