import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// 获取待评估的项目列表
export async function GET() {
  try {
    // 获取所有已完成但尚未评估的项目
    const projects = await prisma.project.findMany({
      where: {
        currentStage: 'completed',
      },
      include: {
        suppliers: {
          include: {
            supplier: true,
          },
        },
        qualityReviews: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Failed to fetch pending evaluations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending evaluations' },
      { status: 500 }
    );
  }
}
