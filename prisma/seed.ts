import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Delete all existing players
  const deletedPlayers = await prisma.player.deleteMany({});
  console.log(`Deleted ${deletedPlayers.count} existing players`);

  // Create or update admin user using environment variables
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@ffl.com';
  const adminPasswordPlain = process.env.ADMIN_PASSWORD || 'admin123';
  const adminPassword = await bcrypt.hash(adminPasswordPlain, 10);

  // Prefer updating an existing user with the target email; otherwise update an existing admin; else create
  const existingByEmail = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existingByEmail) {
    await prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        name: existingByEmail.name || 'Admin User',
        password: adminPassword,
        isAdmin: true,
      },
    });
    console.log('Updated admin user:', adminEmail);
  } else {
    const existingAdmin = await prisma.user.findFirst({ where: { isAdmin: true } });
    if (existingAdmin) {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          email: adminEmail,
          name: existingAdmin.name || 'Admin User',
          password: adminPassword,
          isAdmin: true,
        },
      });
      console.log('Updated existing admin to:', adminEmail);
    } else {
      const admin = await prisma.user.create({
        data: {
          email: adminEmail,
          name: 'Admin User',
          password: adminPassword,
          isAdmin: true,
        },
      });
      console.log('Created admin user:', admin.email);
    }
  }

  // Create 4 weeks
  const weeks = [
    { number: 1, label: 'Wild Card', isLocked: false },
    { number: 2, label: 'Divisional', isLocked: false },
    { number: 3, label: 'Conference Championship', isLocked: false },
    { number: 4, label: 'Super Bowl', isLocked: false },
  ];

  for (const weekData of weeks) {
    await prisma.week.upsert({
      where: { number: weekData.number },
      update: {},
      create: weekData,
    });
  }
  console.log('Created 4 playoff weeks');

  // Create sample NFL teams
  const teams = [
    { name: 'Denver Broncos', shortCode: 'DEN' },
    { name: 'New England Patriots', shortCode: 'NE' },
    { name: 'Jacksonville Jaguars', shortCode: 'JAX' },
    { name: 'Pittsburgh Steelers', shortCode: 'PIT' },
    { name: 'Houston Texans', shortCode: 'HOU' },
    { name: 'Buffalo Bills', shortCode: 'BUF' },
    { name: 'Los Angeles Chargers', shortCode: 'LAC' },
    { name: 'Seattle Seahawks', shortCode: 'SEA' },
    { name: 'Chicago Bears', shortCode: 'CHI' },
    { name: 'Philadelphia Eagles', shortCode: 'PHI' },
    { name: 'Carolina Panthers', shortCode: 'CAR' },
    { name: 'Los Angeles Rams', shortCode: 'LAR' },
    { name: 'San Francisco 49ers', shortCode: 'SF' },
    { name: 'Green Bay Packers', shortCode: 'GB' },
  ];

  for (const team of teams) {
    await prisma.nflTeam.upsert({
      where: { shortCode: team.shortCode },
      update: {},
      create: team,
    });
  }
  console.log('Created NFL teams');

  // Import players from CSV
  const fs = await import('fs');
  const path = await import('path');
  
  const csvPath = path.join(process.cwd(), 'players.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter((line) => line.trim());
  
  // Skip header row
  let importedCount = 0;
  for (let i = 1; i < lines.length; i++) {
    const [name, position, teamCode] = lines[i].split(',').map((s) => s.trim());
    
    if (!name || !position || !teamCode) continue;
    
    // Find team by short code
    const team = await prisma.nflTeam.findUnique({
      where: { shortCode: teamCode },
    });
    
    if (!team) {
      console.log(`Warning: Team "${teamCode}" not found for player "${name}"`);
      continue;
    }
    
    await prisma.player.create({
      data: {
        name,
        position: position.toUpperCase() as any,
        teamId: team.id,
      },
    });
    importedCount++;
  }
  console.log(`Imported ${importedCount} players from CSV`);

  console.log('Database seeded successfully!');
  console.log('\nLogin credentials:');
  console.log(`Admin: ${adminEmail} / (password set via ADMIN_PASSWORD)`);
  console.log('Invite-only signup is enabled; no default managers created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
