import { prisma } from '@/lib/prisma';

export async function getCurrentWeek() {
  const now = new Date();
  
  const weeks = await prisma.week.findMany({
    orderBy: { number: 'asc' },
  });

  // Find the first week that either has no deadline or deadline hasn't passed
  for (const week of weeks) {
    if (!week.deadline || now < week.deadline) {
      return week;
    }
  }

  // If all deadlines have passed, return the last week
  return weeks[weeks.length - 1] || null;
}

export function isWeekLocked(week: { deadline: Date | null; isLocked: boolean }) {
  if (week.isLocked) return true;
  if (!week.deadline) return false;
  return new Date() > week.deadline;
}
