import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import bcrypt from 'bcryptjs';

const userSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少 6 位'),
  displayName: z.string().optional(),
  avatar: z.string().optional(),
  roleIds: z.array(z.string()).optional(),
});

const updateUserSchema = z.object({
  id: z.string(),
  username: z.string().min(1).optional(),
  email: z.string().email().optional(),
  displayName: z.string().optional(),
  avatar: z.string().optional(),
  status: z.enum(['active', 'suspended', 'deleted']).optional(),
  roleIds: z.array(z.string()).optional(),
});

export const userRouter = createTRPCRouter({
  // 获取用户列表
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.permissions.includes('user:manage')) {
      throw new Error('无权访问用户管理');
    }

    const users = await prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => ({
      ...user,
      roles: user.roles.map((r) => r.role),
      passwordHash: undefined,
    }));
  }),

  // 获取用户详情
  getById: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    if (!ctx.user.permissions.includes('user:manage')) {
      throw new Error('无权访问用户管理');
    }

    const user = await prisma.user.findUnique({
      where: { id: input },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        auditLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    return {
      ...user,
      roles: user.roles.map((r) => r.role),
      passwordHash: undefined,
    };
  }),

  // 创建用户
  create: protectedProcedure.input(userSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.user.permissions.includes('user:create')) {
      throw new Error('无权创建用户');
    }

    const existing = await prisma.user.findFirst({
      where: { username: input.username },
    });

    if (existing) {
      throw new Error('用户名已存在');
    }

    const existingEmail = await prisma.user.findFirst({
      where: { email: input.email },
    });

    if (existingEmail) {
      throw new Error('邮箱已被使用');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        username: input.username,
        email: input.email,
        passwordHash,
        displayName: input.displayName,
        avatar: input.avatar,
        status: 'active',
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (input.roleIds && input.roleIds.length > 0) {
      for (const roleId of input.roleIds) {
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId,
            assignedBy: ctx.user.id,
          },
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: ctx.user.id,
        action: 'CREATE',
        resource: 'user',
        resourceId: user.id,
        details: JSON.stringify({ username: user.username, email: user.email }),
      },
    });

    return {
      ...user,
      roles: user.roles.map((r) => r.role),
      passwordHash: undefined,
    };
  }),

  // 更新用户
  update: protectedProcedure.input(updateUserSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.user.permissions.includes('user:edit')) {
      throw new Error('无权编辑用户');
    }

    const { id, roleIds, ...updateData } = input;

    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('用户不存在');
    }

    await prisma.user.update({
      where: { id },
      data: updateData,
    });

    if (roleIds) {
      await prisma.userRole.deleteMany({
        where: { userId: id },
      });

      for (const roleId of roleIds) {
        await prisma.userRole.create({
          data: {
            userId: id,
            roleId,
            assignedBy: ctx.user.id,
          },
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: ctx.user.id,
        action: 'UPDATE',
        resource: 'user',
        resourceId: id,
        details: JSON.stringify(updateData),
      },
    });

    return { success: true, userId: id };
  }),

  // 删除用户
  delete: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    if (!ctx.user.permissions.includes('user:delete')) {
      throw new Error('无权删除用户');
    }

    if (input === ctx.user.id) {
      throw new Error('不能删除自己的账号');
    }

    const user = await prisma.user.findUnique({
      where: { id: input },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    await prisma.user.update({
      where: { id: input },
      data: { status: 'deleted' },
    });

    await prisma.auditLog.create({
      data: {
        userId: ctx.user.id,
        action: 'DELETE',
        resource: 'user',
        resourceId: input,
        details: JSON.stringify({ username: user.username }),
      },
    });

    return { success: true };
  }),

  // 分配角色
  assignRole: protectedProcedure.input(z.object({ userId: z.string(), roleId: z.string() })).mutation(async ({ ctx, input }) => {
    if (!ctx.user.permissions.includes('user:assign-role')) {
      throw new Error('无权分配角色');
    }

    const existing = await prisma.userRole.findFirst({
      where: {
        userId: input.userId,
        roleId: input.roleId,
      },
    });

    if (existing) {
      throw new Error('用户已有此角色');
    }

    await prisma.userRole.create({
      data: {
        userId: input.userId,
        roleId: input.roleId,
        assignedBy: ctx.user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: ctx.user.id,
        action: 'ASSIGN_ROLE',
        resource: 'user',
        resourceId: input.userId,
        details: JSON.stringify({ roleId: input.roleId }),
      },
    });

    return { success: true };
  }),

  // 获取所有角色
  getRoles: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.permissions.includes('user:manage')) {
      throw new Error('无权访问用户管理');
    }

    return await prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
  }),
});
