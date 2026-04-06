'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-hooks';

interface Supplier {
  id: string;
  name: string;
  level: string;
  techStack: string;
  status: string;
}

interface Saturation {
  supplierId: string;
  saturationRate: number;
  status: string;
}

interface SupplierProjectFormData {
  id?: string;
  supplierId: string;
  estimatedManDays: number | null;
  complexityLevel: 'simple' | 'medium' | 'complex' | 'extreme';
  currentStage: 'planning' | 'pre_production' | 'production' | 'review' | 'delivery' | 'paused';
  workloadShare: number;
}

const COMPLEXITY_OPTIONS = [
  { value: 'simple', label: '简单', factor: '0.8' },
  { value: 'medium', label: '中等', factor: '1.0' },
  { value: 'complex', label: '复杂', factor: '1.3' },
  { value: 'extreme', label: '极复杂', factor: '1.6' },
];

const STAGE_OPTIONS = [
  { value: 'planning', label: '筹备中' },
  { value: 'pre_production', label: '预制作' },
  { value: 'production', label: '制作中' },
  { value: 'review', label: '审核中' },
  { value: 'delivery', label: '交付中' },
  { value: 'paused', label: '已暂停' },
];

const STATUS_OPTIONS = [
  { value: 'planning', label: '筹备中' },
  { value: 'pre_production', label: '预制作' },
  { value: 'production', label: '制作中' },
  { value: 'review', label: '审核中' },
  { value: 'delivery', label: '交付中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

interface ProjectFormData {
  name: string;
  code: string;
  description: string;
  status: string;
  currentStage: string;
  budget: string;
  actualCost: string;
  startDate: string;
  endDate: string;
  expectedDeliveryDate: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const { data: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedSuppliers, setSelectedSuppliers] = useState<SupplierProjectFormData[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [saturations, setSaturations] = useState<Saturation[]>([]);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    code: '',
    description: '',
    status: 'planning',
    currentStage: 'planning',
    budget: '',
    actualCost: '',
    startDate: '',
    endDate: '',
    expectedDeliveryDate: '',
  });

  // 检查权限
  const canViewCost = currentUser?.permissions?.includes('project:manage');

  useEffect(() => {
    async function fetchData() {
      try {
        const [suppliersRes, saturationsRes] = await Promise.all([
          fetch('/api/suppliers'),
          fetch('/api/capacity/saturations'),
        ]);
        if (suppliersRes.ok) {
          setSuppliers(await suppliersRes.json());
        }
        if (saturationsRes.ok) {
          setSaturations(await saturationsRes.json());
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    }
    fetchData();
  }, []);

  const getSaturationStatus = (supplierId: string) => {
    return saturations.find(s => s.supplierId === supplierId);
  };

  const addSupplier = () => {
    setSelectedSuppliers([
      ...selectedSuppliers,
      { supplierId: '', estimatedManDays: null, complexityLevel: 'medium', currentStage: 'planning', workloadShare: 1 },
    ]);
  };

  const removeSupplier = (index: number) => {
    setSelectedSuppliers(selectedSuppliers.filter((_, i) => i !== index));
  };

  const updateSupplier = (index: number, field: keyof SupplierProjectFormData, value: any) => {
    const updated = [...selectedSuppliers];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedSuppliers(updated);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const projectData = {
      name: formData.name,
      code: formData.code,
      description: formData.description || undefined,
      budget: formData.budget ? parseFloat(formData.budget) : null,
      actualCost: formData.actualCost ? parseFloat(formData.actualCost) : null,
      startDate: formData.startDate || '',
      endDate: formData.endDate || '',
      expectedDeliveryDate: formData.expectedDeliveryDate || '',
      status: formData.status,
      currentStage: formData.currentStage,
    };

    const validSuppliers = selectedSuppliers.filter(sp => sp.supplierId);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: projectData,
          suppliers: validSuppliers.length > 0 ? validSuppliers : undefined,
        }),
      });

      if (res.ok) {
        router.push('/projects');
      } else {
        const error = await res.json();
        throw new Error(error.error || '创建失败');
      }
    } catch (error: any) {
      alert(`创建失败：${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push('/projects')}>
          ← 返回列表
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900">新建项目</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 项目信息 */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">项目名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入项目名称"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">项目编号 *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="例如：PRJ-2024-001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">项目状态</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value || 'planning' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择项目状态" items={STATUS_OPTIONS} />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
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
                  onValueChange={(value) => setFormData(prev => ({ ...prev, currentStage: value || 'planning' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择当前阶段" items={STAGE_OPTIONS} />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGE_OPTIONS.map((opt) => (
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
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请输入项目描述"
                rows={3}
              />
            </div>

            {/* 预算和周期 */}
            {canViewCost && (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="budget">预算（元）</Label>
                  <Input
                    id="budget"
                    value={formData.budget}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                    type="number"
                    placeholder="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actualCost">实际成本（元）</Label>
                  <Input
                    id="actualCost"
                    value={formData.actualCost}
                    onChange={(e) => setFormData(prev => ({ ...prev, actualCost: e.target.value }))}
                    type="number"
                    placeholder="0"
                    step="0.01"
                  />
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="expectedDeliveryDate">预计交付日期</Label>
                <Input
                  id="expectedDeliveryDate"
                  value={formData.expectedDeliveryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                  type="date"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">开始日期</Label>
                <Input
                  id="startDate"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  type="date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">结束日期</Label>
                <Input
                  id="endDate"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  type="date"
                />
              </div>
            </div>

            {/* 供应商分配 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">供应商分配</h3>
                <Button type="button" variant="outline" size="sm" onClick={addSupplier}>
                  <Plus className="w-4 h-4 mr-2" />
                  添加供应商
                </Button>
              </div>

              {selectedSuppliers.length === 0 ? (
                <div className="p-8 border border-dashed rounded-lg text-center text-gray-500">
                  暂未分配供应商，点击上方按钮添加
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedSuppliers.map((item, index) => {
                    const saturation = getSaturationStatus(item.supplierId);
                    const supplier = suppliers.find(s => s.id === item.supplierId);
                    return (
                      <Card key={index}>
                        <CardContent className="p-4 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 grid md:grid-cols-4 gap-4">
                              <div className="space-y-2">
                                <Label>供应商</Label>
                                <Select
                                  value={item.supplierId}
                                  onValueChange={(value) => updateSupplier(index, 'supplierId', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="选择供应商" items={suppliers.map(s => ({ value: s.id, label: s.name }))} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {suppliers.map((s: any) => (
                                      <SelectItem key={s.id} value={s.id}>
                                        {s.name} ({s.level}级)
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>预估人天</Label>
                                <Input
                                  type="number"
                                  value={item.estimatedManDays || ''}
                                  onChange={(e) => updateSupplier(index, 'estimatedManDays', e.target.value ? parseInt(e.target.value) : null)}
                                  placeholder="0"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>复杂度</Label>
                                <Select
                                  value={item.complexityLevel}
                                  onValueChange={(value: any) => updateSupplier(index, 'complexityLevel', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="请选择复杂度" items={COMPLEXITY_OPTIONS} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="simple">简单 (0.8)</SelectItem>
                                    <SelectItem value="medium">中等 (1.0)</SelectItem>
                                    <SelectItem value="complex">复杂 (1.3)</SelectItem>
                                    <SelectItem value="extreme">极复杂 (1.6)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>工作量占比</Label>
                                <Select
                                  value={item.workloadShare.toString()}
                                  onValueChange={(value) => updateSupplier(index, 'workloadShare', parseFloat(value || '1'))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="请选择工作量占比" items={[
                                      { value: '1', label: '100% 独占' },
                                      { value: '0.5', label: '50% 共享' },
                                      { value: '0.3', label: '30% 共享' },
                                      { value: '0.25', label: '25% 共享' },
                                    ]} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">100% 独占</SelectItem>
                                    <SelectItem value="0.5">50% 共享</SelectItem>
                                    <SelectItem value="0.3">30% 共享</SelectItem>
                                    <SelectItem value="0.25">25% 共享</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSupplier(index)}
                              className="ml-4"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          {saturation && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-600">当前饱和度：</span>
                              <Badge variant={saturation.saturationRate > 80 ? 'destructive' : saturation.saturationRate > 60 ? 'secondary' : 'outline'}>
                                {saturation.saturationRate.toFixed(0)}% - {saturation.status === 'available' ? '空闲' : saturation.status === 'caution' ? '谨慎' : saturation.status === 'saturated' ? '饱和' : '超载'}
                              </Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => router.push('/projects')}>
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? '保存中...' : '保存项目'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
