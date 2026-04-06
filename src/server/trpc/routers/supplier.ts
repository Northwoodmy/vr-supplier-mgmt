import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';

const supplierSchema = z.object({
  name: z.string().min(1, '请输入供应商名称'),
  companyName: z.string().optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email('请输入有效的邮箱地址').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  level: z.enum(['S', 'A', 'B', 'C']).default('B'),
  techStack: z.string(),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive', 'blacklisted']).default('active'),

  // 资质信息
  legalRepresentative: z.string().optional(),
  establishedDate: z.date().optional().or(z.string().optional()),
  registeredCapital: z.number().optional(),
  businessLicense: z.string().optional(),
  businessScope: z.string().optional(),

  // 财务信息
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
  taxType: z.string().optional(),

  // 其他
  creditRecord: z.string().optional(),
  remarks: z.string().optional(),

  // JSON 字段（核心成员、设备情况、代表作品）
  coreMembers: z.any().optional(),
  equipment: z.any().optional(),
  sampleWorks: z.any().optional(),
});

const teamMemberSchema = z.object({
  role: z.string(),
  category: z.string(),
  count: z.number().int().positive(),
  seniorCount: z.number().int().nonnegative().default(0),
});

const capacitySchema = z.object({
  totalMembers: z.number().int().positive(),
  capacityFactor: z.number().positive().default(0.8),
});

