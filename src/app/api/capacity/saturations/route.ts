import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// 阶段系数
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

    const saturations = suppliers.map((supplier) => {
      if (!supplier.capacity) return null;

      // 过滤活跃项目
      const activeProjects = supplier.projects.filter(
        (p) =>
          p.project.currentStage !== 'completed' &&
          p.project.currentStage !== 'cancelled'
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
          ? Math.round((totalLoad / supplier.capacity.monthlyCapacity) * 100)
          : 0;

      return {
        supplierId: supplier.id,
        supplierName: supplier.name,
        saturationRate,
        monthlyCapacity: supplier.capacity.monthlyCapacity,
        totalLoad: Math.round(totalLoad * 10) / 10,
        projectCount: activeProjects.length,
      };
    }).filter(Boolean);

    return NextResponse.json(saturations);
  } catch (error) {
    console.error('Failed to fetch capacity saturations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch capacity saturations' },
      { status: 500 }
    );
  }
}
