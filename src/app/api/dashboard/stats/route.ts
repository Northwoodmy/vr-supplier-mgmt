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
    // 1. 供应商总数
    const totalSuppliers = await prisma.supplier.count({
      where: { status: 'active' },
    });

    // 2. 进行中项目（非 completed/cancelled）
    const activeProjects = await prisma.project.count({
      where: {
        status: {
          in: ['planning', 'pre_production', 'production', 'review', 'delivery'],
        },
      },
    });

    // 3. 待评估影片（status = 'submitted' 的品质评估）
    const pendingEvaluations = await prisma.qualityReview.count({
      where: { status: 'submitted' },
    });

    // 4. 产能饱和度（所有活跃供应商的平均饱和度）
    const suppliers = await prisma.supplier.findMany({
      where: { status: 'active' },
      include: {
        capacity: true,
        projects: {
          include: {
            project: true,
          },
        },
      },
    });

    let totalSaturation = 0;
    let saturationCount = 0;

    for (const supplier of suppliers) {
      if (!supplier.capacity) continue;

      // 过滤活跃项目
      const activeProjects = supplier.projects.filter(
        (p) =>
          p.project.currentStage !== 'completed' &&
          p.project.currentStage !== 'cancelled' &&
          p.project.currentStage !== 'paused'
      );

      if (activeProjects.length === 0) continue;

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

      totalSaturation += saturationRate;
      saturationCount++;
    }

    const avgSaturation = saturationCount > 0 ? totalSaturation / saturationCount : 0;

    // 5. 计算变化值（与上月对比 - 简化版本，实际应该记录历史数据）
    // 这里暂时返回 0，后续可以通过添加历史数据表来实现
    const stats = {
      totalSuppliers,
      activeProjects,
      pendingEvaluations,
      avgSaturation: Math.round(avgSaturation),
      // 变化值暂时为 0，后续可以通过历史数据计算
      supplierChange: 0,
      projectChange: 0,
      evaluationChange: 0,
      saturationChange: 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
