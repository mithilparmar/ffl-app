# User Registration Guide - Invite Code System

## Overview
The FFL (Fantasy Football League) application uses an **invite-code based registration system** to control access and ensure only approved managers can create accounts.

## How It Works

### Step 1: Admin Creates Invite Codes
1. Log in as **admin** (admin@ffl.com / admin123)
2. Navigate to **Admin → Invites** in the navigation menu
3. Enter the manager's name and email
4. Click **Create Invite**
5. An invite code will be generated (32-character hex code)
6. Click the **Copy** button to copy the code to clipboard
7. Share the code with the manager via email or chat

### Step 2: Manager Signs Up Using Invite Code
1. Go to the application signup page: `/signup`
2. Or click the **"Sign up with invite code"** link on the login page
3. Enter the invite code you received
4. Fill in your name, email, and password (min 6 characters)
5. Confirm your password
6. Click **Create Account**
7. You'll be redirected to the login page
8. Log in with your new credentials

### Step 3: Manager Logs In and Plays
1. Go to `/login`
2. Enter your email and password
3. You'll be redirected to the **Dashboard**
4. Submit your weekly lineups and view your performance

## Key Features

✅ **Invite Code Tracking**
- Each invite code is unique and can only be used once
- Admin can see which invites are pending and which have been used
- Unused invites can be deleted to prevent waste

✅ **Security**
- Passwords are hashed using bcryptjs
- Invite codes are validated server-side
- Email addresses must be unique per account

✅ **Admin Controls**
- View all pending invites at a glance
- See which managers have already signed up
- Delete unused invites
- Generate new invites as needed

## Files Involved

### Frontend Pages
- **[app/signup/page.tsx](app/signup/page.tsx)** - Public signup form where users enter invite code and create password
- **[app/(authenticated)/admin/invites/page.tsx](app/(authenticated)/admin/invites/page.tsx)** - Admin dashboard for managing invites
- **[app/login/page.tsx](app/login/page.tsx)** - Updated with link to signup page

### Backend APIs
- **[app/api/auth/signup/route.ts](app/api/auth/signup/route.ts)** - POST endpoint to handle account creation
- **[app/api/admin/invite-codes/route.ts](app/api/admin/invite-codes/route.ts)** - GET/POST/DELETE endpoints for invite management

### Database Schema
- **[prisma/schema.prisma](prisma/schema.prisma)** - Updated User model with:
  - `inviteCode`: Unique invite code for account creation
  - `inviteUsed`: Boolean tracking if code has been used

### Utilities
- **[lib/use-copy-clipboard.ts](lib/use-copy-clipboard.ts)** - Hook for copying invite codes to clipboard

## Testing the System

### As Admin:
1. Login with admin@ffl.com / admin123
2. Go to Admin → Invites
3. Create an invite for a test manager
4. Copy the invite code

### As New Manager:
1. Log out or use incognito window
2. Go to /signup
3. Paste the invite code
4. Create account with test credentials
5. Log in and verify you can access the dashboard

## Invite Code Generation
Invite codes are:
- **32 characters** in length
- **Hexadecimal** format (0-9, a-f)
- **Unique** - no duplicates possible
- **Case-sensitive** - users must enter exact code

Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

## Error Handling

If a manager encounters issues during signup:
- **Invalid code**: Code doesn't exist or already used
- **Email already in use**: Email must be unique
- **Password too short**: Password must be at least 6 characters
- **Passwords don't match**: Confirm password must match

## Future Enhancements

Possible improvements to consider:
- Email delivery of invite codes
- Expiration dates for invite codes
- Invite code rate limiting
- Bulk invite generation for multiple managers
- Invite code invalidation on user deletion
