import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';

// 6 维度评分 Schema
const evaluationSchema = z.object({
  projectId: z.string(),
  supplierId: z.string(),
  visualQuality: z.number().min(1).max(5),
  animationSmoothness: z.number().min(1).max(5),
  vfxMatch: z.number().min(1).max(5),
  audioQuality: z.number().min(1).max(5),
  cameraWork: z.number().min(1).max(5),
  storyNovelty: z.number().min(1).max(5),
  comments: z.string().optional(),
});

// 权重配置
const WEIGHTS = {
  visualQuality: 0.25,
  animationSmoothness: 0.20,
  vfxMatch: 0.15,
  audioQuality: 0.15,
  cameraWork: 0.15,
  storyNovelty: 0.10,
};

// 计算加权总分
function calculateTotalScore(evaluation: z.infer<typeof evaluationSchema>): number {
  return (
    evaluation.visualQuality * WEIGHTS.visualQuality +
    evaluation.animationSmoothness * WEIGHTS.animationSmoothness +
    evaluation.vfxMatch * WEIGHTS.vfxMatch +
    evaluation.audioQuality * WEIGHTS.audioQuality +
    evaluation.cameraWork * WEIGHTS.cameraWork +
    evaluation.storyNovelty * WEIGHTS.storyNovelty
  );
}

export const evaluationRouter = createTRPCRouter({
  // 获取评估列表
  list: publicProcedure.query(async () => {
    return prisma.qualityReview.findMany({
      include: {
        project: true,
        supplier: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }),

  // 获取单个评估详情
  getById: publicProcedure.input(z.string()).query(async ({ input }) => {
    return prisma.qualityReview.findUnique({
      where: { id: input },
      include: {
        project: true,
        supplier: true,
      },
    });
  }),

  // 获取项目的评估
  getByProject: publicProcedure.input(z.string()).query(async ({ input }) => {
    return prisma.qualityReview.findMany({
      where: { projectId: input },
      include: {
        supplier: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }),

  // 获取供应商的评估
  getBySupplier: publicProcedure.input(z.string()).query(async ({ input }) => {
    return prisma.qualityReview.findMany({
      where: { supplierId: input },
      include: {
        project: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }),

  // 创建/提交评估
  submit: protectedProcedure
    .input(evaluationSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.permissions?.includes('evaluation:create')) {
        throw new Error('没有创建评估的权限');
      }

      const totalScore = calculateTotalScore(input);

      return prisma.qualityReview.create({
        data: {
          ...input,
          reviewerId: ctx.user.id,
          totalScore,
          status: 'submitted',
        },
        include: {
          project: true,
          supplier: true,
        },
      });
    }),

  // 更新评估
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: evaluationSchema.partial(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.permissions?.includes('evaluation:edit')) {
        throw new Error('没有编辑评估的权限');
      }

      const { id, data } = input;

      // 获取现有评估
      const existing = await prisma.qualityReview.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error('评估不存在');
      }

      // 合并数据并重新计算总分
      const updated = { ...existing, ...data };
      const totalScore = calculateTotalScore(updated as any);

      return prisma.qualityReview.update({
        where: { id },
        data: {
          ...data,
          totalScore,
        },
        include: {
          project: true,
          supplier: true,
        },
      });
    }),

  // 删除评估
  delete: protectedProcedure.input(z.string()).mutation(async ({ input, ctx }) => {
    if (!ctx.user?.permissions?.includes('evaluation:edit')) {
      throw new Error('没有删除评估的权限');
    }

    return prisma.qualityReview.delete({
      where: { id: input },
    });
  }),

  // 计算性价比
  getCostPerformance: publicProcedure
    .input(z.object({
      supplierId: z.string(),
      year: z.number().int().optional(),
    }))
    .query(async ({ input }) => {
      const { supplierId, year } = input;

      // 获取评估
      const reviews = await prisma.qualityReview.findMany({
        where: {
          supplierId,
          ...(year ? {
            createdAt: {
              gte: new Date(`${year}-01-01`),
              lt: new Date(`${year + 1}-01-01`),
            },
          } : {}),
        },
        include: {
          project: true,
        },
      });

      // 获取项目费用
      const projectIds = [...new Set(reviews.map(r => r.projectId))];
      const projects = await prisma.project.findMany({
        where: {
          id: { in: projectIds },
        },
        select: {
          id: true,
          actualCost: true,
        },
      });

      // 计算平均质量分数
      const avgQuality = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.totalScore, 0) / reviews.length
        : 0;

      // 计算总费用
      const totalCost = projects.reduce((sum, p) => sum + (p.actualCost || 0), 0);

      // 性价比 = 平均质量 / (费用/10000)
      const costPerformance = totalCost > 0 ? avgQuality / (totalCost / 10000) : 0;

      return {
        avgQuality: Math.round(avgQuality * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        costPerformance: Math.round(costPerformance * 100) / 100,
        projectCount: reviews.length,
      };
    }),

  // 获取供应商年度统计
  getAnnualStats: publicProcedure
    .input(z.object({
      year: z.number().int(),
    }))
    .query(async ({ input }) => {
      const { year } = input;

      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year + 1}-01-01`);

      // 获取所有供应商
      const suppliers = await prisma.supplier.findMany({
        include: {
          qualityReviews: {
            where: {
              createdAt: {
                gte: startDate,
                lt: endDate,
              },
            },
            include: {
              project: true,
            },
          },
        },
      });

      const stats = await Promise.all(
        suppliers.map(async (supplier) => {
          const reviews = supplier.qualityReviews;

          if (reviews.length === 0) {
            return null;
          }

          const avgQuality = reviews.reduce((sum, r) => sum + r.totalScore, 0) / reviews.length;

          // 获取项目费用
          const projectIds = [...new Set(reviews.map(r => r.projectId))];
          const projects = await prisma.project.findMany({
            where: {
              id: { in: projectIds },
            },
            select: {
              actualCost: true,
            },
          });

          const totalCost = projects.reduce((sum, p) => sum + (p.actualCost || 0), 0);
          const costPerformance = totalCost > 0 ? avgQuality / (totalCost / 10000) : 0;

          // 保存或更新统计数据
          await prisma.supplierRating.upsert({
            where: {
              supplierId_year: {
                supplierId: supplier.id,
                year,
              },
            },
            update: {
              projectCount: reviews.length,
              avgQualityScore: avgQuality,
              totalCost,
              costPerformance,
            },
            create: {
              supplierId: supplier.id,
              year,
              projectCount: reviews.length,
              avgQualityScore: avgQuality,
              totalCost,
              costPerformance,
            },
          });

          return {
            supplier,
            stats: {
              projectCount: reviews.length,
              avgQualityScore: Math.round(avgQuality * 100) / 100,
              totalCost: Math.round(totalCost * 100) / 100,
              costPerformance: Math.round(costPerformance * 100) / 100,
            },
          };
        })
      );

      // 过滤掉没有数据的供应商并排序
      return stats
        .filter((s): s is NonNullable<typeof s> => s !== null)
        .sort((a, b) => b.stats.costPerformance - a.stats.costPerformance);
    }),
});
