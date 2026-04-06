'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { trpc } from '@/lib/trpc-client';
import { SaturationBadge } from './saturation-badge';

interface NewProjectAssessmentProps {
  supplierId: string;
  supplierName: string;
}

export function NewProjectAssessment({ supplierId, supplierName }: NewProjectAssessmentProps) {
  const [formData, setFormData] = useState({
    estimatedManDays: 100,
    complexityLevel: 'medium' as 'simple' | 'medium' | 'complex' | 'extreme',
    durationMonths: 2,
    workloadShare: 1,
    currentStage: 'production' as 'planning' | 'pre_production' | 'production' | 'review' | 'delivery' | 'paused',
  });

  const [showAssessment, setShowAssessment] = useState(false);

  const { data: currentSaturation } = trpc.capacity.getSaturation.useQuery(supplierId);
  const assessMutation = trpc.capacity.assessNewProject.useMutation();

  const handleAssess = async () => {
    try {
      await assessMutation.mutateAsync({
        supplierId,
        ...formData,
      });
      setShowAssessment(true);
    } catch (error) {
      console.error('评估失败:', error);
    }
  };

  const resetAssessment = () => {
    setShowAssessment(false);
    assessMutation.reset();
  };

  const predictedSaturation = assessMutation.data?.predicted.saturationRate;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>接新项目评估</CardTitle>
        <CardDescription>
          评估供应商 {supplierName} 承接新项目的影响
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 当前饱和度 */}
        <div className="space-y-2">
          <Label>当前产能状态</Label>
          {currentSaturation ? (
            <SaturationBadge saturationRate={currentSaturation.saturationRate} />
          ) : (
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
          )}
        </div>

        {/* 新项目参数 */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="manDays">预估人天</Label>
            <Input
              id="manDays"
              type="number"
              value={formData.estimatedManDays}
              onChange={(e) => setFormData({ ...formData, estimatedManDays: parseInt(e.target.value) || 0 })}
              disabled={showAssessment}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="complexity">复杂度</Label>
            <Select
              value={formData.complexityLevel}
              onValueChange={(value: any) => setFormData({ ...formData, complexityLevel: value })}
              disabled={showAssessment}
            >
              <SelectTrigger>
                <SelectValue placeholder="请选择复杂度" items={[
                  { value: 'simple', label: '简单 (0.8x)' },
                  { value: 'medium', label: '中等 (1.0x)' },
                  { value: 'complex', label: '复杂 (1.3x)' },
                  { value: 'extreme', label: '极复杂 (1.6x)' },
                ]} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">简单 (0.8x)</SelectItem>
                <SelectItem value="medium">中等 (1.0x)</SelectItem>
                <SelectItem value="complex">复杂 (1.3x)</SelectItem>
                <SelectItem value="extreme">极复杂 (1.6x)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">项目周期（月）</Label>
            <Input
              id="duration"
              type="number"
              value={formData.durationMonths}
              onChange={(e) => setFormData({ ...formData, durationMonths: parseInt(e.target.value) || 1 })}
              disabled={showAssessment}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workload">工作量占比</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[formData.workloadShare * 100]}
                onValueChange={(value) => setFormData({ ...formData, workloadShare: value[0] / 100 })}
                max={100}
                step={10}
                disabled={showAssessment}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12 text-right">
                {formData.workloadShare * 100}%
              </span>
            </div>
          </div>
        </div>

        {/* 评估按钮 */}
        {!showAssessment ? (
          <Button
            onClick={handleAssess}
            disabled={assessMutation.isPending}
            className="w-full"
          >
            {assessMutation.isPending ? '评估中...' : '开始评估'}
          </Button>
        ) : (
          <div className="space-y-4">
            {/* 评估结果 */}
            {assessMutation.data && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">承接前</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <SaturationBadge
                        saturationRate={assessMutation.data.current.saturationRate}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">承接后（预测）</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <SaturationBadge
                        saturationRate={predictedSaturation || 0}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* 建议 */}
                <div className={`p-4 rounded-lg ${
                  assessMutation.data.canAccept
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <p className="text-sm font-medium mb-2">
                    {assessMutation.data.canAccept ? '✅ 可以承接' : '⚠️ 不建议承接'}
                  </p>
                  <p className="text-sm text-gray-700">
                    {assessMutation.data.recommendation}
                  </p>
                </div>

                {/* 替代方案 */}
                {!assessMutation.data.canAccept && assessMutation.data.alternativeSuggestions.length > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium mb-2">替代方案建议：</p>
                    <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                      {assessMutation.data.alternativeSuggestions.map((suggestion, i) => (
                        <li key={i}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button
                  onClick={resetAssessment}
                  variant="outline"
                  className="w-full"
                >
                  重新评估
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
