import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up pre-seeded manager accounts...');

  // Emails used by the previous seed for sample managers
  const seededManagerEmails = [
    'manager1@ffl.com',
    'manager2@ffl.com',
    'manager3@ffl.com',
    'manager4@ffl.com',
  ];

  // Delete non-admin users matching those emails. Lineups will cascade due to schema.
  const result = await prisma.user.deleteMany({
    where: {
      email: { in: seededManagerEmails },
      isAdmin: false,
    },
  });

  console.log(`Deleted ${result.count} pre-seeded manager account(s).`);
  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
