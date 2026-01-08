# NFL Playoff Fantasy Game

A web application for running an NFL playoff fantasy football side game for 4 managers.

## Features

- **User Authentication**: Secure login with NextAuth (credentials-based)
- **Lineup Management**: Submit weekly lineups (QB, RB, WR, TE, FLEX)
- **Burn Rule**: Once a player is used, they cannot be used again by that manager
- **Round-Specific Team Constraints**:
  - Week 1 & 2: Max 1 player per team (5 different teams)
  - Week 3: 2-1-1-1 split (4 teams total)
  - Week 4: 3-2 split (2 teams total)
- **Lineup Visibility**: Lineups are hidden until week is locked by admin
- **Leaderboard**: Cumulative scoring across all playoff weeks
- **Admin Panel**: Manage teams, players, weeks, and enter scores

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth v5
- **Styling**: Tailwind CSS
- **Password Hashing**: bcryptjs

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

1. Clone the repository and navigate to the project directory:

```bash
cd ffl-app
```

2. Install dependencies:

```bash
npm install
```

3. Set up the database:

```bash
# Run migrations
npx prisma migrate dev

# Seed the database with initial data
npm run db:seed
```

### Running the Application

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Login Credentials

**Admin Account:**
- Email: `admin@ffl.com`
- Password: `admin123`

**Manager Accounts:**
- Email: `manager1@ffl.com` through `manager4@ffl.com`
- Password: `manager123`

## Game Rules

### Lineup Structure
Each week, every manager submits a lineup with:
- 1 QB (Quarterback)
- 1 RB (Running Back)
- 1 WR (Wide Receiver)
- 1 TE (Tight End)
- 1 FLEX (RB, WR, or TE)

### Burn Rule
Once a manager uses a player in any week, that manager **cannot use that player again** in any later week. This rule applies per-manager only (multiple managers can use the same player in the same week).

### Team Constraints by Week

**Week 1 (Wild Card) - 12 teams:**
- Maximum 1 player per NFL team
- All 5 players must be from different teams

**Week 2 (Divisional) - 8 teams:**
- Maximum 1 player per NFL team
- All 5 players must be from different teams

**Week 3 (Conference Championship) - 4 teams:**
- Must have exactly 4 different NFL teams represented
- One team must have 2 players, the other three teams 1 player each (2-1-1-1)

**Week 4 (Super Bowl) - 2 teams:**
- Must have exactly 2 NFL teams represented
- Must be a 3-2 split between the two teams

### Scoring
- Standard fantasy football scoring (manually entered by admin)
- Weekly lineup score = sum of all 5 players' points
- Tournament winner = highest cumulative score across all 4 weeks

## Admin Functions

### Managing Teams & Players
Navigate to **Teams & Players** from the admin menu to:
- Add/edit/delete NFL teams
- Add/edit/delete players and assign them to teams

### Managing Weeks
Navigate to **Weeks** from the admin menu to:
- Lock/unlock weeks (controls lineup visibility and submission deadlines)
- When a week is **Open**: Managers can submit lineups, but they're hidden from others
- When a week is **Locked**: No more submissions, all lineups become visible

### Entering Scores
1. Lock the week first
2. Click "Enter Scores" for that week
3. Enter fantasy points for each player that appeared in lineups
4. Save scores
5. Leaderboard and lineup scores will automatically update

## Project Structure

```
ffl-app/
├── app/
│   ├── (authenticated)/        # Protected routes
│   │   ├── admin/              # Admin-only pages
│   │   ├── dashboard/          # Main dashboard
│   │   ├── leaderboard/        # Leaderboard page
│   │   └── weeks/              # Week-specific pages
│   ├── api/                    # API routes
│   │   ├── admin/              # Admin API endpoints
│   │   ├── auth/               # NextAuth endpoints
│   │   └── lineups/            # Lineup submission API
│   └── login/                  # Login page
├── components/                 # React components
├── lib/                        # Utility functions
│   ├── prisma.ts              # Prisma client
│   └── validation.ts          # Lineup validation logic
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed data
└── auth.ts                     # NextAuth configuration
```

## Database Schema

- **User**: Stores user accounts (managers and admin)
- **NflTeam**: NFL teams participating in playoffs
- **Player**: Football players with positions and team assignments
- **Week**: Playoff weeks (Wild Card, Divisional, Conference, Super Bowl)
- **Lineup**: Manager's weekly player selections
- **PlayerScore**: Player fantasy points by week

## Development

### Database Commands

```bash
# Create a new migration after schema changes
npx prisma migrate dev --name description

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio

# Re-seed the database
npm run db:seed
```

### Lint and Format

```bash
npm run lint
```

## Troubleshooting

**Cannot log in:**
- Make sure you ran `npm run db:seed` to create user accounts
- Check that the database file exists: `prisma/dev.db`

**Validation errors when submitting lineup:**
- Check that you haven't used any of those players in previous weeks (burn rule)
- Verify team constraints for the current week
- Ensure all position slots are filled correctly

**Scores not showing on leaderboard:**
- Admin must enter player scores via the admin panel
- Week must be locked first before entering scores

## License

This project is for internal use only.
