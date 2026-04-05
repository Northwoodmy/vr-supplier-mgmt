import { initTRPC } from '@trpc/server';

// 简化的 tRPC 初始化，用于客户端调用
const t = initTRPC.create();

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
