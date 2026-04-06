'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/lib/auth-hooks';

const statusOptions = [
  { value: 'planning', label: '筹备中' },
  { value: 'pre_production', label: '预制作' },
  { value: 'production', label: '制作中' },
  { value: 'review', label: '审核中' },
  { value: 'delivery', label: '交付中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

const stageOptions = [
  { value: 'planning', label: '筹备中' },
  { value: 'pre_production', label: '预制作' },
  { value: 'production', label: '制作中' },
  { value: 'review', label: '审核中' },
  { value: 'delivery', label: '交付中' },
  { value: 'completed', label: '已完成' },
  { value: 'paused', label: '已暂停' },
];

interface Project {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: string;
  currentStage: string;
  budget: number;
  actualCost?: number;
  startDate: string;
  endDate?: string;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
}

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const { data: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Project>({
    id: '',
    name: '',
    code: '',
    description: '',
    status: 'planning',
    currentStage: 'planning',
    budget: 0,
    actualCost: undefined,
    startDate: '',
    endDate: undefined,
    expectedDeliveryDate: '',
    actualDeliveryDate: undefined,
  });

  // 检查权限
  const canViewCost = currentUser?.permissions?.includes('project:manage');

  useEffect(() => {
    if (!params?.id) return;

    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setFormData({
            id: data.id,
            name: data.name,
            code: data.code,
            description: data.description || '',
            status: data.status,
            currentStage: data.currentStage,
            budget: data.budget || 0,
            actualCost: data.actualCost || undefined,
            startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '',
            endDate: data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : undefined,
            expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate).toISOString().split('T')[0] : '',
            actualDeliveryDate: data.actualDeliveryDate ? new Date(data.actualDeliveryDate).toISOString().split('T')[0] : undefined,
          });
        }
      } catch (error) {
        console.error('Failed to fetch project:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [params?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`/api/projects/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push(`/projects/${params.id}`);
      } else {
        const error = await res.json();
        throw new Error(error.error || '更新失败');
      }
    } catch (error: any) {
      alert(`更新失败：${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: keyof Project, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push(`/projects/${params.id}`)}>
          ← 返回
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900">编辑项目</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">项目名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">项目编码 *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => updateField('code', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">项目状态</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => updateField('status', value || '')}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {(value) => statusOptions.find(opt => opt.value === value)?.label || value}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentStage">当前阶段</Label>
                <Select
                  value={formData.currentStage}
                  onValueChange={(value) => updateField('currentStage', value || '')}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {(value) => stageOptions.find(opt => opt.value === value)?.label || value}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {stageOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">项目描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {canViewCost && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>预算与成本</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="budget">预算（元）</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => updateField('budget', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actualCost">实际成本（元）</Label>
                  <Input
                    id="actualCost"
                    type="number"
                    value={formData.actualCost || ''}
                    onChange={(e) => updateField('actualCost', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>时间信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">开始日期</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => updateField('startDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">结束日期</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => updateField('endDate', e.target.value || undefined)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedDeliveryDate">预计交付日期</Label>
                <Input
                  id="expectedDeliveryDate"
                  type="date"
                  value={formData.expectedDeliveryDate}
                  onChange={(e) => updateField('expectedDeliveryDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actualDeliveryDate">实际交付日期</Label>
                <Input
                  id="actualDeliveryDate"
                  type="date"
                  value={formData.actualDeliveryDate || ''}
                  onChange={(e) => updateField('actualDeliveryDate', e.target.value || undefined)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => router.push(`/projects/${params.id}`)}>
            取消
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? '保存中...' : '保存更改'}
          </Button>
        </div>
      </form>
    </div>
  );
}
