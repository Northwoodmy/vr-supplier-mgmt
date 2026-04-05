import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// 获取供应商评级报表
export async function GET() {
  try {
    const ratings = await prisma.supplierRating.findMany({
      include: {
        supplier: true,
      },
      orderBy: { year: 'desc' },
    });

    return NextResponse.json(ratings);
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
