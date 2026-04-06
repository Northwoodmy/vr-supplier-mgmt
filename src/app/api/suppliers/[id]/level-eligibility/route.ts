import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * 获取供应商等级变更资格
 * GET /api/suppliers/[id]/level-eligibility
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 获取供应商信息
    const supplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: '供应商不存在' },
        { status: 404 }
      );
    }

    // 获取最近 6 个月的质量评估
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    const reviews = await prisma.qualityReview.findMany({
      where: {
        supplierId: id,
        createdAt: { gte: sixMonthsAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (reviews.length === 0) {
      return NextResponse.json({
        canUpgrade: false,
        canDowngrade: false,
        avgScore: 0,
        consecutiveQuarters: 0,
        message: '无评估记录',
      });
    }

    // 计算平均分数
    const avgScore = reviews.reduce((sum, r) => sum + r.totalScore, 0) / reviews.length;

    // 导入等级配置判断升降级条件
    const { getLevelConfig } = await import('@/lib/supplier-level-config');
    const config = getLevelConfig(supplier.level);

    const canUpgrade = config.upgradeThreshold ? avgScore >= config.upgradeThreshold : false;
    const canDowngrade = config.downgradeThreshold ? avgScore < config.downgradeThreshold : false;

    return NextResponse.json({
      canUpgrade,
      canDowngrade,
      avgScore: Math.round(avgScore * 100) / 100,
      consecutiveQuarters: Math.min(Math.ceil(reviews.length / 2), 4),
      downgradeReason: canDowngrade
        ? `季度均分 ${avgScore.toFixed(2)} 低于阈值 ${config.downgradeThreshold}`
        : undefined,
      currentLevel: supplier.level,
      upgradeThreshold: config.upgradeThreshold,
      downgradeThreshold: config.downgradeThreshold,
    });
  } catch (error) {
    console.error('Failed to get level eligibility:', error);
    return NextResponse.json(
      { error: 'Failed to get level eligibility' },
      { status: 500 }
    );
  }
}
