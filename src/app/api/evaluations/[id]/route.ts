import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// 获取评估详情
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

// 更新评估状态
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { status, feedback } = body;

    // 验证状态
    const validStatuses = ['draft', 'submitted', 'approved', 'rejected'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: '无效的状态值' },
        { status: 400 }
      );
    }

    // 检查评估是否存在
    const existingEvaluation = await prisma.qualityReview.findUnique({
      where: { id },
    });

    if (!existingEvaluation) {
      return NextResponse.json(
        { error: '评估记录不存在' },
        { status: 404 }
      );
    }

    // 更新评估
    const updatedEvaluation = await prisma.qualityReview.update({
      where: { id },
      data: {
        status: status || existingEvaluation.status,
      },
      include: {
        project: true,
        supplier: true,
      },
    });

    return NextResponse.json(updatedEvaluation);
  } catch (error) {
    console.error('Failed to update evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to update evaluation' },
      { status: 500 }
    );
  }
}

// 删除评估
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const evaluation = await prisma.qualityReview.findUnique({
      where: { id },
    });

    if (!evaluation) {
      return NextResponse.json(
        { error: '评估记录不存在' },
        { status: 404 }
      );
    }

    await prisma.qualityReview.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to delete evaluation' },
      { status: 500 }
    );
  }
}
