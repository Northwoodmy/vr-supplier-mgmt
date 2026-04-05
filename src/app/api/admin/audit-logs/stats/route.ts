import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 获取操作类型统计
    const actionStats = await prisma.auditLog.groupBy({
      by: ['action'],
      _count: true,
    });

    // 获取资源类型统计
    const resourceStats = await prisma.auditLog.groupBy({
      by: ['resource'],
      _count: true,
    });

    // 获取用户统计
    const userStats = await prisma.auditLog.groupBy({
      by: ['userId'],
      _count: true,
      orderBy: {
        _count: {
          userId: 'desc',
        },
      },
      take: 10,
    });

    return NextResponse.json({
      actions: actionStats.map((s) => ({ action: s.action, count: s._count })),
      resources: resourceStats.map((s) => ({ resource: s.resource, count: s._count })),
      users: userStats.map((s) => ({ userId: s.userId, count: s._count })),
    });
  } catch (error) {
    console.error('Failed to fetch audit stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit stats' },
      { status: 500 }
    );
  }
}
