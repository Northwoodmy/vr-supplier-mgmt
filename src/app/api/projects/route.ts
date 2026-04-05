import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

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
    const { project, suppliers } = body;

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
        createdById: 'system', // TODO: Get from session
      },
    });

    // 如果有关联的供应商，创建关联记录
    if (suppliers && suppliers.length > 0) {
      await prisma.supplierProject.createMany({
        data: suppliers.map((sp: any) => ({
          projectId: createdProject.id,
          supplierId: sp.supplierId,
          estimatedManDays: sp.estimatedManDays,
          complexityLevel: sp.complexityLevel,
          currentStage: sp.currentStage,
          workloadShare: sp.workloadShare,
        })),
      });
    }

    return NextResponse.json(createdProject);
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
