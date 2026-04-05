import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';

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

// 获取饱和度状态
function getSaturationStatus(rate: number): string {
  if (rate < 60) return 'available';
  if (rate < 80) return 'caution';
  if (rate < 100) return 'saturated';
  return 'overload';
}

// 计算单个供应商的饱和度
async function calculateSupplierSaturation(supplierId: string) {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    include: {
      capacity: true,
      projects: {
        include: {
          project: true,
        },
      },
    },
  });

  if (!supplier || !supplier.capacity) {
    return null;
  }

  // 过滤活跃项目
  const activeProjects = supplier.projects.filter(p =>
    p.project.currentStage !== 'completed' && p.project.currentStage !== 'cancelled'
  );

  const parallelCount = activeProjects.length;
  const parallelFactor = getParallelFactor(parallelCount);

  // 计算总负载
  let totalLoad = 0;
  for (const sp of activeProjects) {
    const project = sp.project;
    if (!sp.estimatedManDays || !project.expectedDeliveryDate || !project.startDate) {
      continue;
    }

    // 计算项目周期（月）
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.expectedDeliveryDate);
    const durationMonths = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

    // 月度负载
    const monthlyLoad = (sp.estimatedManDays / 22 / durationMonths) * sp.workloadShare;

    // 加权负载
    const complexityFactor = COMPLEXITY_FACTORS[sp.complexityLevel] || 1.0;
    const stageFactor = STAGE_FACTORS[sp.currentStage] || 0.5;

    totalLoad += monthlyLoad * complexityFactor * stageFactor;
  }

  // 应用并行损耗
  const weightedLoad = totalLoad * parallelFactor;

  // 饱和度
  const monthlyCapacity = supplier.capacity.monthlyCapacity;
  const saturationRate = monthlyCapacity > 0 ? (weightedLoad / monthlyCapacity) * 100 : 0;

  return {
    supplierId: supplier.id,
    supplierName: supplier.name,
    saturationRate: Math.round(saturationRate * 100) / 100,
    monthlyCapacity,
    totalLoad: Math.round(weightedLoad * 100) / 100,
    parallelCount,
    parallelFactor,
    status: getSaturationStatus(saturationRate),
  };
}

export const capacityRouter = createTRPCRouter({
  // 获取所有供应商的饱和度
  getAllSaturation: publicProcedure.query(async () => {
    const suppliers = await prisma.supplier.findMany({
      include: {
        capacity: true,
      },
      orderBy: { name: 'asc' },
    });

    const saturations = await Promise.all(
      suppliers.map(s => calculateSupplierSaturation(s.id))
    );

    return saturations.filter((s): s is NonNullable<typeof s> => s !== null);
  }),

  // 获取单个供应商的饱和度
  getSaturation: publicProcedure.input(z.string()).query(async ({ input }) => {
    return calculateSupplierSaturation(input);
  }),

  // 评估新项目对供应商的影响
  assessNewProject: protectedProcedure
    .input(z.object({
      supplierId: z.string(),
      estimatedManDays: z.number().int().positive(),
      complexityLevel: z.enum(['simple', 'medium', 'complex', 'extreme']),
      durationMonths: z.number().positive(),
      workloadShare: z.number().min(0).max(1).default(1),
      currentStage: z.enum(['planning', 'pre_production', 'production', 'review', 'delivery', 'paused']).default('production'),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.permissions?.includes('capacity:assess')) {
        throw new Error('没有访问产能评估的权限');
      }

      const { supplierId, estimatedManDays, complexityLevel, durationMonths, workloadShare, currentStage } = input;

      // 获取当前饱和度
      const current = await calculateSupplierSaturation(supplierId);
      if (!current) {
        throw new Error('供应商不存在或没有产能配置');
      }

      // 计算新项目的负载
      const monthlyLoad = (estimatedManDays / 22 / durationMonths) * workloadShare;
      const complexityFactor = COMPLEXITY_FACTORS[complexityLevel] || 1.0;
      const stageFactor = STAGE_FACTORS[currentStage] || 0.5;
      const newProjectLoad = monthlyLoad * complexityFactor * stageFactor;

      // 计算新的并行项目数
      const newParallelCount = current.parallelCount + 1;
      const newParallelFactor = getParallelFactor(newParallelCount);

      // 计算新的总负载（重新应用并行损耗）
      const newTotalLoad = (current.totalLoad / current.parallelFactor + newProjectLoad) * newParallelFactor;
      const newSaturationRate = (newTotalLoad / current.monthlyCapacity) * 100;

      const newStatus = getSaturationStatus(newSaturationRate);

      // 判断是否可以接新项目
      const canAccept = newSaturationRate < 80;
      const riskLevel = newSaturationRate < 60 ? 'low' : newSaturationRate < 80 ? 'medium' : 'high';

      // 生成建议
      let recommendation = '';
      if (canAccept) {
        recommendation = '该供应商可以承接新项目，当前产能充足。';
      } else if (newSaturationRate < 100) {
        recommendation = '该供应商产能已接近饱和，建议谨慎评估或寻找其他供应商。';
      } else {
        recommendation = '该供应商已超负荷，不建议分配新项目。请考虑其他供应商或推迟项目开始时间。';
      }

      // 替代方案建议
      const alternativeSuggestions: string[] = [];
      if (!canAccept) {
        alternativeSuggestions.push('考虑分配给饱和度较低的其他供应商');
        alternativeSuggestions.push('与供应商协商是否可以增加临时人力');
        if (newSaturationRate >= 100) {
          alternativeSuggestions.push('建议推迟新项目开始时间至当前项目完成');
        }
      }

      return {
        current: {
          saturationRate: current.saturationRate,
          status: current.status,
          totalLoad: current.totalLoad,
          monthlyCapacity: current.monthlyCapacity,
          parallelCount: current.parallelCount,
        },
        predicted: {
          saturationRate: Math.round(newSaturationRate * 100) / 100,
          status: newStatus,
          totalLoad: Math.round(newTotalLoad * 100) / 100,
          parallelCount: newParallelCount,
        },
        newProjectLoad: Math.round(newProjectLoad * 100) / 100,
        canAccept,
        riskLevel,
        recommendation,
        alternativeSuggestions,
      };
    }),

  // 获取产能概览统计
  getOverview: publicProcedure.query(async () => {
    const saturations = await prisma.supplier.findMany({
      include: {
        capacity: true,
        projects: true,
      },
    });

    let totalCapacity = 0;
    let totalLoad = 0;
    let availableCount = 0;
    let cautionCount = 0;
    let saturatedCount = 0;
    let overloadCount = 0;

    for (const supplier of saturations) {
      const saturation = await calculateSupplierSaturation(supplier.id);
      if (saturation) {
        totalCapacity += saturation.monthlyCapacity;
        totalLoad += saturation.totalLoad;

        switch (saturation.status) {
          case 'available':
            availableCount++;
            break;
          case 'caution':
            cautionCount++;
            break;
          case 'saturated':
            saturatedCount++;
            break;
          case 'overload':
            overloadCount++;
            break;
        }
      }
    }

    const totalSupplierCount = saturations.length;
    const avgSaturation = totalCapacity > 0 ? (totalLoad / totalCapacity) * 100 : 0;

    return {
      totalSupplierCount,
      availableCount,
      cautionCount,
      saturatedCount,
      overloadCount,
      totalCapacity: Math.round(totalCapacity * 100) / 100,
      totalLoad: Math.round(totalLoad * 100) / 100,
      avgSaturation: Math.round(avgSaturation * 100) / 100,
    };
  }),
});
