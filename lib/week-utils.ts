import { prisma } from '@/lib/prisma';

export async function getCurrentWeek() {
  const now = new Date();
  
  const weeks = await prisma.week.findMany({
    orderBy: { number: 'asc' },
  });

  // Find the first week that is not locked and deadline hasn't passed
  for (const week of weeks) {
    // Skip if manually locked
    if (week.isLocked) continue;
    
    // Skip if deadline has passed
    if (week.deadline && now >= week.deadline) continue;
    
    // This week is open
    return week;
  }

  // If all weeks are locked, return the last week
  return weeks[weeks.length - 1] || null;
}

export function isWeekLocked(week: { deadline: Date | null; isLocked: boolean }) {
  if (week.isLocked) return true;
  if (!week.deadline) return false;
  return new Date() > week.deadline;
}
