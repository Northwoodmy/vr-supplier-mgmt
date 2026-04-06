import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { scores, totalScore, comments } = body;

    if (totalScore === undefined || totalScore < 0 || totalScore > 5) {
      return NextResponse.json(
        { error: '样品评分无效' },
        { status: 400 }
      );
    }

    // 确定下一步状态
    let nextStatus: 'site_visit' | 'rejected' = 'site_visit'; // 默认进入现场考察
    let rejectedReason = null;

    if (totalScore < 3.0) {
      nextStatus = 'rejected';
      rejectedReason = `样品评审得分 ${totalScore.toFixed(1)}，低于及格分 3.0`;
    }

    // 更新申请记录
    const updatedApplication = await prisma.supplierApplication.update({
      where: { id },
      data: {
        sampleScore: totalScore,
        sampleComments: comments || null,
        sampleReviewer: 'system', // TODO: 使用实际登录用户
        sampleReviewAt: new Date(),
        status: nextStatus,
        rejectedReason: rejectedReason,
        completedAt: nextStatus === 'rejected' ? new Date() : null,
      },
    });

    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error('Failed to submit sample review:', error);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}
