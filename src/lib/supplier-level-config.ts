/**
 * 供应商分级管理配置
 *
 * 定义 S/A/B/C 四个等级的权限和权益配置
 */

export interface SupplierLevelConfig {
  level: 'S' | 'A' | 'B' | 'C';
  label: string;
  description: string;
  color: 'purple' | 'blue' | 'green' | 'gray';

  // 项目限制
  maxProjects: number;        // 最大并行项目数
  projectPriority: number;    // 优先级百分比 (100/75/50/0)

  // 财务权益
  paymentDays: number;        // 付款周期 (天)
  prepaymentRate: number;     // 预付款比例 (0-100)

  // 可承接项目复杂度
  allowedComplexity: ('simple' | 'medium' | 'complex' | 'extreme')[];

  // 激励机制
  bonusRate: number;          // 优质交付奖金比例 (%)
  eligibleForQuarterlyBonus: boolean;  // 是否有资格参与季度评选

  // 升降级条件
  upgradeThreshold?: number;  // 升级所需的季度均分
  downgradeThreshold?: number; // 降级所需的季度均分
}

export const LEVEL_CONFIGS: Record<string, SupplierLevelConfig> = {
  S: {
    level: 'S',
    label: '战略合作伙伴',
    description: '长期战略合作伙伴，享受最高优先级和最优厚条件',
    color: 'purple',

    // 项目限制
    maxProjects: 4,
    projectPriority: 100,

    // 财务权益
    paymentDays: 15,
    prepaymentRate: 40,

    // 可承接项目类型
    allowedComplexity: ['simple', 'medium', 'complex', 'extreme'],

    // 激励机制
    bonusRate: 5,
    eligibleForQuarterlyBonus: true,

    // 升降级条件
    downgradeThreshold: 3.5,  // 季度均分低于 3.5 降级
  },

  A: {
    level: 'A',
    label: '优质供应商',
    description: '高质量稳定交付的优质供应商',
    color: 'blue',

    // 项目限制
    maxProjects: 3,
    projectPriority: 75,

    // 财务权益
    paymentDays: 30,
    prepaymentRate: 30,

    // 可承接项目类型
    allowedComplexity: ['simple', 'medium', 'complex'],

    // 激励机制
    bonusRate: 3,
    eligibleForQuarterlyBonus: true,

    // 升降级条件
    upgradeThreshold: 4.5,    // 连续 2 季度≥4.5 升级
    downgradeThreshold: 3.0,  // 季度均分低于 3.0 降级
  },

  B: {
    level: 'B',
    label: '观察供应商',
    description: '需要持续观察和改进的供应商',
    color: 'green',

    // 项目限制
    maxProjects: 2,
    projectPriority: 50,

    // 财务权益
    paymentDays: 45,
    prepaymentRate: 20,

    // 可承接项目类型
    allowedComplexity: ['simple', 'medium'],

    // 激励机制
    bonusRate: 0,
    eligibleForQuarterlyBonus: false,

    // 升降级条件
    upgradeThreshold: 4.0,    // 连续 2 季度≥4.0 升级
    downgradeThreshold: 2.5,  // 季度均分低于 2.5 降级
  },

  C: {
    level: 'C',
    label: '淘汰供应商',
    description: '即将淘汰的供应商，暂停新项目分配',
    color: 'gray',

    // 项目限制
    maxProjects: 0,
    projectPriority: 0,

    // 财务权益
    paymentDays: 60,
    prepaymentRate: 10,

    // 可承接项目类型
    allowedComplexity: ['simple'],

    // 激励机制
    bonusRate: 0,
    eligibleForQuarterlyBonus: false,

    // 升降级条件
    upgradeThreshold: 3.5,    // 连续 2 季度≥3.5 升级
  },
};

/**
 * 获取供应商等级配置
 */
export function getLevelConfig(level: string): SupplierLevelConfig {
  return LEVEL_CONFIGS[level] || LEVEL_CONFIGS.B;
}

/**
 * 检查供应商是否可以承接指定复杂度的项目
 */
export function canAcceptComplexity(level: string, complexity: 'simple' | 'medium' | 'complex' | 'extreme'): boolean {
  const config = getLevelConfig(level);
  return config.allowedComplexity.includes(complexity);
}

/**
 * 检查供应商是否可以承接新项目（未超过数量限制）
 */
export function canAcceptNewProject(level: string, currentProjectCount: number): boolean {
  const config = getLevelConfig(level);
  return currentProjectCount < config.maxProjects;
}

/**
 * 获取等级颜色类名
 */
export function getLevelColorClass(level: string): string {
  const colorMap: Record<string, string> = {
    S: 'bg-purple-100 text-purple-800 border-purple-300',
    A: 'bg-blue-100 text-blue-800 border-blue-300',
    B: 'bg-green-100 text-green-800 border-green-300',
    C: 'bg-gray-100 text-gray-800 border-gray-300',
  };
  return colorMap[level] || colorMap.B;
}

/**
 * 获取等级颜色（用于进度条等）
 */
export function getLevelColor(level: string): string {
  const colorMap: Record<string, string> = {
    S: '#9333ea',
    A: '#2563eb',
    B: '#16a34a',
    C: '#6b7280',
  };
  return colorMap[level] || colorMap.B;
}

/**
 * 获取复杂度标签文本
 */
export function getComplexityLabel(complexity: string): string {
  const labels: Record<string, string> = {
    simple: '简单',
    medium: '中等',
    complex: '复杂',
    extreme: '极复杂',
  };
  return labels[complexity] || complexity;
}

/**
 * 检查是否符合升级条件
 */
export function checkUpgradeEligibility(
  currentLevel: string,
  avgScore: number,
  consecutiveQuarters: number
): boolean {
  const config = getLevelConfig(currentLevel);
  if (!config.upgradeThreshold) return false;

  return avgScore >= config.upgradeThreshold && consecutiveQuarters >= 2;
}

/**
 * 检查是否符合降级条件
 */
export function checkDowngradeEligibility(
  currentLevel: string,
  avgScore: number,
  hasMajorIncident: boolean
): boolean {
  const config = getLevelConfig(currentLevel);

  // 重大事故直接降级
  if (hasMajorIncident) return true;

  // 季度均分低于阈值降级
  if (config.downgradeThreshold && avgScore < config.downgradeThreshold) {
    return true;
  }

  return false;
}
