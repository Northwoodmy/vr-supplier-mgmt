'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, Users, FolderOpen, Star, FileText } from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string }> = {
  planning: { label: '筹备中', color: 'bg-gray-100 text-gray-700' },
  pre_production: { label: '预制作', color: 'bg-blue-100 text-blue-700' },
  production: { label: '制作中', color: 'bg-purple-100 text-purple-700' },
  review: { label: '审核中', color: 'bg-yellow-100 text-yellow-700' },
  delivery: { label: '交付中', color: 'bg-green-100 text-green-700' },
  completed: { label: '已完成', color: 'bg-gray-800 text-white' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-700' },
};

const stageProgress: Record<string, number> = {
  planning: 10,
  pre_production: 25,
  production: 50,
  review: 75,
  delivery: 90,
  completed: 100,
  paused: 0,
};

const complexityConfig: Record<string, { label: string; color: string }> = {
  simple: { label: '简单', color: 'bg-green-100 text-green-700' },
  medium: { label: '中等', color: 'bg-blue-100 text-blue-700' },
  complex: { label: '复杂', color: 'bg-orange-100 text-orange-700' },
  extreme: { label: '极复杂', color: 'bg-red-100 text-red-700' },
};

const stageConfig: Record<string, { label: string }> = {
  planning: { label: '筹备中' },
  pre_production: { label: '预制作' },
  production: { label: '制作中' },
  review: { label: '审核中' },
  delivery: { label: '交付中' },
  completed: { label: '已完成' },
  paused: { label: '已暂停' },
};

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
  createdAt: string;
  suppliers: Array<{
    id: string;
    supplier: {
      id: string;
      name: string;
      level: string;
      techStack: string;
    };
    estimatedManDays: number;
    complexityLevel: string;
    currentStage: string;
    workloadShare: number;
  }>;
  deliveries?: Array<{
    id: string;
    version: string;
    description?: string;
    deliverUrl?: string;
    status: string;
    feedback?: string;
    createdAt: string;
  }>;
  qualityReviews?: Array<{
    id: string;
    totalScore: number;
    status: string;
    createdAt: string;
    supplier: { name: string };
  }>;
}

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;

    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${params.id}`);
        if (res.ok) {
          setProject(await res.json());
        }
      } catch (error) {
        console.error('Failed to fetch project:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProject();
  }, [params?.id]);

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
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">项目不存在</h2>
          <p className="text-gray-500 mb-4">该页面可能已被删除或移动</p>
          <Button onClick={() => router.push('/projects')}>返回项目列表</Button>
        </div>
      </div>
    );
  }

  const progress = stageProgress[project.currentStage] || 0;
  const supplierCount = project.suppliers?.length || 0;
  const deliveryCount = project.deliveries?.length || 0;
  const evaluationCount = project.qualityReviews?.length || 0;
  const avgScore = project.qualityReviews && project.qualityReviews.length > 0
    ? project.qualityReviews.reduce((sum, r) => sum + r.totalScore, 0) / project.qualityReviews.length
    : 0;

  // 计算项目持续时间
  const startDate = new Date(project.startDate);
  const endDate = project.endDate ? new Date(project.endDate) : new Date();
  const durationDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
          <p className="text-gray-500 mt-1">{project.code}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusConfig[project.status]?.color}>
            {statusConfig[project.status]?.label}
          </Badge>
          <Badge variant="outline">{project.currentStage === 'completed' ? '已完成' : '进行中'}</Badge>
          <Button variant="outline" onClick={() => router.push(`/projects/${project.id}/edit`)}>
            编辑
          </Button>
          <Button variant="outline" onClick={() => router.push('/projects')}>
            返回列表
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">项目进度</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>筹备</span>
              <span>预制作</span>
              <span>制作</span>
              <span>审核</span>
              <span>交付</span>
              <span>完成</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">预算</CardTitle>
            <FileText className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{(project.budget / 10000).toFixed(1)}万</div>
            {project.actualCost && (
              <p className="text-xs text-gray-500 mt-1">
                实际：¥{(project.actualCost / 10000).toFixed(1)}万
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">工期</CardTitle>
            <Calendar className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{durationDays} 天</div>
            <p className="text-xs text-gray-500 mt-1">
              {startDate.toLocaleDateString('zh-CN')} 开始
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">供应商</CardTitle>
            <Users className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supplierCount}</div>
            <p className="text-xs text-gray-500 mt-1">
              {supplierCount > 0 ? '已分配' : '未分配'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">交付版本</CardTitle>
            <FolderOpen className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveryCount}</div>
            <p className="text-xs text-gray-500 mt-1">
              已提交版本数
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Time Info */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">开始日期</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div className="text-lg font-medium">
                {startDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">预计交付</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <div className="text-lg font-medium">
                {new Date(project.expectedDeliveryDate).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">实际交付</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-gray-500" />
              <div className="text-lg font-medium">
                {project.actualDeliveryDate
                  ? new Date(project.actualDeliveryDate).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
                  : '-'
                }
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {project.description && (
        <Card>
          <CardHeader>
            <CardTitle>项目描述</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 whitespace-pre-wrap">{project.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Supplier Allocations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>供应商分配</CardTitle>
            {supplierCount === 0 && (
              <Button size="sm" variant="outline" onClick={() => router.push(`/projects/${project.id}/suppliers`)}>
                分配供应商
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {supplierCount > 0 ? (
            <div className="space-y-4">
              {project.suppliers.map((allocation) => {
                const complexity = complexityConfig[allocation.complexityLevel] || complexityConfig.medium;
                return (
                  <div
                    key={allocation.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{allocation.supplier.name}</span>
                        <Badge variant="outline">{allocation.supplier.level}级</Badge>
                        <Badge variant="secondary">{allocation.supplier.techStack}</Badge>
                        <Badge className={complexity.color}>{complexity.label}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>预计工时：{allocation.estimatedManDays} 人天</span>
                        <span>·</span>
                        <span>负载占比：{(allocation.workloadShare * 100).toFixed(0)}%</span>
                        <span>·</span>
                        <span>当前阶段：{stageConfig[allocation.currentStage]?.label || allocation.currentStage}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/suppliers/${allocation.supplier.id}`)}
                      >
                        查看供应商
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/evaluations/new?projectId=${project.id}&supplierId=${allocation.supplier.id}`)}
                      >
                        去评估
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              暂无供应商分配，点击上方按钮添加
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deliveries */}
      {project.deliveries && project.deliveries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>交付记录</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {project.deliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">版本 {delivery.version}</span>
                      <Badge variant={delivery.status === 'approved' ? 'default' : delivery.status === 'rejected' ? 'destructive' : 'secondary'}>
                        {delivery.status === 'approved' ? '已通过' : delivery.status === 'rejected' ? '已拒绝' : '待审核'}
                      </Badge>
                    </div>
                    {delivery.description && (
                      <p className="text-sm text-gray-500 mt-1">{delivery.description}</p>
                    )}
                    {delivery.feedback && (
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">反馈：</span>{delivery.feedback}
                      </p>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(delivery.createdAt).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quality Reviews */}
      {project.qualityReviews && project.qualityReviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>品质评估</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg">
                <div className="text-3xl font-bold text-primary">{avgScore.toFixed(2)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Progress value={(avgScore / 5) * 100} className="h-2 flex-1" />
                    <span className="text-sm text-gray-500">/ 5.0</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">平均分数（基于 {evaluationCount} 个评估）</p>
                </div>
              </div>
              {project.qualityReviews.map((review) => (
                <div
                  key={review.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{review.supplier.name}</span>
                      <Badge variant={review.status === 'submitted' ? 'default' : 'secondary'}>
                        {review.status === 'submitted' ? '已提交' : '草稿'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-xl font-bold text-primary">{review.totalScore.toFixed(2)}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/evaluations/${review.id}`)}
                    >
                      查看详情
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const stageConfig: Record<string, { label: string }> = {
  planning: { label: '筹备中' },
  pre_production: { label: '预制作' },
  production: { label: '制作中' },
  review: { label: '审核中' },
  delivery: { label: '交付中' },
  completed: { label: '已完成' },
  paused: { label: '已暂停' },
};
