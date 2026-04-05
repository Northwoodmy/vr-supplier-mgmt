import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

// 需要先安装 uuid
// npm install uuid
// npm install -D @types/uuid

const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
  remember: z.boolean().optional(),
});

const logoutSchema = z.object({});

export const authRouter = createTRPCRouter({
  // 登录
  login: publicProcedure.input(loginSchema).mutation(async ({ input, ctx }) => {
    const { username, password, remember } = input;

    // 查找用户
    const user = await prisma.user.findFirst({
      where: { username },
      include: {
        roles: {
          include: { role: true }
        }
      },
    });

    if (!user) {
      throw new Error('用户名或密码错误');
    }

    if (user.status !== 'active') {
      throw new Error('账号已被禁用');
    }

    // 验证密码
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error('用户名或密码错误');
    }

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 创建 session
    const sessionToken = uuidv4();
    const expires = remember
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 天
      : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 小时

    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires,
      },
    });

    // 设置 cookie
    const cookieStore = await cookies();
    cookieStore.set('next-auth.session-token', sessionToken, {
      httpOnly: true,
      secure: false, // 允许 HTTP 测试
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor((expires.getTime() - Date.now()) / 1000),
    });

    const roles = user.roles.map((r) => r.role.name);
    const permissions = user.roles.flatMap((r) => JSON.parse(r.role.permissions) as string[]);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        roles,
        permissions,
      },
    };
  }),

  // 登出
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('next-auth.session-token')?.value;

    if (sessionToken) {
      // 删除 session
      await prisma.session.delete({
        where: { sessionToken },
      }).catch(() => {});

      // 清除 cookie
      cookieStore.set('next-auth.session-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
    }

    return { success: true };
  }),

  // 获取当前用户
  me: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return null;
    }

    return {
      id: ctx.user.id,
      username: ctx.user.username,
      email: ctx.user.email,
      displayName: ctx.user.displayName,
      avatar: ctx.user.avatar,
      roles: ctx.user.roles,
      permissions: ctx.user.permissions,
    };
  }),

  // 检查认证状态
  checkAuth: publicProcedure.query(async ({ ctx }) => {
    return {
      isAuthenticated: !!ctx.user,
      user: ctx.user ? {
        id: ctx.user.id,
        username: ctx.user.username,
        email: ctx.user.email,
        displayName: ctx.user.displayName,
        roles: ctx.user.roles,
        permissions: ctx.user.permissions,
      } : null,
    };
  }),
});
