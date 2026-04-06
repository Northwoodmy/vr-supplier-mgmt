import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { result, comments, nextStatus } = body;

    if (!result || !['through', 'failed'].includes(result)) {
      return NextResponse.json(
        { error: '请选择正确的审核结果' },
        { status: 400 }
      );
    }

    // 更新申请记录
    const updatedApplication = await prisma.supplierApplication.update({
      where: { id },
      data: {
        documentReviewResult: result,
        documentComments: comments || null,
        documentReviewer: 'system', // TODO: 使用实际登录用户
        documentReviewAt: new Date(),
        status: nextStatus as 'document_review' | 'rejected' || 'rejected',
        rejectedReason: result === 'failed' ? comments : null,
        completedAt: result === 'failed' ? new Date() : null,
      },
    });

    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error('Failed to submit document review:', error);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}
