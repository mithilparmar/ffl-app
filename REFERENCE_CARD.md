# INVITE CODE SYSTEM - REFERENCE CARD

## 🎯 System Overview

Your NFL Fantasy Football League now uses an **invite-code system** for user registration.

- ✅ Only invited managers can create accounts
- ✅ Each invite code: unique, 32 characters, one-time use
- ✅ Admin controls who gets access
- ✅ Secure password hashing with bcryptjs
- ✅ Seamless integration with existing app

---

## 👤 ADMIN QUICK ACTIONS

### Create an Invite (2 minutes)
```
1. Go to http://localhost:3000/login
   Email: admin@ffl.com
   Password: admin123

2. Click: Admin → Invites

3. Fill form:
   Name: John Manager
   Email: john@example.com

4. Click: Create Invite

5. Click: Copy (copies to clipboard)

6. Share code with manager
   (Email, Slack, text, etc.)
```

### View All Invites
- **Pending**: Not yet used
- **Active**: Manager already signed up
- **Action**: Delete unused codes to keep clean

### Delete an Invite
- Click trash icon next to invite
- Confirm deletion
- Cannot delete used invites (safety)

---

## 👨‍💼 MANAGER QUICK ACTIONS

### Sign Up (1 minute)
```
1. Get invite code from admin

2. Go to http://localhost:3000/signup
   OR click link on login page

3. Fill form:
   Invite Code: (paste code here)
   Name: John Manager
   Email: john@example.com
   Password: (6+ characters)
   Confirm: (must match password)

4. Click: Create Account

5. Redirected to login page

6. Log in with your credentials
   Email: john@example.com
   Password: (same as above)

7. Welcome to dashboard! ✨
```

### Forgot Password
- Reset coming soon (contact admin for now)

---

## 🔗 KEY URLS

| URL | Purpose | Who Can Access |
|-----|---------|-----------------|
| `/` | Home | Anyone |
| `/login` | Login | Anyone |
| `/signup` | Sign Up | Anyone (need code) |
| `/dashboard` | Main Hub | Logged-in managers |
| `/admin/invites` | Create Invites | Admin only |
| `/leaderboard` | Rankings | Logged-in managers |

---

## 🔐 SECURITY INFO

### Passwords
- Minimum 6 characters
- Encrypted with bcryptjs
- Never stored in plain text
- Hashed on server side

### Invite Codes
- 32-character hex string
- Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
- Unique (no duplicates)
- One-time use (can't reuse)
- Cannot be guessed

### Sessions
- JWT tokens (secure)
- HTTP-only cookies
- Auto-logout after inactivity
- Protected by NextAuth

---

## ⚡ TROUBLESHOOTING

### "Invalid invite code"
**Problem**: Code doesn't exist or already used  
**Solution**: Get new code from admin

### "Email already in use"
**Problem**: Email belongs to someone else  
**Solution**: Use different email OR already signed up earlier

### "Password must be 6+ characters"
**Problem**: Password too short  
**Solution**: Use longer password (min 6 chars)

### "Passwords don't match"
**Problem**: Confirm password differs  
**Solution**: Type exact same password twice

### Can't copy invite code
**Problem**: Browser clipboard issue  
**Solution**: Select code manually, Cmd+C (Mac) or Ctrl+C (Windows)

### Signup page won't load
**Problem**: Wrong URL or connection issue  
**Solution**: Use correct URL: `/signup` (not `/signup/`)

### Can't create invite (admin)
**Problem**: Not logged in as admin  
**Solution**: Verify login as admin@ffl.com

---

## 📊 QUICK STATS

| Metric | Value |
|--------|-------|
| Invite Code Length | 32 characters |
| Password Min Length | 6 characters |
| Code Reusability | Single use only |
| Admin Access | Password protected |
| Database | SQLite (local) |
| Password Encryption | bcryptjs |

---

## 🚀 GETTING STARTED

### For Admin
1. Start app: `npm run dev`
2. Login: admin@ffl.com / admin123
3. Go to: Admin → Invites
4. Create invites for managers
5. Share codes!

### For Manager
1. Receive code from admin
2. Visit: /signup
3. Enter code & create password
4. Login with new account
5. Build lineups & compete!

---

## 💾 DATABASE

### Fields Added to User
```
inviteCode    String?    (unique, can be null)
inviteUsed    Boolean    (default: false)
```

### How They Work
1. **Create**: Admin generates code
   - `inviteCode` = generated code
   - `inviteUsed` = false

2. **Use**: Manager signs up
   - `inviteCode` = cleared (null)
   - `inviteUsed` = true

3. **Prevent Reuse**: Code can't be used again
   - Check: inviteUsed = true

---

## 📝 DOCUMENTATION FILES

Located in `/Users/mithilparmar/Projects/FFL/ffl-app/`:

- `QUICK_START.md` - 60-second overview
- `SIGNUP_GUIDE.md` - User registration guide
- `IMPLEMENTATION_SUMMARY.md` - Technical details
- `ARCHITECTURE.md` - Complete system design
- `COMPLETION_REPORT.md` - What was built

---

## ✅ COMPLETION STATUS

```
✓ System Implemented
✓ Database Updated
✓ Admin Dashboard Built
✓ Signup Page Created
✓ API Endpoints Working
✓ Security Configured
✓ Documentation Complete
✓ Ready for Testing
```

---

## 🎉 YOU'RE READY!

Everything is set up and ready to use.

```bash
# Start the app
cd /Users/mithilparmar/Projects/FFL/ffl-app
npm run dev

# Visit http://localhost:3000
# Login as admin@ffl.com / admin123
# Start creating invites!
```

**Enjoy your fantasy league!** 🏈
