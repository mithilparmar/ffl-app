const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teams = await prisma.nflTeam.findMany();
  console.log('Current teams:', teams.map(t => `${t.shortCode} (${t.name})`).join('\n'));
}

main().finally(() => prisma.$disconnect());
