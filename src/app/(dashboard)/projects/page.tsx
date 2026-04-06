'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-hooks';

interface Project {
  id: string;
  name: string;
  code: string;
  status: string;
  currentStage: string;
  budget: number;
  suppliers?: any[];
}

const statusConfig = {
  planning: { label: '筹备中', color: 'bg-gray-100 text-gray-700' },
  pre_production: { label: '预制作', color: 'bg-blue-100 text-blue-700' },
  production: { label: '制作中', color: 'bg-purple-100 text-purple-700' },
  review: { label: '审核中', color: 'bg-yellow-100 text-yellow-700' },
  delivery: { label: '交付中', color: 'bg-green-100 text-green-700' },
  completed: { label: '已完成', color: 'bg-gray-800 text-white' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-700' },
};

export default function ProjectsPage() {
  const router = useRouter();
  const { data: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 检查权限
  const canViewCost = currentUser?.permissions?.includes('project:manage');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/projects');
        if (res.ok) {
          setProjects(await res.json());
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredProjects = projects.filter((p: any) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.code.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">项目管理</h1>
        <Button onClick={() => router.push('/projects/new')}>
          + 新建项目
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="搜索项目名称或编号..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">所有状态</option>
          <option value="planning">筹备中</option>
          <option value="pre_production">预制作</option>
          <option value="production">制作中</option>
          <option value="review">审核中</option>
          <option value="delivery">交付中</option>
          <option value="completed">已完成</option>
        </select>
      </div>

      {/* Projects List */}
      <Card>
        <CardContent className="p-0">
          <div className="space-y-2">
            {/* Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 text-sm font-medium text-gray-500 p-4 border-b">
              <div className="col-span-4">项目信息</div>
              <div className="col-span-2 text-center">供应商</div>
              {canViewCost && <div className="col-span-2 text-center">预算</div>}
              <div className={`text-center ${canViewCost ? 'col-span-2' : 'col-span-4'}`}>进度</div>
              <div className="col-span-2 text-center">状态</div>
            </div>

            {/* Rows */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-gray-500">加载中...</div>
            ) : filteredProjects.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-gray-500">
                {search || statusFilter !== 'all' ? '没有符合条件的项目' : '暂无项目，点击上方按钮新建'}
              </div>
            ) : (
              filteredProjects.map((project: any) => {
                const status = statusConfig[project.status as keyof typeof statusConfig];
                const supplierCount = project._count?.suppliers || 0;
                const deliveryCount = project._count?.deliveries || 0;
                const progress = project.currentStage === 'completed' ? 100 :
                                 project.currentStage === 'delivery' ? 90 :
                                 project.currentStage === 'review' ? 75 :
                                 project.currentStage === 'production' ? 50 :
                                 project.currentStage === 'pre_production' ? 25 : 10;
                const supplierNames = project.suppliers
                  ?.map((s: any) => s.supplier?.name)
                  .filter((name: any) => name != null)
                  .join('、') || '未分配';

                return (
                  <div
                    key={project.id}
                    className="grid md:grid-cols-12 gap-4 items-center p-4 hover:bg-gray-50 rounded-lg cursor-pointer border-b last:border-0"
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    <div className="col-span-4">
                      <div className="font-medium text-gray-900">{project.name}</div>
                      <div className="text-sm text-gray-500">{project.code}</div>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="text-sm" title={supplierNames}>
                        {supplierNames.length > 20 ? supplierNames.substring(0, 18) + '...' : supplierNames}
                      </span>
                    </div>
                    {canViewCost && (
                      <div className="col-span-2 text-center">
                        <span className="text-sm">
                          {project.budget ? `¥${(project.budget / 10000).toFixed(0)}万` : '-'}
                        </span>
                      </div>
                    )}
                    <div className={canViewCost ? "col-span-2" : "col-span-4"}>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs w-8 text-right">{progress}%</span>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center justify-center gap-2">
                      <Badge className={status.color}>
                        {status.label}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          onClick={(e) => e.stopPropagation()}
                          render={
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              ⋮
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/projects/${project.id}`)}>
                            查看详情
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/projects/${project.id}/edit`)}>
                            编辑
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
