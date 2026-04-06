'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface Evaluation {
  id: string;
  totalScore: number;
  project: any;
  supplier: any;
}

interface Project {
  id: string;
  name: string;
}

export default function EvaluationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'list' | 'pending'>('list');
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [pendingProjects, setPendingProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [evalRes, pendingRes] = await Promise.all([
          fetch('/api/evaluations'),
          fetch('/api/evaluations/pending'),
        ]);
        if (evalRes.ok) {
          setEvaluations(await evalRes.json());
        }
        if (pendingRes.ok) {
          setPendingProjects(await pendingRes.json());
        }
      } catch (error) {
        console.error('Failed to fetch evaluations:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

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

  const completedCount = evaluations?.length || 0;
  const pendingCount = pendingProjects?.length || 0;
  const avgScore = (evaluations?.length || 0) > 0
    ? (evaluations || []).reduce((acc, e) => acc + e.totalScore, 0) / (evaluations?.length || 1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">品质评估</h1>
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('pending')}
          >
            待评估 ({pendingCount})
          </Button>
          <Button
            variant={activeTab === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('list')}
          >
            已评估 ({completedCount})
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">待评估</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">已评估</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">平均分数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{avgScore.toFixed(1)} / 5.0</div>
          </CardContent>
        </Card>
      </div>

      {/* Content based on tab */}
      {activeTab === 'pending' ? (
        <Card>
          <CardHeader>
            <CardTitle>待评估项目</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Header */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 text-sm font-medium text-gray-500 p-4 border-b">
                <div className="col-span-4">项目名称</div>
                <div className="col-span-3 text-center">供应商</div>
                <div className="col-span-2 text-center">状态</div>
                <div className="col-span-3 text-center">操作</div>
              </div>

              {pendingProjects && pendingProjects.length > 0 ? (
                pendingProjects.map((project: any) =>
                  project.suppliers.map((sp: any) => {
                    const hasEvaluation = (project.qualityReviews || []).some((r: any) => r.supplierId === sp.supplierId);
                    if (hasEvaluation) return null;

                    return (
                      <div
                        key={`${project.id}-${sp.id}`}
                        className="grid md:grid-cols-12 gap-4 items-center p-4 hover:bg-gray-50 rounded-lg border-b last:border-0"
                      >
                        <div className="col-span-4">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-medium text-gray-900">{project.name}</div>
                              <div className="text-sm text-gray-500">{project.code}</div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/projects/${project.id}`);
                              }}
                            >
                              查看项目
                            </Button>
                          </div>
                        </div>
                        <div className="col-span-3 text-center">
                          <span className="text-sm">{sp.supplier.name}</span>
                        </div>
                        <div className="col-span-2 text-center">
                          <Badge>{project.currentStage === 'completed' ? '已完成' : '待评估'}</Badge>
                        </div>
                        <div className="col-span-3 text-center">
                          <Button
                            size="sm"
                            onClick={() => router.push(`/evaluations/new?projectId=${project.id}&supplierId=${sp.supplier.id}`)}
                          >
                            去评估
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ).filter(Boolean)
              ) : (
                <div className="text-center py-12 text-gray-500">
                  暂无待评估项目
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>评估历史</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Header */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 text-sm font-medium text-gray-500 p-4 border-b">
                <div className="col-span-4">项目名称</div>
                <div className="col-span-3 text-center">供应商</div>
                <div className="col-span-2 text-center">分数</div>
                <div className="col-span-2 text-center">评估日期</div>
                <div className="col-span-1 text-center">状态</div>
              </div>

              {evaluations && evaluations.length > 0 ? (
                evaluations.map((evaluation: any) => (
                  <div
                    key={evaluation.id}
                    className="grid md:grid-cols-12 gap-4 items-center p-4 hover:bg-gray-50 rounded-lg border-b last:border-0"
                    onClick={() => router.push(`/evaluations/${evaluation.id}`)}
                  >
                    <div className="col-span-4">
                      <div className="font-medium text-gray-900">{evaluation.project.name}</div>
                      <div className="text-sm text-gray-500">{evaluation.project.code}</div>
                    </div>
                    <div className="col-span-3 text-center">
                      <span className="text-sm">{evaluation.supplier.name}</span>
                    </div>
                    <div className="col-span-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-lg font-semibold text-primary">{evaluation.totalScore.toFixed(1)}</span>
                        <span className="text-sm text-gray-500">/ 5.0</span>
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="text-sm text-gray-500">{new Date(evaluation.createdAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                    <div className="col-span-1 text-center">
                      <Badge variant={
                        evaluation.status === 'submitted' ? 'default' :
                        evaluation.status === 'approved' ? 'destructive' :
                        'secondary'
                      }>
                        {evaluation.status === 'submitted' ? '已提交' :
                         evaluation.status === 'approved' ? '已通过' :
                         '草稿'}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  暂无评估记录
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
