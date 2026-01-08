# Deployment Guide: Vercel + Neon (Postgres)

## Overview
This app uses Next.js with server routes and NextAuth, so it needs a runtime platform. Vercel Hobby (free) is ideal. Use Neon (Postgres) for the database via Prisma.

## Prerequisites
- GitHub account
- Vercel account (free)
- Neon account (free)

## Steps

### 1) Create Neon Database
1. Sign up at https://neon.tech
2. Create a new project and database
3. Copy the connection string (include user, password, host, database)

### 2) Configure Environment
1. Copy `.env.example` to `.env`
2. Set the following:
   - `DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DBNAME`
   - `AUTH_SECRET=<random-long-string>`
   - `NEXTAUTH_URL=http://localhost:3000` (for local), later set to your Vercel URL
   - `ADMIN_EMAIL=<your email>`
   - `ADMIN_PASSWORD=<your password>`

### 3) Migrate Schema to Neon
Run locally (with `.env` pointing to Neon):
```bash
npx prisma migrate deploy
npx prisma generate
```

### 4) Seed Remote DB
Run locally to create admin and base data:
```bash
npm run db:seed
```

### 5) Push to GitHub
```bash
git init
git add -A
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

### 6) Deploy on Vercel
1. Go to https://vercel.com/new and import your GitHub repo
2. Add environment variables:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `NEXTAUTH_URL` → `https://<your-app>.vercel.app`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
3. Deploy

### 7) Verify
- Visit `/login` and sign in using your admin credentials
- Visit `/admin/invites` and create an invite
- Log out and sign up at `/signup` using the invite code
- Log back in with the new account and access `/dashboard`

## Notes
- GitHub Pages is static-only and won’t run Next.js server routes; Vercel is the recommended path.
- `.env` is gitignored; never commit secrets.
- Seeding is done locally against the Neon DB.
- If you see errors after switching to Postgres, verify `DATABASE_URL` matches the Postgres provider and re-run `prisma migrate deploy`.
