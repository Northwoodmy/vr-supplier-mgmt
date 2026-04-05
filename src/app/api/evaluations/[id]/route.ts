import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const evaluation = await prisma.qualityReview.findUnique({
      where: { id },
      include: {
        project: true,
        supplier: true,
      },
    });

    if (!evaluation) {
      return NextResponse.json(
        { error: '评估记录不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Failed to fetch evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evaluation' },
      { status: 500 }
    );
  }
}
