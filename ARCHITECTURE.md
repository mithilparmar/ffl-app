# System Architecture: Invite Code Registration

## Overview Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    NFL PLAYOFF FANTASY LEAGUE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐              │
│  │    ADMIN USER    │         │   NEW MANAGER    │              │
│  └────────┬─────────┘         └────────┬─────────┘              │
│           │                            │                         │
│           │ Login                      │                         │
│           v                            │                         │
│    ┌─────────────┐                     │                         │
│    │ /login      │                     │                         │
│    │ (NextAuth)  │                     │                         │
│    └──────┬──────┘                     │                         │
│           │                            │                         │
│           │ Authenticated              │ Needs Invite Code       │
│           v                            │                         │
│    ┌──────────────────────┐       Receives Code                  │
│    │  /admin/invites      │       from Admin                     │
│    │  Create & Manage     │            │                         │
│    │  Invite Codes        │            │                         │
│    └──────────┬───────────┘            │                         │
│               │                        │                         │
│    Generate   │  POST                  │                         │
│    Code       │  /api/admin/           │                         │
│               │   invite-codes         │                         │
│               │                        v                         │
│         ┌─────────────────────────────────┐                      │
│         │     INVITE CODE DATABASE        │                      │
│         │  ┌─────────────────────────┐    │                      │
│         │  │ User Record with:        │    │                      │
│         │  │ - inviteCode (unique)    │    │                      │
│         │  │ - inviteUsed (false)     │    │                      │
│         │  │ - email                  │    │                      │
│         │  │ - name                   │    │                      │
│         │  └─────────────────────────┘    │                      │
│         └────────┬────────────────────────┘                      │
│                  │                                                │
│              Share Code                                           │
│              via Email/Chat    ┌─────────────────────────┐       │
│                  │────────────>│  /signup                │       │
│                                │  Public Form            │       │
│                                │  No Auth Required       │       │
│                                └────────────┬────────────┘       │
│                                             │                    │
│                                   Paste Code + Password          │
│                                             │                    │
│                                POST /api/auth/signup             │
│                                             │                    │
│                                    ┌────────v────────┐           │
│                                    │  Validation     │           │
│                                    │  - Code valid?  │           │
│                                    │  - Not used?    │           │
│                                    │  - Pass ok?     │           │
│                                    └────────┬────────┘           │
│                                             │                    │
│                                    ┌────────v────────┐           │
│                                    │  Create Account │           │
│                                    │  - Hash pass    │           │
│                                    │  - Mark used    │           │
│                                    │  - Save to DB   │           │
│                                    └────────┬────────┘           │
│                                             │                    │
│                                   Redirect to /login             │
│                                             │                    │
│                                    ┌────────v────────┐           │
│                                    │  /login         │           │
│                                    │  Log In         │           │
│                                    └────────┬────────┘           │
│                                             │                    │
│                                   ┌────────v────────┐            │
│                                   │   /dashboard    │            │
│                                   │   Play Fantasy! │            │
│                                   └─────────────────┘            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Invite Code Creation (Admin)
```
Admin → /admin/invites (form)
  ↓
POST /api/admin/invite-codes
  ↓
validate email not in use
  ↓
generate 32-char code
  ↓
create user stub with:
  - inviteCode = generated code
  - inviteUsed = false
  - email = provided email
  - name = provided name
  ↓
return code to admin
  ↓
Admin copies and shares code
```

### 2. Manager Signup (New Manager)
```
Manager receives code
  ↓
Visit /signup
  ↓
Enter form:
  - Invite Code (paste)
  - Name
  - Email
  - Password
  - Confirm Password
  ↓
POST /api/auth/signup
  ↓
Validate invite code exists
  ↓
Validate not already used
  ↓
Validate email unique (unless it's the invite email)
  ↓
Hash password
  ↓
Update user record:
  - Add password (hashed)
  - Set inviteUsed = true
  - Clear inviteCode
  ↓
Return success
  ↓
Redirect to /login
  ↓
Manager logs in with new credentials
```

## Component Breakdown

### Frontend Components

#### `/app/signup/page.tsx` (189 lines)
- **Purpose**: Public signup form
- **Accessible**: Without authentication
- **Fields**: 
  - Invite Code (required)
  - Name (required)
  - Email (required)
  - Password (min 6 chars)
  - Confirm Password (must match)
- **Validation**: Client-side + server-side
- **Redirect**: On success → `/login?success=true`

#### `/app/(authenticated)/admin/invites/page.tsx` (227 lines)
- **Purpose**: Admin invite management dashboard
- **Accessible**: Admin users only
- **Features**:
  - Create new invite form
  - List of pending invites (not used)
  - List of active invites (used)
  - Copy-to-clipboard for each code
  - Delete button for unused invites
- **Uses**: `useCopyToClipboard` hook for clipboard functionality

