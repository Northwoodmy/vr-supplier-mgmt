import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser, logAudit } from '@/lib/audit';

/**
 * 为项目添加供应商分配
 * POST /api/projects/[id]/suppliers
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const { id: projectId } = await params;
    const body = await request.json();

    const {
      supplierId,
      estimatedManDays,
      complexityLevel,
      currentStage,
      workloadShare,
    } = body;

    // 验证必填字段
    if (!supplierId) {
      return NextResponse.json(
        { error: '请选择供应商' },
        { status: 400 }
      );
    }

    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: '项目不存在' },
        { status: 404 }
      );
    }

    // 检查供应商是否存在
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: '供应商不存在' },
        { status: 404 }
      );
    }

    // 检查是否已经分配过该供应商
    const existingAllocation = await prisma.supplierProject.findUnique({
      where: {
        supplierId_projectId: {
          supplierId,
          projectId,
        },
      },
    });

    if (existingAllocation) {
      return NextResponse.json(
        { error: '该供应商已分配到该项目' },
        { status: 400 }
      );
    }

    // 创建供应商 - 项目关联
    const allocation = await prisma.supplierProject.create({
      data: {
        supplierId,
        projectId,
        estimatedManDays: estimatedManDays || 50,
        complexityLevel: complexityLevel || 'medium',
        currentStage: currentStage || 'production',
        workloadShare: workloadShare || 1.0,
        currentLoad: 0, // 后续计算
      },
      include: {
        supplier: true,
      },
    });

    // 记录审计日志
    await logAudit(
      currentUser.id,
      'CREATE',
      'supplier_project',
      allocation.id,
      `为项目 ${project.name} 分配供应商 ${supplier.name}`,
      null,
      request.headers.get('user-agent'),
    );

    return NextResponse.json(allocation);
  } catch (error) {
    console.error('Failed to allocate supplier:', error);
    return NextResponse.json(
      { error: '分配失败：' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    );
  }
}
