# Quick Start: Invite Code Registration System

## 🎯 What This Does
Managers can't create accounts on their own anymore. You (the admin) generate invite codes and share them with managers. Managers use the code to create their account.

## ⚡ Quick Commands

### Test Locally
```bash
cd /Users/mithilparmar/Projects/FFL/ffl-app
npm run dev
# App opens at http://localhost:3000
```

## 👤 Admin Workflow (30 seconds)

1. **Login**: Go to `/login`
   - Email: `admin@ffl.com`
   - Password: `admin123`

2. **Create Invite**: Click "Admin" → "Invites"
   - Name: `John Manager`
   - Email: `john@example.com`
   - Click "Create Invite"

3. **Share Code**: Click "Copy" button
   - Code appears in clipboard
   - Send to manager via email/Slack

## 👨‍💼 Manager Workflow (1 minute)

1. **Go to Signup**: Visit `/signup`
   - (Or click link on login page)

2. **Fill Form**:
   - Paste invite code
   - Enter name: `John Manager`
   - Enter email: `john@example.com`
   - Create password (min 6 chars)
   - Confirm password

3. **Sign Up**: Click "Create Account"
   - Redirects to login page

4. **Login**: Use new credentials
   - Email: `john@example.com`
   - Password: (whatever they set)

5. **Play**: Build lineups and compete!

## 📍 Key URLs

| Page | URL | Who Can Access |
|------|-----|-----------------|
| Home | `/` | Anyone (redirects to login or dashboard) |
| Login | `/login` | Anyone |
| Signup | `/signup` | Anyone (needs valid code) |
| Dashboard | `/dashboard` | Logged-in managers |
| Invites (Admin) | `/admin/invites` | Admin only |
| Leaderboard | `/leaderboard` | Logged-in managers |

## 🔐 Security Notes

- Invite codes: 32-character random hex strings
- Each code: One-time use only (can't reuse)
- Passwords: Encrypted with bcryptjs
- Sessions: JWT tokens via NextAuth
- Validation: Both client-side AND server-side

## 🧪 Testing with Invite Code

### Create Test Invite
1. Login as admin
2. Go to Admin → Invites
3. Create invite for: `tester@example.com`
4. Copy the code (32 chars like: `a1b2c3d4e5f6...`)

### Test Signup
1. Open new browser tab (or incognito)
2. Go to `/signup`
3. Paste code
4. Fill in: name, email, password
5. Click "Create Account"
6. Should redirect to login ✓

### Verify New Account
1. On login page, enter tester's email
2. Enter password you created
3. Should login successfully ✓
4. Should see dashboard ✓

## 📋 Files to Know

| File | Purpose |
|------|---------|
| `app/signup/page.tsx` | Signup form |
| `app/(authenticated)/admin/invites/page.tsx` | Invite management |
| `app/api/auth/signup/route.ts` | Signup backend |
| `app/api/admin/invite-codes/route.ts` | Invite API |
| `prisma/schema.prisma` | Database schema |
| `auth.ts` | Authentication config |

## ⚠️ Common Issues

| Problem | Solution |
|---------|----------|
| "Invalid invite code" | Code doesn't exist or was already used |
| "Email already in use" | That email is registered to someone else |
| Signup page won't load | Make sure you're at `/signup` (not `/signup/`) |
| Can't copy code | Click the copy button next to the code |
| Forgot admin password | Edit `prisma/seed.ts` or reset database |

## 🚀 Next Features to Consider

- [ ] Email delivery of codes
- [ ] Code expiration (7 days)
- [ ] Password reset for managers
- [ ] Bulk invite generation
- [ ] Invite tracking/analytics

---

**You're all set!** 🎉 Start creating invites and managers will be able to join your league.

For detailed info, see `SIGNUP_GUIDE.md` and `IMPLEMENTATION_SUMMARY.md`
