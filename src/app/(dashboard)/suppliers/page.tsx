'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { SaturationBadge } from '@/components/capacity/saturation-badge';
import { useAuth } from '@/lib/auth-hooks';
import { LevelChangeDialog } from '@/components/supplier/level-change-dialog';
import { getLevelConfig, getLevelColorClass } from '@/lib/supplier-level-config';

interface Supplier {
  id: string;
  name: string;
  level: string;
  techStack: string;
  status: string;
  _count?: { projects: number };
}

interface Saturation {
  supplierId: string;
  saturationRate: number;
}

interface User {
  id: string;
  permissions?: string[];
}

const levelColors = {
  S: 'bg-purple-100 text-purple-800',
  A: 'bg-blue-100 text-blue-800',
  B: 'bg-green-100 text-green-800',
  C: 'bg-gray-100 text-gray-800',
};

export default function SuppliersPage() {
  const router = useRouter();
  const { data: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [saturations, setSaturations] = useState<Saturation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [levelChangeSupplier, setLevelChangeSupplier] = useState<Supplier | null>(null);

  // 检查权限
  const canDelete = currentUser?.permissions?.includes('supplier:delete');
  const canManage = currentUser?.permissions?.includes('supplier:manage');

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
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const getSaturation = (supplierId: string) => {
    return saturations.find(s => s.supplierId === supplierId);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此供应商吗？')) return;
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (res.ok) {
        setSuppliers(prev => prev.filter(s => s.id !== id));
        alert('供应商已删除');
      } else {
        alert(`删除失败：${result.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('Failed to delete supplier:', error);
      alert('删除失败：未知错误');
    }
  };

  const filteredSuppliers = suppliers.filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (levelFilter !== 'all' && s.level !== levelFilter) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">供应商管理</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/suppliers/apply')}>
            供应商准入申请
          </Button>
          <Button onClick={() => router.push('/suppliers/new')}>
            + 新建供应商
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="搜索供应商..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">所有等级</option>
          <option value="S">S 级</option>
          <option value="A">A 级</option>
          <option value="B">B 级</option>
          <option value="C">C 级</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">所有状态</option>
          <option value="active">活跃</option>
          <option value="inactive">停用</option>
        </select>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="text-center text-gray-500">加载中...</div>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="text-center text-gray-500">
              {search || levelFilter !== 'all' || statusFilter !== 'all'
                ? '没有符合条件的供应商'
                : '暂无供应商，点击上方按钮新建'}
            </div>
          </div>
        ) : (
          filteredSuppliers.map((supplier) => {
            const saturation = getSaturation(supplier.id);
            const projectCount = supplier._count?.projects || 0;
            const levelConfig = getLevelConfig(supplier.level);
            const isAtLimit = projectCount >= levelConfig.maxProjects;
            const projectPercent = (projectCount / levelConfig.maxProjects) * 100;

            return (
              <Card
                key={supplier.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/suppliers/${supplier.id}`)}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{supplier.name}</h3>
                      <p className="text-sm text-gray-500">{supplier.techStack}</p>
                    </div>
                    <Badge className={levelColors[supplier.level as keyof typeof levelColors]}>
                      {supplier.level}级
                    </Badge>
                  </div>

                  {/* 项目配额 - 新增 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">进行中项目</span>
                      <span className={`font-medium ${isAtLimit ? 'text-red-600' : ''}`}>
                        {projectCount} / {levelConfig.maxProjects} 个
                      </span>
                    </div>
                    <Progress
                      value={Math.min(projectPercent, 100)}
                      className={`h-2 ${
                        isAtLimit
                          ? '[&>div]:bg-red-500'
                          : projectPercent > 80
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

                  {/* 权益摘要 - 新增 */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">付款周期</span>
                      <span className="font-medium">{levelConfig.paymentDays}天</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">预付款</span>
                      <span className="font-medium">{levelConfig.prepaymentRate}%</span>
                    </div>
                  </div>

                  {/* 饱和度 */}
                  {saturation && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">产能饱和度</span>
                        <span className="font-medium">{saturation.saturationRate}%</span>
                      </div>
                      <SaturationBadge saturationRate={saturation.saturationRate} />
                    </div>
                  )}

                  {/* 操作按钮 - 新增 */}
                  <div className="flex gap-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                    {canManage && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setLevelChangeSupplier(supplier)}
                      >
                        调整等级
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/suppliers/${supplier.id}`)}
                    >
                      详情
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* 等级调整弹窗 */}
      {levelChangeSupplier && (
        <LevelChangeDialog
          supplier={levelChangeSupplier}
          open={!!levelChangeSupplier}
          onOpenChange={(open) => {
            if (!open) setLevelChangeSupplier(null);
          }}
          onSuccess={() => {
            // 刷新列表
            fetch('/api/suppliers')
              .then(res => res.json())
              .then(data => setSuppliers(data));
          }}
        />
      )}
    </div>
  );
}
