import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createTRPCRouter, protectedProcedure } from '../trpc';

const auditLogFilterSchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().default(1),
  pageSize: z.number().default(20),
});

export const auditLogRouter = createTRPCRouter({
  // 获取审计日志列表
  list: protectedProcedure.input(auditLogFilterSchema).query(async ({ ctx, input }) => {
    if (!ctx.user.permissions.includes('audit:view')) {
      throw new Error('无权查看审计日志');
    }

    const { page, pageSize, userId, action, resource, startDate, endDate } = input;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (resource) where.resource = resource;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }),

  // 获取审计日志详情
  getById: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    if (!ctx.user.permissions.includes('audit:view')) {
      throw new Error('无权查看审计日志');
    }

    const log = await prisma.auditLog.findUnique({
      where: { id: input },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    if (!log) {
      throw new Error('日志不存在');
    }

    return log;
  }),

  // 获取操作类型统计
  getActionStats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.permissions.includes('audit:view')) {
      throw new Error('无权查看审计日志');
    }

    const stats = await prisma.auditLog.groupBy({
      by: ['action'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    return stats.map((s) => ({
      action: s.action ?? 'Unknown',
      count: s._count.id,
    }));
  }),

  // 获取资源类型统计
  getResourceStats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.permissions.includes('audit:view')) {
      throw new Error('无权查看审计日志');
    }

    const stats = await prisma.auditLog.groupBy({
      by: ['resource'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    return stats.map((s) => ({
      resource: s.resource ?? 'Unknown',
      count: s._count.id,
    }));
  }),

  // 获取用户操作统计
  getUserStats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.permissions.includes('audit:view')) {
      throw new Error('无权查看审计日志');
    }

    const stats = await prisma.auditLog.groupBy({
      by: ['userId'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    return stats.map((s) => ({
      userId: s.userId,
      count: s._count.id,
    }));
  }),
});
