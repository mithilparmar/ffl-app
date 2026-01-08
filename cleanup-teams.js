const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const playoffTeams = ['DEN', 'NE', 'JAX', 'PIT', 'HOU', 'BUF', 'LAC', 'SEA', 'CHI', 'PHI', 'CAR', 'LAR', 'SF', 'GB'];

async function main() {
  const teams = await prisma.nflTeam.findMany();
  
  const teamsToDelete = teams.filter(t => !playoffTeams.includes(t.shortCode));
  
  console.log('Teams to delete:', teamsToDelete.map(t => `${t.shortCode} (${t.name})`).join(', '));
  
  for (const team of teamsToDelete) {
    await prisma.nflTeam.delete({ where: { id: team.id } });
    console.log(`Deleted ${team.shortCode}`);
  }
  
  console.log(`\nRemoved ${teamsToDelete.length} non-playoff teams`);
  console.log(`${playoffTeams.length} playoff teams remain`);
}

main().finally(() => prisma.$disconnect());
