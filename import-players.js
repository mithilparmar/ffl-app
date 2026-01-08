const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  const csv = fs.readFileSync('players.csv', 'utf-8');
  const lines = csv.split('\n').filter(l => l.trim());
  
  let count = 0;
  for (let i = 1; i < lines.length; i++) {
    const [name, position, teamCode] = lines[i].split(',').map(s => s.trim());
    
    if (!name || !position || !teamCode) continue;
    
    const team = await prisma.nflTeam.findUnique({
      where: { shortCode: teamCode }
    });
    
    if (!team) {
      console.log(`Warning: Team ${teamCode} not found for ${name}`);
      continue;
    }
    
    await prisma.player.create({
      data: {
        name,
        position,
        teamId: team.id
      }
    });
    count++;
  }
  
  console.log(`Imported ${count} players from CSV`);
}

main()
  .finally(() => prisma.$disconnect());
