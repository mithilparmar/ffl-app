import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const signupSchema = z.object({
  inviteCode: z.string().min(1, 'Invite code is required'),
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { inviteCode, email, name, password } = signupSchema.parse(body);

    // Check if invite code exists and hasn't been used
    const inviteUser = await prisma.user.findUnique({
      where: { inviteCode },
    });

    if (!inviteUser) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 400 }
      );
    }

    if (inviteUser.inviteUsed) {
      return NextResponse.json(
        { error: 'This invite code has already been used' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.id !== inviteUser.id) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }

    // Hash password and update user
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.update({
      where: { id: inviteUser.id },
      data: {
        email,
        name,
        password: hashedPassword,
        inviteCode: null,
        inviteUsed: true,
      },
    });

    return NextResponse.json(
      { message: 'Account created successfully', userId: newUser.id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