#### `/app/login/page.tsx` (updated)
- **Changes**: Added link to `/signup` for new managers
- **Text**: "Don't have an account? Sign up with invite code"

### Backend APIs

#### `POST /api/auth/signup` (81 lines)
```typescript
Request Body:
{
  inviteCode: string,
  email: string,
  name: string,
  password: string
}

Response (201 Created):
{
  message: "Account created successfully",
  userId: string
}

Response (400 Bad Request):
{
  error: "Invalid invite code" |
         "Email already in use" |
         "Password too short" |
         etc
}
```

#### `GET /api/admin/invite-codes` (admin only)
- Returns all invites (both pending and used)
- Sorted by creation date
- Includes usage status

#### `POST /api/admin/invite-codes` (admin only)
```typescript
Request Body:
{
  name: string,
  email: string
}

Response (201 Created):
{
  inviteCode: string,
  id: string,
  email: string,
  name: string,
  createdAt: string
}
```

#### `DELETE /api/admin/invite-codes?id=<id>` (admin only)
- Deletes an unused invite code
- Returns 404 if already used (safety check)

### Utilities

#### `lib/use-copy-clipboard.ts` (12 lines)
```typescript
Hook: useCopyToClipboard()
Returns: {
  copy: (text: string) => Promise<void>,
  copied: boolean  // true for 2 seconds after copy
}

Usage: 
const { copy, copied } = useCopyToClipboard()
onClick={() => copy(inviteCode)}
```

### Database Changes

#### `prisma/schema.prisma` (User model)
```prisma
model User {
  // ... existing fields ...
  
  inviteCode  String?    @unique    // Unique invite code, nullable
  inviteUsed  Boolean    @default(false)  // Whether code was used
  
  // ... existing fields ...
}
```

### Middleware Updates

#### `middleware.ts`
```typescript
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login|signup).*)']
  //                                                                      ^^^^^^
  //                         Added 'signup' to public routes
}
```

## Security Model

### Authentication Levels

```
Level 0 (No Auth Required)
├── /login
├── /signup
└── /api/auth/signup

Level 1 (Any Authenticated User)
├── /dashboard
├── /weeks/[id]/submit
├── /weeks/[id]/view
├── /leaderboard
└── /api/teams (GET)
└── /api/players (GET)

Level 2 (Admin Only)
├── /admin/invites
├── /admin/weeks
├── /admin/players
├── /api/admin/invite-codes (all methods)
└── /api/admin/scores (all methods)
```

### Password Security
- Minimum 6 characters (enforced)
- Hashed with bcryptjs (salt rounds: 10)
- Never stored in plain text
- Compared with bcryptjs.compare()

### Invite Code Security
- 32-character hexadecimal
- Generated with crypto.randomBytes()
- Unique per code (database constraint)
- One-time use (inviteUsed flag)
- Cannot be reused once activated

### Session Security
- JWT tokens via NextAuth
- Secure HTTP-only cookies
- Token expiration (configurable)
- CSRF protection built-in

## Error Handling

### Signup Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid invite code" | Code doesn't exist or not found | Get correct code from admin |
| "Invite already used" | Code was already activated | Request new code from admin |
| "Email already in use" | Email registered to another user | Use different email |
| "Password required" | Password field was empty | Enter a password |
| "Password too short" | Password < 6 characters | Use longer password |
| "Passwords don't match" | Confirm password differs | Make passwords match |
| "Invalid email" | Email format incorrect | Use valid email format |

### API Errors

```
400: Bad Request (validation failed)
401: Unauthorized (no session)
403: Forbidden (not admin)
404: Not Found (invite not found)
500: Server Error (unexpected)
```

## Database Transactions

### Creating an Invite
1. Check email not in use
2. Generate unique code
3. Create user record
4. Return code to admin

### Using an Invite
1. Find user by code
2. Check not already used
3. Validate password
4. Hash password
5. Update user record (set password, mark used)
6. Return success

## Performance Considerations

- **Invite Lookup**: O(1) via unique index on inviteCode
- **Email Duplicate Check**: O(1) via unique index on email
- **Password Hashing**: ~100ms (bcryptjs salt rounds: 10)
- **Database Queries**: Minimal, 2-3 per signup
- **Session Creation**: Handled by NextAuth

## Testing Strategy

### Unit Tests (Optional)
- Password hashing verification
- Invite code generation uniqueness
- Email validation regex

### Integration Tests
- Create invite → Get code → Use code → Login
- Invalid code rejection
- Duplicate email rejection
- Password requirements

### E2E Tests
- Admin creates invite
- Admin copies code
- Manager signs up with code
- Manager logs in
- Manager accesses dashboard

---

**Architecture Summary**: The invite system is a lightweight addition to the existing auth flow that introduces a gating mechanism while reusing NextAuth's existing session management and authentication infrastructure.
