import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const applications = await prisma.supplierApplication.findMany({
      orderBy: { applicationDate: 'desc' },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Failed to fetch supplier applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}
