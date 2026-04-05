import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// 获取品质评估列表
export async function GET() {
  try {
    const reviews = await prisma.qualityReview.findMany({
      include: {
        project: true,
        supplier: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Failed to fetch evaluations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evaluations' },
      { status: 500 }
    );
  }
}
