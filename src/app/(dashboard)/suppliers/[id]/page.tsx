'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Supplier {
  id: string;
  name: string;
  techStack: string;
  level: string;
  status: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  description?: string;
  teamMembers: Array<{
    id: string;
    role: string;
    category: string;
    count: number;
    seniorCount: number;
  }>;
  capacity: {
    id: string;
    totalMembers: number;
    capacityFactor: number;
    monthlyCapacity: number;
  } | null;
  projects: Array<{
    id: string;
    projectId: string;
    estimatedManDays: number;
    complexityLevel: string;
    currentStage: string;
    workloadShare: number;
    project: {
      id: string;
      name: string;
      code: string;
      status: string;
    };
  }>;
  qualityReviews: Array<{
    id: string;
    totalScore: number;
    comments?: string;
    createdAt: string;
  }>;
}

const levelConfig: Record<string, { label: string; color: string }> = {
  S: { label: 'S 级', color: 'bg-purple-100 text-purple-700' },
  A: { label: 'A 级', color: 'bg-blue-100 text-blue-700' },
  B: { label: 'B 级', color: 'bg-green-100 text-green-700' },
  C: { label: 'C 级', color: 'bg-gray-100 text-gray-700' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: '合作中', color: 'bg-green-100 text-green-700' },
  inactive: { label: '未激活', color: 'bg-gray-100 text-gray-700' },
  suspended: { label: '暂停', color: 'bg-red-100 text-red-700' },
};

const stageConfig: Record<string, string> = {
  planning: '筹备中',
  pre_production: '预制作',
  production: '制作中',
  review: '审核中',
  delivery: '交付中',
  completed: '已完成',
  paused: '已暂停',
};

const complexityConfig: Record<string, string> = {
  simple: '简单',
  medium: '中等',
  complex: '复杂',
  extreme: '极复杂',
};

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;

    async function fetchSupplier() {
      try {
        const res = await fetch(`/api/suppliers/${params.id}`);
        if (res.ok) {
          setSupplier(await res.json());
        }
      } catch (error) {
        console.error('Failed to fetch supplier:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSupplier();
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

  if (!supplier) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">供应商不存在</h2>
          <p className="text-gray-500 mb-4">该页面可能已被删除或移动</p>
          <Button variant="outline" onClick={() => router.push('/suppliers')}>
            返回列表
          </Button>
        </div>
      </div>
    );
  }

  const avgQualityScore = supplier.qualityReviews.length > 0
    ? supplier.qualityReviews.reduce((sum, r) => sum + r.totalScore, 0) / supplier.qualityReviews.length
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{supplier.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{supplier.techStack}</Badge>
            <Badge className={levelConfig[supplier.level]?.color}>
              {levelConfig[supplier.level]?.label}
            </Badge>
            <Badge className={statusConfig[supplier.status]?.color}>
              {statusConfig[supplier.status]?.label}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/suppliers/${supplier.id}/edit`)}>
            编辑
          </Button>
          <Button variant="outline" onClick={() => router.push('/suppliers')}>
            返回列表
          </Button>
        </div>
      </div>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>联系信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-sm text-gray-500">联系人</div>
              <div className="font-medium">{supplier.contactPerson}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">邮箱</div>
              <div className="font-medium">{supplier.email}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">电话</div>
              <div className="font-medium">{supplier.phone}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">地址</div>
              <div className="font-medium">{supplier.address}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capacity Overview */}
      {supplier.capacity && (
        <Card>
          <CardHeader>
            <CardTitle>产能概况</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-sm text-gray-500">团队规模</div>
                <div className="text-2xl font-bold">{supplier.capacity.totalMembers} 人</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">月产能</div>
                <div className="text-2xl font-bold">{supplier.capacity.monthlyCapacity.toFixed(1)} 人天</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">产能系数</div>
                <div className="text-2xl font-bold">{supplier.capacity.capacityFactor.toFixed(2)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Composition */}
      <Card>
        <CardHeader>
          <CardTitle>团队构成</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {supplier.teamMembers.map((member) => (
              <div key={member.id} className="p-4 border rounded-lg">
                <div className="font-medium">{member.role}</div>
                <div className="text-sm text-gray-500">{member.category}</div>
                <div className="flex items-center gap-4 mt-2">
                  <div>
                    <span className="text-xs text-gray-500">总数：</span>
                    <span className="font-medium">{member.count}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">资深：</span>
                    <span className="font-medium">{member.seniorCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Projects */}
      <Card>
        <CardHeader>
          <CardTitle>进行中项目</CardTitle>
        </CardHeader>
        <CardContent>
          {supplier.projects.length > 0 ? (
            <div className="space-y-3">
              {supplier.projects.map((proj) => (
                <div
                  key={proj.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{proj.project.name}</span>
                      <Badge variant="outline">{proj.project.code}</Badge>
                      <Badge variant="secondary">{stageConfig[proj.currentStage] || proj.currentStage}</Badge>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      预计工时：{proj.estimatedManDays} 人天 ·
                      复杂度：{complexityConfig[proj.complexityLevel] || proj.complexityLevel} ·
                      负载占比：{(proj.workloadShare * 100).toFixed(0)}%
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/projects/${proj.projectId}`)}
                  >
                    查看项目
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              暂无进行中项目
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quality Score */}
      {avgQualityScore !== null && (
        <Card>
          <CardHeader>
            <CardTitle>品质评分</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-primary">{avgQualityScore.toFixed(2)}</div>
              <div className="text-gray-500">
                基于 {supplier.qualityReviews.length} 次评估
              </div>
            </div>
            {supplier.qualityReviews.length > 0 && (
              <div className="mt-4 space-y-2">
                {supplier.qualityReviews.slice(-5).reverse().map((review) => (
                  <div key={review.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="text-sm">
                      <span className="font-medium">评分：{review.totalScore.toFixed(2)}</span>
                      {review.comments && (
                        <span className="text-gray-500 ml-2">- {review.comments}</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Description */}
      {supplier.description && (
        <Card>
          <CardHeader>
            <CardTitle>供应商标述</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 whitespace-pre-wrap">{supplier.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
