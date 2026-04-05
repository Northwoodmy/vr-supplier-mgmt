import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';

const projectSchema = z.object({
  name: z.string().min(1, '请输入项目名称'),
  code: z.string().min(1, '请输入项目编号'),
  description: z.string().optional(),
  budget: z.number().positive().optional().or(z.literal(null)),
  actualCost: z.number().positive().optional().or(z.literal(null)),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  expectedDeliveryDate: z.string().optional().or(z.literal('')),
  status: z.enum(['planning', 'pre_production', 'production', 'review', 'delivery', 'completed', 'cancelled']).default('planning'),
  currentStage: z.enum(['planning', 'pre_production', 'production', 'review', 'delivery', 'paused']).default('planning'),
});

const supplierProjectSchema = z.object({
  supplierId: z.string(),
  estimatedManDays: z.number().int().positive().optional().or(z.literal(null)),
  complexityLevel: z.enum(['simple', 'medium', 'complex', 'extreme']).default('medium'),
  currentStage: z.enum(['planning', 'pre_production', 'production', 'review', 'delivery', 'paused']).default('planning'),
  workloadShare: z.number().min(0).max(1).default(1),
});

export const projectRouter = createTRPCRouter({
  // 获取项目列表
  list: publicProcedure.query(async () => {
    return prisma.project.findMany({
      include: {
        suppliers: {
          include: {
            supplier: true,
          },
        },
        deliveries: true,
        _count: {
          select: {
            suppliers: true,
            deliveries: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }),

  // 获取单个项目详情
  getById: publicProcedure.input(z.string()).query(async ({ input }) => {
    return prisma.project.findUnique({
      where: { id: input },
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
  }),

  // 创建项目
  create: protectedProcedure
    .input(z.object({
      project: projectSchema,
      suppliers: z.array(supplierProjectSchema).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.permissions?.includes('project:create')) {
        throw new Error('没有创建项目的权限');
      }

      const { project, suppliers } = input;

      // 格式化日期
      const data: any = {
        ...project,
        createdById: ctx.user.id,
        startDate: project.startDate ? new Date(project.startDate) : null,
        endDate: project.endDate ? new Date(project.endDate) : null,
        expectedDeliveryDate: project.expectedDeliveryDate ? new Date(project.expectedDeliveryDate) : null,
      };

      return prisma.project.create({
        data: {
          ...data,
          suppliers: suppliers ? {
            create: suppliers.map(sp => ({
              supplierId: sp.supplierId,
              estimatedManDays: sp.estimatedManDays,
              complexityLevel: sp.complexityLevel,
              currentStage: sp.currentStage,
              workloadShare: sp.workloadShare,
            }))
          } : undefined,
        },
        include: {
          suppliers: {
            include: {
              supplier: true,
            },
          },
        },
      });
    }),

  // 更新项目
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      project: projectSchema.partial(),
      suppliers: z.array(supplierProjectSchema.merge(z.object({
        id: z.string().optional(),
        currentLoad: z.number().optional(),
      }))).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.permissions?.includes('project:edit')) {
        throw new Error('没有编辑项目的权限');
      }

      const { id, project, suppliers } = input;

      // 格式化日期
      const data: any = {};
      if (project.startDate !== undefined) {
        data.startDate = project.startDate ? new Date(project.startDate) : null;
      }
      if (project.endDate !== undefined) {
        data.endDate = project.endDate ? new Date(project.endDate) : null;
      }
      if (project.expectedDeliveryDate !== undefined) {
        data.expectedDeliveryDate = project.expectedDeliveryDate ? new Date(project.expectedDeliveryDate) : null;
      }
      Object.assign(data, {
        name: project.name,
        code: project.code,
        description: project.description,
        budget: project.budget,
        actualCost: project.actualCost,
        status: project.status,
        currentStage: project.currentStage,
      });

      // 更新项目基本信息
      await prisma.project.update({
        where: { id },
        data,
      });

      // 更新供应商关联
      if (suppliers) {
        // 删除不存在的关联
        const existingIds = suppliers.filter(sp => sp.id).map(sp => sp.id!);
        if (existingIds.length > 0) {
          await prisma.supplierProject.deleteMany({
            where: {
              projectId: id,
              id: { notIn: existingIds },
            },
          });
        } else if (suppliers.length === 0) {
          // 如果传入空数组，删除所有关联
          await prisma.supplierProject.deleteMany({
            where: { projectId: id },
          });
        }

        // 更新或创建关联
        for (const sp of suppliers) {
          const spData = {
            estimatedManDays: sp.estimatedManDays,
            complexityLevel: sp.complexityLevel,
            currentStage: sp.currentStage,
            workloadShare: sp.workloadShare,
          };

          if (sp.id) {
            await prisma.supplierProject.update({
              where: { id: sp.id },
              data: spData,
            });
          } else {
            await prisma.supplierProject.create({
              data: {
                projectId: id,
                supplierId: sp.supplierId,
                ...spData,
              },
            });
          }
        }
      }

      return prisma.project.findUnique({
        where: { id },
        include: {
          suppliers: {
            include: {
              supplier: true,
            },
          },
        },
      });
    }),

  // 删除项目
  delete: protectedProcedure.input(z.string()).mutation(async ({ input, ctx }) => {
    if (!ctx.user?.permissions?.includes('project:delete')) {
      throw new Error('没有删除项目的权限');
    }

    return prisma.project.delete({
      where: { id: input },
    });
  }),

  // 更新项目阶段（触发产能重新计算）
  updateStage: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      supplierProjectId: z.string(),
      currentStage: z.enum(['planning', 'pre_production', 'production', 'review', 'delivery', 'paused']),
    }))
    .mutation(async ({ input, ctx }) => {
      const { supplierProjectId, currentStage } = input;

      return prisma.supplierProject.update({
        where: { id: supplierProjectId },
        data: { currentStage },
      });
    }),

  // 获取待评估项目列表
  getPendingEvaluations: publicProcedure.query(async () => {
    return prisma.project.findMany({
      where: {
        status: 'completed',
      },
      include: {
        suppliers: {
          include: {
            supplier: true,
          },
        },
        qualityReviews: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }),
});
