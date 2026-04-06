/**
 * 供应商等级自动评估工具
 *
 * 用于定期（每季度）自动评估供应商等级变更资格
 */

import { prisma } from './prisma';
import { getLevelConfig } from './supplier-level-config';

interface AssessmentResult {
  supplierId: string;
  supplierName: string;
  currentLevel: string;
  suggestedLevel: string;
  changeType: 'upgrade' | 'downgrade' | 'unchanged';
  avgScore: number;
  consecutiveQuarters: number;
  reason: string;
}

/**
 * 计算当前季度标识
 */
export function getCurrentQuarter(): string {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  return `${now.getFullYear()}-Q${quarter}`;
}

/**
 * 评估单个供应商的等级变更资格
 */
export async function assessSupplierLevel(
  supplierId: string
): Promise<AssessmentResult | null> {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    include: {
      qualityReviews: {
        where: {
          createdAt: {
            gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 最近 6 个月
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!supplier) return null;

  const reviews = supplier.qualityReviews;
  if (reviews.length === 0) {
    return {
      supplierId: supplier.id,
      supplierName: supplier.name,
      currentLevel: supplier.level,
      suggestedLevel: supplier.level,
      changeType: 'unchanged',
      avgScore: 0,
      consecutiveQuarters: 0,
      reason: '无评估记录',
    };
  }

  // 计算平均分
  const avgScore = reviews.reduce((sum, r) => sum + r.totalScore, 0) / reviews.length;

  // 获取等级配置
  const config = getLevelConfig(supplier.level);
  const currentLevelIndex = ['C', 'B', 'A', 'S'].indexOf(supplier.level);

  let suggestedLevel = supplier.level;
  let changeType: 'upgrade' | 'downgrade' | 'unchanged' = 'unchanged';
  let reason = '';

  // 检查是否可升级
  if (config.upgradeThreshold && avgScore >= config.upgradeThreshold) {
    // 检查是否连续 2 个季度达标（简化为评估记录数>=2）
    const consecutiveQuarters = Math.min(Math.ceil(reviews.length / 2), 4);
    if (consecutiveQuarters >= 2 && currentLevelIndex < 3) {
      // 升级到下一级
      const nextLevel = ['C', 'B', 'A', 'S'][currentLevelIndex + 1];
      suggestedLevel = nextLevel;
      changeType = 'upgrade';
      reason = `连续 ${consecutiveQuarters} 季度评分达标 (均分：${avgScore.toFixed(2)})`;
    }
  }

  // 检查是否可降级（降级条件优先）
  if (config.downgradeThreshold && avgScore < config.downgradeThreshold) {
    if (currentLevelIndex > 0) {
      const nextLevel = ['C', 'B', 'A', 'S'][currentLevelIndex - 1];
      suggestedLevel = nextLevel;
      changeType = 'downgrade';
      reason = `季度均分 ${avgScore.toFixed(2)} 低于阈值 ${config.downgradeThreshold}`;
    }
  }

  return {
    supplierId: supplier.id,
    supplierName: supplier.name,
    currentLevel: supplier.level,
    suggestedLevel,
    changeType,
    avgScore: Math.round(avgScore * 100) / 100,
    consecutiveQuarters: Math.min(Math.ceil(reviews.length / 2), 4),
    reason,
  };
}

/**
 * 批量评估所有供应商
 */
export async function assessAllSuppliers(): Promise<AssessmentResult[]> {
  const suppliers = await prisma.supplier.findMany({
    where: {
      status: 'active', // 只评估活跃供应商
    },
  });

  const results = await Promise.all(
    suppliers.map(s => assessSupplierLevel(s.id))
  );

  return results.filter((r): r is AssessmentResult => r !== null);
}

/**
 * 执行自动等级变更
 * 对于符合自动变更条件的供应商执行等级调整
 */
export async function executeAutoLevelChanges(
  results: AssessmentResult[]
): Promise<{ success: number; skipped: number; failed: number }> {
  let success = 0;
  let skipped = 0;
  let failed = 0;

  const quarter = getCurrentQuarter();

  for (const result of results) {
    // 只处理建议变更的
    if (result.changeType === 'unchanged') {
      skipped++;
      continue;
    }

    try {
      // 执行等级变更
      await prisma.supplier.update({
        where: { id: result.supplierId },
        data: {
          level: result.suggestedLevel,
          levelUpdatedAt: new Date(),
          levelChangeReason: result.reason,
        },
      });

      // 记录变更日志
      await prisma.supplierLevelChangeLog.create({
        data: {
          supplierId: result.supplierId,
          oldLevel: result.currentLevel,
          newLevel: result.suggestedLevel,
          changeReason: result.reason,
          changedBy: 'system',
          changeType: 'automatic',
          quarter,
          prevAvgScore: result.avgScore,
          nextAvgScore: null,
        },
      });

      success++;
    } catch (error) {
      console.error(`Failed to update level for ${result.supplierId}:`, error);
      failed++;
    }
  }

  return { success, skipped, failed };
}

/**
 * 获取待评估供应商列表（用于手动审核）
 */
export async function getPendingLevelChanges(): Promise<AssessmentResult[]> {
  const results = await assessAllSuppliers();
  // 只返回建议变更的
  return results.filter(r => r.changeType !== 'unchanged');
}

/**
 * 运行完整评估流程
 */
export async function runLevelEvaluation(
  autoExecute: boolean = false
): Promise<{
  assessments: AssessmentResult[];
  execution?: { success: number; skipped: number; failed: number };
}> {
  const assessments = await assessAllSuppliers();

  let execution;
  if (autoExecute) {
    execution = await executeAutoLevelChanges(assessments);
  }

  return {
    assessments,
    execution,
  };
}
