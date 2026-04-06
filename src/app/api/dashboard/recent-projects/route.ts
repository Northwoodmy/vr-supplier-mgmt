import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// 状态中文映射
const statusLabels: Record<string, string> = {
  planning: '筹备中',
  pre_production: '预制作',
  production: '制作中',
  review: '审核中',
  delivery: '交付中',
  completed: '已完成',
  cancelled: '已取消',
  paused: '已暂停',
};

export async function GET() {
  try {
    // 获取最近的项目（按创建时间倒序，最多 5 个）
    const projects = await prisma.project.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        suppliers: {
          include: {
            supplier: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        qualityReviews: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // 转换为前端需要的格式
    const recentProjects = projects.map((project) => {
      // 获取供应商名称
      const supplierNames = project.suppliers
        .map((s) => s.supplier.name)
        .join('、');

      // 判断项目状态显示
      let statusLabel = statusLabels[project.currentStage] || project.currentStage;

      // 检查是否有待评估
      const hasPendingEvaluation = project.qualityReviews.some(
        (r) => r.status === 'submitted'
      );

      if (hasPendingEvaluation) {
        statusLabel = '待评估';
      } else if (project.currentStage === 'completed') {
        statusLabel = '已完成';
      } else if (project.currentStage === 'delivery') {
        statusLabel = '已交付';
      }

      return {
        id: project.id,
        name: project.name,
        code: project.code,
        status: statusLabel,
        currentStage: project.currentStage,
        suppliers: supplierNames,
        createdAt: project.createdAt,
      };
    });

    return NextResponse.json(recentProjects);
  } catch (error) {
    console.error('Failed to fetch recent projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent projects' },
      { status: 500 }
    );
  }
}
