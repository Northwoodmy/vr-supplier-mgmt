import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/audit';

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        suppliers: {
          include: {
            supplier: true,
          },
        },
        _count: {
          select: {
            suppliers: true,
            deliveries: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[Projects API] Request body:', JSON.stringify(body, null, 2));
    const { project, suppliers } = body;

    // 获取当前用户
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    // 验证项目数据
    if (!project?.name || !project?.code) {
      return NextResponse.json(
        { error: '项目名称和编号必填' },
        { status: 400 }
      );
    }

    // 创建项目
    const createdProject = await prisma.project.create({
      data: {
        name: project.name,
        code: project.code,
        description: project.description,
        budget: project.budget,
        actualCost: project.actualCost,
        startDate: project.startDate ? new Date(project.startDate) : null,
        endDate: project.endDate ? new Date(project.endDate) : null,
        expectedDeliveryDate: project.expectedDeliveryDate ? new Date(project.expectedDeliveryDate) : null,
        status: project.status,
        currentStage: project.currentStage,
        createdById: currentUser.id,
      },
    });

    console.log('[Projects API] Project created:', createdProject.id);

    // 如果有关联的供应商，创建关联记录
    if (suppliers && Array.isArray(suppliers) && suppliers.length > 0) {
      console.log('[Projects API] Creating supplier associations:', suppliers);

      // 使用事务确保所有供应商关联都成功创建
      await prisma.$transaction(async (tx) => {
        for (const sp of suppliers) {
          if (!sp.supplierId) continue;

          await tx.supplierProject.create({
            data: {
              projectId: createdProject.id,
              supplierId: sp.supplierId,
              estimatedManDays: sp.estimatedManDays || 50,
              complexityLevel: sp.complexityLevel || 'medium',
              currentStage: sp.currentStage || 'planning',
              workloadShare: sp.workloadShare || 1.0,
            },
          });
        }
      });

      console.log('[Projects API] Supplier associations created successfully');
    }

    // 重新查询包含供应商关联的项目
    const fullProject = await prisma.project.findUnique({
      where: { id: createdProject.id },
      include: {
        suppliers: {
          include: {
            supplier: true,
          },
        },
      },
    });

    return NextResponse.json(fullProject);
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json(
      { error: 'Failed to create project: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
