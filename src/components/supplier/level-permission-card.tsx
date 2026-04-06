'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getLevelConfig, getLevelColorClass, getComplexityLabel } from '@/lib/supplier-level-config';

interface LevelPermissionCardProps {
  level: string;
  currentProjectCount: number;
  className?: string;
}

export function LevelPermissionCard({
  level,
  currentProjectCount,
  className,
}: LevelPermissionCardProps) {
  const config = getLevelConfig(level);
  const projectPercent = (currentProjectCount / config.maxProjects) * 100;
  const isAtLimit = currentProjectCount >= config.maxProjects;
  const isOverLimit = currentProjectCount > config.maxProjects;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Badge className={getLevelColorClass(level)}>
            {level}级 - {config.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 项目配额 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">当前项目</span>
            <span className={`font-medium ${isOverLimit ? 'text-red-600' : ''}`}>
              {currentProjectCount} / {config.maxProjects} 个
            </span>
          </div>
          <Progress
            value={Math.min(projectPercent, 100)}
            className={`h-2 ${
              isOverLimit
                ? '[&>div]:bg-red-500'
                : isAtLimit
                ? '[&>div]:bg-orange-500'
                : '[&>div]:bg-green-500'
            }`}
          />
          {isAtLimit && (
            <p className="text-xs text-red-600 font-medium">
              已达项目上限，不可分配新项目
            </p>
          )}
        </div>

        {/* 权益网格 */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
          <div>
            <div className="text-xs text-gray-500">付款周期</div>
            <div className="text-lg font-semibold text-gray-900">{config.paymentDays} 天</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">预付款比例</div>
            <div className="text-lg font-semibold text-gray-900">{config.prepaymentRate}%</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">项目优先级</div>
            <div className="text-lg font-semibold text-gray-900">{config.projectPriority}%</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">优质交付奖</div>
            <div className="text-lg font-semibold text-gray-900">{config.bonusRate}%</div>
          </div>
        </div>

        {/* 可承接项目类型 */}
        <div className="pt-3 border-t">
          <div className="text-xs text-gray-500 mb-2">可承接项目类型</div>
          <div className="flex flex-wrap gap-1">
            {config.allowedComplexity.map((type) => (
              <Badge key={type} variant="outline" className="text-xs">
                {getComplexityLabel(type)}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
