import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        suppliers: {
          include: {
            supplier: true,
          },
        },
        deliveries: true,
        qualityReviews: {
          include: {
            supplier: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: '项目不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Failed to fetch project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      name,
      code,
      description,
      budget,
      actualCost,
      startDate,
      endDate,
      expectedDeliveryDate,
      actualDeliveryDate,
      status,
      currentStage,
    } = body;

    // 检查项目是否存在
    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: '项目不存在' },
        { status: 404 }
      );
    }

    // 更新项目信息
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name: name ?? existingProject.name,
        code: code ?? existingProject.code,
        description: description ?? existingProject.description,
        budget: budget !== undefined ? budget : existingProject.budget,
        actualCost: actualCost !== undefined ? actualCost : existingProject.actualCost,
        startDate: startDate !== undefined ? new Date(startDate) : existingProject.startDate,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : existingProject.endDate,
        expectedDeliveryDate: expectedDeliveryDate !== undefined ? new Date(expectedDeliveryDate) : existingProject.expectedDeliveryDate,
        actualDeliveryDate: actualDeliveryDate !== undefined ? (actualDeliveryDate ? new Date(actualDeliveryDate) : null) : existingProject.actualDeliveryDate,
        status: status ?? existingProject.status,
        currentStage: currentStage ?? existingProject.currentStage,
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Failed to update project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        suppliers: true,
        deliveries: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: '项目不存在' },
        { status: 404 }
      );
    }

    // 检查是否有关联的数据
    if (project.suppliers.length > 0) {
      return NextResponse.json(
        { error: '该项目已关联供应商，无法删除' },
        { status: 400 }
      );
    }

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
