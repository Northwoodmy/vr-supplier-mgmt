import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        teamMembers: true,
        capacity: true,
        _count: {
          select: { projects: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error('Failed to fetch suppliers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    );
  }
}
