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

// 创建新的品质评估
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      projectId,
      supplierId,
      visualQuality,
      animationSmoothness,
      vfxMatch,
      audioQuality,
      cameraWork,
      storyNovelty,
      comments,
    } = body;

    // 验证必填字段
    if (!projectId || !supplierId) {
      return NextResponse.json(
        { error: '缺少项目或供应商信息' },
        { status: 400 }
      );
    }

    // 验证评分范围 (1-5)
    const scores = [visualQuality, animationSmoothness, vfxMatch, audioQuality, cameraWork, storyNovelty];
    for (const score of scores) {
      if (typeof score !== 'number' || score < 1 || score > 5) {
        return NextResponse.json(
          { error: '评分必须在 1-5 之间' },
          { status: 400 }
        );
      }
    }

    // 计算加权总分
    const totalScore =
      visualQuality * 0.25 +
      animationSmoothness * 0.20 +
      vfxMatch * 0.15 +
      audioQuality * 0.15 +
      cameraWork * 0.15 +
      storyNovelty * 0.10;

    // 创建评估记录
    const evaluation = await prisma.qualityReview.create({
      data: {
        projectId,
        supplierId,
        reviewerId: 'system', // TODO: Get from session when auth is implemented
        visualQuality,
        animationSmoothness,
        vfxMatch,
        audioQuality,
        cameraWork,
        storyNovelty,
        totalScore,
        comments: comments || undefined,
        status: 'submitted',
      },
      include: {
        project: true,
        supplier: true,
      },
    });

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Failed to create evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to create evaluation' },
      { status: 500 }
    );
  }
}
