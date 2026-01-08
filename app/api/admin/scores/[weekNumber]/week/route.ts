import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ weekNumber: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { weekNumber } = await params;
    const week = await prisma.week.findUnique({
      where: { number: parseInt(weekNumber) },
    });

    return NextResponse.json(week);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
