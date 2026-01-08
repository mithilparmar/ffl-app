import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const weeks = await prisma.week.findMany({
      orderBy: { number: 'asc' },
    });

    return NextResponse.json(weeks);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, isLocked, deadline } = body;

    const updateData: { isLocked?: boolean; deadline?: Date | null } = {};
    if (isLocked !== undefined) {
      updateData.isLocked = isLocked;
    }
    if (deadline !== undefined) {
      updateData.deadline = deadline ? new Date(deadline) : null;
    }

    const week = await prisma.week.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(week);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
