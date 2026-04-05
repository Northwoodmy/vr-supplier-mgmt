import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 生产环境下使用绝对路径
const dbPath = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace('file:', '')
  : path.join(process.cwd(), 'dev.db');

const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// 不要在全局模块中调用 next/headers
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// 导出一个简单的方法来创建上下文
export function createSimpleContext() {
  return {
    user: null as { id: string; username: string; email: string; displayName?: string | null; avatar?: string | null; roles: string[]; permissions: string[] } | null,
    prisma,
  };
}
