'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/lib/auth-hooks';

interface Supplier {
  id: string;
  name: string;
  level: string;
  techStack: string;
  status: string;
}

interface Project {
  id: string;
  name: string;
  code: string;
  suppliers: Array<{
    id: string;
    supplierId: string;
    supplier: Supplier;
    estimatedManDays: number;
    complexityLevel: string;
    currentStage: string;
    workloadShare: number;
  }>;
}

const complexityOptions = [
  { value: 'simple', label: '简单', factor: 0.8 },
  { value: 'medium', label: '中等', factor: 1.0 },
  { value: 'complex', label: '复杂', factor: 1.3 },
  { value: 'extreme', label: '极复杂', factor: 1.6 },
];

const stageOptions = [
  { value: 'planning', label: '筹备中' },
  { value: 'pre_production', label: '预制作' },
  { value: 'production', label: '制作中' },
  { value: 'review', label: '审核中' },
  { value: 'delivery', label: '交付中' },
  { value: 'paused', label: '已暂停' },
];

export default function ProjectSuppliersPage() {
  const router = useRouter();
  const params = useParams();
  const { data: currentUser } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [availableSuppliers, setAvailableSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 新分配的供应商
  const [newAllocation, setNewAllocation] = useState({
    supplierId: '',
    estimatedManDays: 50,
    complexityLevel: 'medium',
    currentStage: 'production',
    workloadShare: 100,
  });

  useEffect(() => {
    if (!params?.id) return;

    async function fetchData() {
      try {
        const [projectRes, suppliersRes] = await Promise.all([
          fetch(`/api/projects/${params.id}`),
          fetch('/api/suppliers'),
        ]);

        if (projectRes.ok) {
          setProject(await projectRes.json());
        }
        if (suppliersRes.ok) {
          setAvailableSuppliers(await suppliersRes.json());
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [params?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAllocation.supplierId) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${params.id}/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: newAllocation.supplierId,
          estimatedManDays: newAllocation.estimatedManDays,
          complexityLevel: newAllocation.complexityLevel,
          currentStage: newAllocation.currentStage,
          workloadShare: newAllocation.workloadShare / 100,
        }),
      });

      if (res.ok) {
        router.push(`/projects/${params.id}`);
      } else {
        const error = await res.json();
        alert(`分配失败：${error.error}`);
      }
    } catch (error) {
      console.error('Failed to allocate supplier:', error);
      alert('分配失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500">项目不存在</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push('/projects')}>
              返回列表
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 过滤已分配的供应商
  const allocatedSupplierIds = project.suppliers.map(s => s.supplierId);
  const unallocatedSuppliers = availableSuppliers.filter(
    s => !allocatedSupplierIds.includes(s.id) && s.status === 'active'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push(`/projects/${params.id}`)}>
          ← 返回
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900">分配供应商</h1>
      </div>

      {/* Project Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">当前项目</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-semibold">{project.name}</div>
          <div className="text-sm text-gray-500">{project.code}</div>
        </CardContent>
      </Card>

      {/* Current Allocations */}
      {project.suppliers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>已分配供应商</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {project.suppliers.map((allocation) => (
                <div
                  key={allocation.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{allocation.supplier.name}</div>
                    <div className="text-sm text-gray-500">
                      预估工时：{allocation.estimatedManDays} 人天 |
                      复杂度：{complexityOptions.find(c => c.value === allocation.complexityLevel)?.label} |
                      负载占比：{(allocation.workloadShare * 100).toFixed(0)}%
                    </div>
                  </div>
                  <Badge variant="outline">{allocation.supplier.level}级</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Allocation Form */}
      <Card>
        <CardHeader>
          <CardTitle>添加新供应商</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>选择供应商 *</Label>
              <Select
                value={newAllocation.supplierId}
                onValueChange={(value) => setNewAllocation({ ...newAllocation, supplierId: value || '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择供应商" items={unallocatedSuppliers.map(s => ({ value: s.id, label: s.name }))} />
                </SelectTrigger>
                <SelectContent>
                  {unallocatedSuppliers.length === 0 ? (
                    <SelectItem value="none" disabled>没有可用供应商</SelectItem>
                  ) : (
                    unallocatedSuppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name} ({supplier.level}级 | {supplier.techStack})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>预估工时 (人天)</Label>
                <Input
                  type="number"
                  value={newAllocation.estimatedManDays}
                  onChange={(e) => setNewAllocation({ ...newAllocation, estimatedManDays: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>复杂度</Label>
                <Select
                  value={newAllocation.complexityLevel}
                  onValueChange={(value) => setNewAllocation({ ...newAllocation, complexityLevel: value || 'medium' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择复杂度" items={complexityOptions} />
                  </SelectTrigger>
                  <SelectContent>
                    {complexityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>当前阶段</Label>
                <Select
                  value={newAllocation.currentStage}
                  onValueChange={(value) => setNewAllocation({ ...newAllocation, currentStage: value || 'production' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择当前阶段" items={stageOptions} />
                  </SelectTrigger>
                  <SelectContent>
                    {stageOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>工作量占比 (%)</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={newAllocation.workloadShare}
                onChange={(e) => setNewAllocation({ ...newAllocation, workloadShare: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-gray-500">如果有多个供应商，总占比应该为 100%</p>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.push(`/projects/${params.id}`)}>
                取消
              </Button>
              <Button type="submit" disabled={submitting || !newAllocation.supplierId}>
                {submitting ? '分配中...' : '确认分配'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
