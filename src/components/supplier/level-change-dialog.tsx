'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getLevelConfig, getLevelColorClass } from '@/lib/supplier-level-config';

interface Supplier {
  id: string;
  name: string;
  level: string;
}

interface Eligibility {
  canUpgrade: boolean;
  canDowngrade: boolean;
  avgScore: number;
  consecutiveQuarters: number;
  downgradeReason?: string;
}

interface LevelChangeDialogProps {
  supplier: Supplier;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function LevelChangeDialog({
  supplier,
  open,
  onOpenChange,
  onSuccess,
}: LevelChangeDialogProps) {
  const [newLevel, setNewLevel] = useState<string>(supplier.level);
  const [reason, setReason] = useState('');
  const [changeType, setChangeType] = useState<'manual' | 'automatic'>('manual');
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 获取升降级资格
  useEffect(() => {
    if (open) {
      fetch(`/api/suppliers/${supplier.id}/level-eligibility`)
        .then(res => res.json())
        .then(data => setEligibility(data))
        .catch(console.error);
    }
  }, [open, supplier.id]);

  const handleSubmit = async () => {
    console.log('Submit level change:', { supplierId: supplier.id, newLevel, reason, changeType });
    if (!reason.trim()) {
      alert('请填写变更原因');
      return;
    }

    if (newLevel === supplier.level) {
      alert('请选择不同的等级');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/suppliers/level-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: supplier.id,
          newLevel,
          reason: reason.trim(),
          changeType,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || '操作失败');
      }

      onSuccess();
      onOpenChange(false);
      setReason('');
      setNewLevel(supplier.level);
    } catch (error) {
      console.error('Failed to change level:', error);
      alert(error instanceof Error ? error.message : '操作失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentConfig = getLevelConfig(supplier.level);
  const newConfig = getLevelConfig(newLevel);
  // 等级顺序：C < B < A < S (数值越大等级越高)
  const levelOrder: Record<string, number> = { 'C': 0, 'B': 1, 'A': 2, 'S': 3 };
  const isUpgrade = (levelOrder[newLevel] || 0) > (levelOrder[supplier.level] || 0);
  const isDowngrade = (levelOrder[newLevel] || 0) < (levelOrder[supplier.level] || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>调整供应商等级</DialogTitle>
          <DialogDescription>
            {supplier.name} - 当前等级：{currentConfig.label}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 当前等级 */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">当前等级</span>
                <Badge className={getLevelColorClass(supplier.level)}>
                  {supplier.level}级 - {currentConfig.label}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* 选择新等级 */}
          <div className="space-y-2">
            <Label>调整后等级</Label>
            <RadioGroup value={newLevel} onValueChange={(v) => {
              console.log('Level selected:', v);
              setNewLevel(v);
            }} className="grid grid-cols-2 gap-2">
              <Label
                className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                  newLevel === 'S'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <RadioGroupItem value="S" id="level-s" className="sr-only" />
                <div className="text-center">
                  <div className="font-semibold">S 级</div>
                  <div className="text-xs text-gray-500">战略合作伙伴</div>
                </div>
              </Label>
              <Label
                className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                  newLevel === 'A'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <RadioGroupItem value="A" id="level-a" className="sr-only" />
                <div className="text-center">
                  <div className="font-semibold">A 级</div>
                  <div className="text-xs text-gray-500">优质供应商</div>
                </div>
              </Label>
              <Label
                className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                  newLevel === 'B'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <RadioGroupItem value="B" id="level-b" className="sr-only" />
                <div className="text-center">
                  <div className="font-semibold">B 级</div>
                  <div className="text-xs text-gray-500">观察供应商</div>
                </div>
              </Label>
              <Label
                className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                  newLevel === 'C'
                    ? 'border-gray-400 bg-gray-100 text-gray-600'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <RadioGroupItem value="C" id="level-c" className="sr-only" />
                <div className="text-center">
                  <div className="font-semibold">C 级</div>
                  <div className="text-xs text-gray-500">淘汰供应商</div>
                </div>
              </Label>
            </RadioGroup>
          </div>

          {/* 等级变化提示 */}
          {newLevel !== supplier.level && (
            <Card className={isUpgrade ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {isUpgrade ? '↑ 升级：' : '↓ 降级：'}
                  </span>
                  <Badge className={getLevelColorClass(supplier.level)}>{supplier.level}</Badge>
                  <span className="text-gray-400">→</span>
                  <Badge className={getLevelColorClass(newLevel)}>{newLevel}</Badge>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  <p>• 最大项目数：{currentConfig.maxProjects} → {newConfig.maxProjects}</p>
                  <p>• 付款周期：{currentConfig.paymentDays}天 → {newConfig.paymentDays}天</p>
                  {isUpgrade && <p>• 预付款比例：{currentConfig.prepaymentRate}% → {newConfig.prepaymentRate}%</p>}
                  {isDowngrade && <p>• 优质交付奖：{currentConfig.bonusRate}% → {newConfig.bonusRate}%</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 系统建议 */}
          {eligibility && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 space-y-2">
                <div className="font-medium text-blue-900 text-sm">系统评估</div>
                <div className="text-xs text-gray-600">
                  近 2 季度均分：<span className="font-medium">{eligibility.avgScore?.toFixed(2)}</span>
                </div>
                {eligibility.canUpgrade && (
                  <p className="text-sm text-green-700 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    符合升级条件
                  </p>
                )}
                {eligibility.canDowngrade && (
                  <p className="text-sm text-red-700 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {eligibility.downgradeReason || '符合降级条件'}
                  </p>
                )}
                {!eligibility.canUpgrade && !eligibility.canDowngrade && (
                  <p className="text-sm text-gray-600">
                    当前不符合自动升降级条件，可手动调整
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* 变更类型 */}
          <div className="space-y-2">
            <Label>变更类型</Label>
            <RadioGroup value={changeType} onValueChange={(v) => setChangeType(v as 'manual' | 'automatic')}>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="manual" id="manual" />
                <Label htmlFor="manual" className="font-normal">手动调整</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="automatic" id="automatic" />
                <Label htmlFor="automatic" className="font-normal">自动调整（系统评估）</Label>
              </div>
            </RadioGroup>
          </div>

          {/* 变更原因 */}
          <div className="space-y-2">
            <Label>变更原因 <span className="text-red-500">*</span></Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="请输入等级变更的原因，例如：连续季度评分达标、重大质量事故等..."
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? '提交中...' : '确认调整'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
