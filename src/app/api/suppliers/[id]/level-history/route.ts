import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const changes = await prisma.supplierLevelChangeLog.findMany({
      where: { supplierId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(changes);
  } catch (error) {
    console.error('Failed to fetch level change history:', error);
    return NextResponse.json(
      { error: '获取等级变更历史失败' },
      { status: 500 }
    );
  }
}
