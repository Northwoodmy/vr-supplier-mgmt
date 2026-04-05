import { initTRPC } from '@trpc/server';
import { prisma } from '@/lib/prisma';

// 创建 tRPC 上下文（不包含 cookies）
export async function createTRPCContext() {
  return {
    user: null as { id: string; username: string; email: string; displayName?: string | null; avatar?: string | null; roles: string[]; permissions: string[] } | null,
    prisma,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<typeof createTRPCContext>().create();

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// 需要认证的 procedure
export const protectedProcedure = t.procedure.use(async (opts) => {
  if (!opts.ctx.user) {
    throw new Error('UNAUTHORIZED');
  }
  return opts.next({
    ctx: {
      ...opts.ctx,
      user: opts.ctx.user,
    },
  });
});

// 需要特定权限的 procedure
export const procedureWithPermission = (permission: string) =>
  protectedProcedure.use(async (opts) => {
    if (!opts.ctx.user?.permissions.includes(permission)) {
      throw new Error('FORBIDDEN');
    }
    return opts.next(opts);
  });
