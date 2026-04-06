import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// 阶段系数（与 capacity/saturations 保持一致）
const STAGE_FACTORS: Record<string, number> = {
  planning: 0.2,
  pre_production: 0.5,
  production: 1.0,
  review: 0.8,
  delivery: 0.6,
  paused: 0.1,
};

// 复杂度系数
const COMPLEXITY_FACTORS: Record<string, number> = {
  simple: 0.8,
  medium: 1.0,
  complex: 1.3,
  extreme: 1.6,
};

// 并行损耗系数
function getParallelFactor(count: number): number {
  if (count <= 1) return 1.0;
  if (count === 2) return 1.15;
  if (count === 3) return 1.35;
  return 1.6;
}

export async function GET() {
  try {
    const todos = [];

    // 1. 待评估的影片 (status = 'submitted' 的品质评估)
    const pendingReviews = await prisma.qualityReview.findMany({
      where: {
        status: 'submitted',
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    todos.push(
      ...pendingReviews.map((review) => ({
        id: review.id,
        type: 'evaluation' as const,
        task: `评审《${review.project.name}》- ${review.supplier.name}`,
        priority: '高' as const,
        link: `/evaluations/${review.id}`,
        createdAt: review.createdAt,
      }))
    );

    // 2. 即将交付的项目 (未来 7 天内)
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingDeliveries = await prisma.project.findMany({
      where: {
        expectedDeliveryDate: {
          gte: today,
          lte: nextWeek,
        },
        status: {
          in: ['production', 'review', 'delivery'],
        },
      },
      include: {
        suppliers: {
          include: {
            supplier: true,
          },
        },
      },
      take: 5,
    });

    todos.push(
      ...upcomingDeliveries.map((project) => ({
        id: project.id,
        type: 'delivery' as const,
        task: `项目交付：${project.name} (${project.code})`,
        priority: '中' as const,
        link: `/projects/${project.id}`,
        createdAt: project.createdAt,
      }))
    );

    // 3. 产能超载的供应商（使用与 capacity/saturations 相同的计算逻辑）
    const suppliers = await prisma.supplier.findMany({
      include: {
        capacity: true,
        projects: {
          include: {
            project: true,
          },
        },
      },
    });

    for (const supplier of suppliers) {
      if (!supplier.capacity) continue;

      // 过滤活跃项目
      const activeProjects = supplier.projects.filter(
        (p) =>
          p.project.currentStage !== 'completed' &&
          p.project.currentStage !== 'cancelled' &&
          p.project.currentStage !== 'paused'
      );

      const parallelCount = activeProjects.length;
      const parallelFactor = getParallelFactor(parallelCount);

      // 计算总负载
      let totalLoad = 0;
      for (const sp of activeProjects) {
        const project = sp.project;
        if (
          !sp.estimatedManDays ||
          !project.expectedDeliveryDate ||
          !project.startDate
        ) {
          continue;
        }

        // 计算项目周期（月）
        const startDate = new Date(project.startDate);
        const endDate = new Date(project.expectedDeliveryDate);
        const durationMonths = Math.max(
          1,
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
        );

        // 月度负载
        const monthlyLoad =
          (sp.estimatedManDays / 22 / durationMonths) * sp.workloadShare;

        // 应用系数
        const stageFactor = STAGE_FACTORS[project.currentStage] || 1.0;
        const complexityFactor =
          COMPLEXITY_FACTORS[sp.complexityLevel] || 1.0;

        totalLoad += monthlyLoad * stageFactor * complexityFactor;
      }

      // 应用并行系数
      totalLoad *= parallelFactor;

      // 计算饱和度
      const saturationRate =
        supplier.capacity.monthlyCapacity > 0
          ? (totalLoad / supplier.capacity.monthlyCapacity) * 100
          : 0;

      // 饱和度超过 80% 才显示预警
      if (saturationRate > 80) {
        todos.push({
          id: `capacity-${supplier.id}`,
          type: 'capacity' as const,
          task: `产能预警：${supplier.name} 饱和度 ${saturationRate.toFixed(0)}%`,
          priority: saturationRate > 100 ? '高' : '中' as const,
          link: `/suppliers/${supplier.id}`,
          createdAt: new Date(),
        });
      }
    }

    // 按优先级排序（高 > 中 > 低），然后按时间倒序
    const priorityOrder: Record<string, number> = { '高': 0, '中': 1, '低': 2 };
    todos.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json(todos);
  } catch (error) {
    console.error('Failed to fetch todos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch todos' },
      { status: 500 }
    );
  }
}
