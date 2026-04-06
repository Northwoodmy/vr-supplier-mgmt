import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser, logAudit } from '@/lib/audit';

/**
 * 执行供应商等级变更
 * POST /api/suppliers/level-change
 */
export async function POST(request: Request) {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Level change request body:', body);
    const { supplierId, newLevel, reason, changeType = 'manual' } = body;

    if (!supplierId || !newLevel || !reason) {
      console.log('Missing required params:', { supplierId, newLevel, reason });
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    if (!['S', 'A', 'B', 'C'].includes(newLevel)) {
      return NextResponse.json(
        { error: '无效的等级' },
        { status: 400 }
      );
    }

    // 获取供应商当前信息
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: '供应商不存在' },
        { status: 404 }
      );
    }

    const oldLevel = supplier.level;

    // 等级未变化
    if (oldLevel === newLevel) {
      return NextResponse.json(
        { error: '新等级与当前等级相同' },
        { status: 400 }
      );
    }

    // 计算当前季度标识
    const now = new Date();
    const quarter = `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`;

    // 获取最近的评估记录计算均分
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const reviews = await prisma.qualityReview.findMany({
      where: {
        supplierId,
        createdAt: { gte: sixMonthsAgo },
      },
    });

    const avgScore = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.totalScore, 0) / reviews.length
      : null;

    // 更新供应商等级
    await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        level: newLevel,
        levelUpdatedAt: now,
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
        changedBy: currentUser.id,
        changeType: changeType as 'manual' | 'automatic',
        quarter,
        prevAvgScore: avgScore,
        nextAvgScore: null,
      },
    });

    // 记录审计日志
    await logAudit(
      currentUser.id,
      'LEVEL_CHANGE',
      'supplier',
      supplierId,
      `供应商等级从 ${oldLevel} 变更为 ${newLevel}：${reason}`,
      null,
      request.headers.get('user-agent'),
    );

    return NextResponse.json({
      success: true,
      supplierId,
      oldLevel,
      newLevel,
      changeLogId: changeLog.id,
      message: `供应商等级已从 ${oldLevel} 变更为 ${newLevel}`,
    });
  } catch (error) {
    console.error('Failed to change supplier level:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error('Error details:', errorMessage);
    return NextResponse.json(
      { error: '等级变更失败：' + errorMessage },
      { status: 500 }
    );
  }
}
