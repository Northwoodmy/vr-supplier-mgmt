import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { siteVisitResult, siteVisitComments, nextStatus } = body;

    if (!siteVisitResult || !['through', 'failed', 'not_required'].includes(siteVisitResult)) {
      return NextResponse.json(
        { error: '请选择正确的考察结果' },
        { status: 400 }
      );
    }

    // 确定下一步状态
    let finalNextStatus: 'trial_run' | 'rejected' = nextStatus || (siteVisitResult === 'through' ? 'trial_run' : 'rejected');
    let rejectedReason = null;

    if (siteVisitResult === 'failed') {
      rejectedReason = `现场考察未通过：${siteVisitComments || '现场考察评估未达标'}`;
    }

    // 更新申请记录
    const updatedApplication = await prisma.supplierApplication.update({
      where: { id },
      data: {
        siteVisitResult,
        siteVisitComments,
        siteVisitAt: new Date(),
        status: finalNextStatus,
        rejectedReason: rejectedReason,
        completedAt: finalNextStatus === 'rejected' ? new Date() : null,
      },
    });

    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error('Failed to submit site visit:', error);
    return NextResponse.json(
      { error: 'Failed to submit site visit' },
      { status: 500 }
    );
  }
}