export const supplierRouter = createTRPCRouter({
  // 获取供应商列表
  list: publicProcedure.query(async () => {
    return prisma.supplier.findMany({
      include: {
        teamMembers: true,
        capacity: true,
        _count: {
          select: { projects: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }),

  // 获取单个供应商详情
  getById: publicProcedure.input(z.string()).query(async ({ input }) => {
    return prisma.supplier.findUnique({
      where: { id: input },
      include: {
        teamMembers: true,
        capacity: true,
        projects: {
          include: {
            project: true
          }
        },
        qualityReviews: true,
        ratings: true,
        levelChanges: true,
        trainings: true,
      },
    });
  }),

  // 创建供应商
  create: protectedProcedure
    .input(z.object({
      supplier: supplierSchema,
      teamMembers: z.array(teamMemberSchema).optional(),
      capacity: capacitySchema.optional(),
      coreMembers: z.any().optional(),
      equipments: z.any().optional(),
      sampleWorks: z.any().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.permissions?.includes('supplier:create')) {
        throw new Error('没有创建供应商的权限');
      }

      const { supplier, teamMembers, capacity, coreMembers, equipments, sampleWorks } = input;

      return prisma.supplier.create({
        data: {
          ...supplier,
          establishedDate: supplier.establishedDate ? new Date(supplier.establishedDate) : null,
          createdById: ctx.user.id,
          coreMembers: coreMembers && coreMembers.length > 0 ? JSON.stringify(coreMembers) : null,
          equipment: equipments && equipments.length > 0 ? JSON.stringify(equipments) : null,
          sampleWorks: sampleWorks && sampleWorks.length > 0 ? JSON.stringify(sampleWorks) : null,
          teamMembers: teamMembers && teamMembers.length > 0 ? {
            create: teamMembers.map(tm => ({
              role: tm.role,
              category: tm.category,
              count: tm.count,
              seniorCount: tm.seniorCount,
            }))
          } : undefined,
          capacity: capacity ? {
            create: {
              totalMembers: capacity.totalMembers,
              capacityFactor: capacity.capacityFactor,
              monthlyCapacity: capacity.totalMembers * capacity.capacityFactor,
            }
          } : undefined,
        },
        include: {
          teamMembers: true,
          capacity: true,
        },
      });
    }),

  // 更新供应商
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      supplier: supplierSchema.partial(),
      teamMembers: z.array(teamMemberSchema.merge(z.object({ id: z.string().optional() }))).optional(),
      capacity: capacitySchema.partial().optional(),
      coreMembers: z.any().optional(),
      equipments: z.any().optional(),
      sampleWorks: z.any().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.permissions?.includes('supplier:edit')) {
        throw new Error('没有编辑供应商的权限');
      }

      const { id, supplier, teamMembers, capacity, coreMembers, equipments, sampleWorks } = input;

      // 更新供应商基本信息
      await prisma.supplier.update({
        where: { id },
        data: {
          ...supplier,
          establishedDate: supplier.establishedDate ? new Date(supplier.establishedDate) : null,
          coreMembers: coreMembers !== undefined ? (coreMembers && coreMembers.length > 0 ? JSON.stringify(coreMembers) : null) : undefined,
          equipment: equipments !== undefined ? (equipments && equipments.length > 0 ? JSON.stringify(equipments) : null) : undefined,
          sampleWorks: sampleWorks !== undefined ? (sampleWorks && sampleWorks.length > 0 ? JSON.stringify(sampleWorks) : null) : undefined,
        },
      });

      // 更新团队架构
      if (teamMembers) {
        // 删除不存在的成员
        const existingIds = teamMembers.filter(tm => tm.id).map(tm => tm.id!);
        if (existingIds.length > 0) {
          await prisma.teamMember.deleteMany({
            where: {
              supplierId: id,
              id: { notIn: existingIds },
            },
          });
        }

        // 更新或创建成员
        for (const tm of teamMembers) {
          if (tm.id) {
            await prisma.teamMember.update({
              where: { id: tm.id },
              data: {
                role: tm.role,
                category: tm.category,
                count: tm.count,
                seniorCount: tm.seniorCount,
              },
            });
          } else {
            await prisma.teamMember.create({
              data: {
                supplierId: id,
                role: tm.role,
                category: tm.category,
                count: tm.count,
                seniorCount: tm.seniorCount,
              },
            });
          }
        }
      }

      // 更新产能配置
      if (capacity) {
        const existingCapacity = await prisma.supplierCapacity.findUnique({
          where: { supplierId: id },
        });

        if (existingCapacity) {
          await prisma.supplierCapacity.update({
            where: { supplierId: id },
            data: {
              totalMembers: capacity.totalMembers ?? existingCapacity.totalMembers,
              capacityFactor: capacity.capacityFactor ?? existingCapacity.capacityFactor,
              monthlyCapacity: (capacity.totalMembers ?? existingCapacity.totalMembers) *
                               (capacity.capacityFactor ?? existingCapacity.capacityFactor),
            },
          });
        } else if (capacity.totalMembers) {
          await prisma.supplierCapacity.create({
            data: {
              supplierId: id,
              totalMembers: capacity.totalMembers,
              capacityFactor: capacity.capacityFactor ?? 0.8,
              monthlyCapacity: capacity.totalMembers * (capacity.capacityFactor ?? 0.8),
            },
          });
        }
      }

      return prisma.supplier.findUnique({
        where: { id },
        include: {
          teamMembers: true,
          capacity: true,
        },
      });
    }),

  // 删除供应商
  delete: protectedProcedure.input(z.string()).mutation(async ({ input, ctx }) => {
    if (!ctx.user?.permissions?.includes('supplier:delete')) {
      throw new Error('没有删除供应商的权限');
    }

    return prisma.supplier.delete({
      where: { id: input },
    });
  }),

  // 获取供应商饱和度
  getSaturation: publicProcedure.input(z.string()).query(async ({ input }) => {
    const supplier = await prisma.supplier.findUnique({
      where: { id: input },
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

    // 计算产能饱和度
    const stageFactors: Record<string, number> = {
      planning: 0.2,
      pre_production: 0.5,
      production: 1.0,
      review: 0.8,
      delivery: 0.6,
      paused: 0.1,
    };

    const complexityFactors: Record<string, number> = {
      simple: 0.8,
      medium: 1.0,
      complex: 1.3,
      extreme: 1.6,
    };

    // 计算并行项目数
    const activeProjects = supplier.projects.filter(p =>
      p.project.currentStage !== 'completed' && p.project.currentStage !== 'cancelled'
    );
    const parallelCount = activeProjects.length;

    // 并行损耗系数
    const parallelFactor = parallelCount <= 1 ? 1.0 :
                          parallelCount === 2 ? 1.15 :
                          parallelCount === 3 ? 1.35 : 1.6;

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
      const complexityFactor = complexityFactors[sp.complexityLevel] || 1.0;
      const stageFactor = stageFactors[sp.currentStage] || 0.5;

      totalLoad += monthlyLoad * complexityFactor * stageFactor;
    }

    // 应用并行损耗
    const weightedLoad = totalLoad * parallelFactor;

    // 饱和度
    const monthlyCapacity = supplier.capacity.monthlyCapacity;
    const saturationRate = monthlyCapacity > 0 ? (weightedLoad / monthlyCapacity) * 100 : 0;

    return {
      saturationRate: Math.round(saturationRate * 100) / 100,
      monthlyCapacity,
      totalLoad: Math.round(weightedLoad * 100) / 100,
      parallelCount,
      status: saturationRate < 60 ? 'available' :
              saturationRate < 80 ? 'caution' :
              saturationRate < 100 ? 'saturated' : 'overload',
    };
  }),

  // 获取等级变更资格
  getLevelChangeEligibility: protectedProcedure.input(z.string()).query(async ({ input }) => {
    const supplierId = input;

    // 获取最近 2 个季度的质量评估
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    const reviews = await prisma.qualityReview.findMany({
      where: {
        supplierId,
        createdAt: { gte: sixMonthsAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (reviews.length === 0) {
      return {
        canUpgrade: false,
        canDowngrade: false,
        avgScore: 0,
        consecutiveQuarters: 0,
        message: '无评估记录',
      };
    }

    // 计算平均分数
    const avgScore = reviews.reduce((sum, r) => sum + r.totalScore, 0) / reviews.length;

    // 简单判断：均分>=4.5 可升级，<3.0 可降级
    const canUpgrade = avgScore >= 4.5;
    const canDowngrade = avgScore < 3.0;

    return {
      canUpgrade,
      canDowngrade,
      avgScore: Math.round(avgScore * 100) / 100,
      consecutiveQuarters: Math.min(Math.ceil(reviews.length / 2), 4),
      downgradeReason: canDowngrade ? '季度均分低于 3.0' : undefined,
    };
  }),

  // 执行等级变更
  updateLevel: protectedProcedure
    .input(z.object({
      supplierId: z.string(),
      newLevel: z.enum(['S', 'A', 'B', 'C']),
      reason: z.string().min(1, '请输入变更原因'),
      changeType: z.enum(['manual', 'automatic']).default('manual'),
      quarter: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.permissions?.includes('supplier:manage')) {
        throw new Error('没有管理供应等级变更的权限');
      }

      const { supplierId, newLevel, reason, changeType, quarter } = input;

      // 获取当前等级
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
      });

      if (!supplier) {
        throw new Error('供应商不存在');
      }

      const oldLevel = supplier.level;

      // 等级未变化
      if (oldLevel === newLevel) {
        throw new Error('新等级与当前等级相同');
      }

      // 更新供应商等级
      await prisma.supplier.update({
        where: { id: supplierId },
        data: {
          level: newLevel,
          levelUpdatedAt: new Date(),
          levelChangeReason: reason,
        },
      });

      // 记录变更日志
      const changeLog = await prisma.supplierLevelChangeLog.create({
        data: {
          supplierId,
          oldLevel,
          newLevel,
          changeReason: reason,
          changedBy: ctx.user.id,
          changeType,
          quarter,
          prevAvgScore: null,
          nextAvgScore: null,
        },
      });

      return {
        success: true,
        supplierId,
        oldLevel,
        newLevel,
        changeLogId: changeLog.id,
      };
    }),

  // 获取等级变更历史
  getLevelChangeHistory: publicProcedure.input(z.string()).query(async ({ input }) => {
    return prisma.supplierLevelChangeLog.findMany({
      where: { supplierId: input },
      orderBy: { createdAt: 'desc' },
    });
  }),
});
