'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface Evaluation {
  id: string;
  projectId: string;
  supplierId: string;
  visualQuality: number;
  animationSmoothness: number;
  vfxMatch: number;
  audioQuality: number;
  cameraWork: number;
  storyNovelty: number;
  totalScore: number;
  comments?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
    code: string;
    status: string;
  };
  supplier: {
    id: string;
    name: string;
    level: string;
    techStack: string;
  };
}

const dimensionWeights = [
  { key: 'visualQuality', label: '视觉质量', weight: 25 },
  { key: 'animationSmoothness', label: '动画流畅度', weight: 20 },
  { key: 'vfxMatch', label: '特效匹配度', weight: 15 },
  { key: 'audioQuality', label: '音频质量', weight: 15 },
  { key: 'cameraWork', label: '镜头运用', weight: 15 },
  { key: 'storyNovelty', label: '故事新颖度', weight: 10 },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-700' },
  submitted: { label: '已提交', color: 'bg-blue-100 text-blue-700' },
  approved: { label: '已通过', color: 'bg-green-100 text-green-700' },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700' },
};

export default function EvaluationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!params?.id) return;

    async function fetchEvaluation() {
      try {
        const res = await fetch(`/api/evaluations/${params.id}`);
        if (res.ok) {
          setEvaluation(await res.json());
        }
      } catch (error) {
        console.error('Failed to fetch evaluation:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchEvaluation();
  }, [params?.id]);

  const updateStatus = async (newStatus: 'approved' | 'rejected') => {
    if (!evaluation) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/evaluations/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        setEvaluation(updated);
        alert('状态已更新');
      } else {
        const error = await res.json();
        throw new Error(error.error || '更新失败');
      }
    } catch (error: any) {
      alert(`更新失败：${error.message}`);
    } finally {
      setUpdating(false);
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

  if (!evaluation) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">评估记录不存在</h2>
          <p className="text-gray-500 mb-4">该页面可能已被删除或移动</p>
          <Button onClick={() => router.push('/evaluations')}>返回列表</Button>
        </div>
      </div>
    );
  }

  const status = statusConfig[evaluation.status] || { label: evaluation.status, color: 'bg-gray-100 text-gray-700' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className={status.color}>{status.label}</Badge>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">品质评估详情</h1>
          <p className="text-gray-500 mt-1">
            {evaluation.project.name} · {evaluation.supplier.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push('/evaluations')}>
            返回列表
          </Button>
          <Button onClick={() => router.push(`/projects/${evaluation.projectId}`)}>
            查看项目
          </Button>
        </div>
      </div>

      {/* Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle>总分</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="text-5xl font-bold text-primary">{evaluation.totalScore.toFixed(2)}</div>
            <div className="flex-1">
              <Progress value={(evaluation.totalScore / 5) * 100} className="h-3" />
              <div className="text-sm text-gray-500 mt-2">满分 5.0</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dimension Scores */}
      <Card>
        <CardHeader>
          <CardTitle>各维度评分</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dimensionWeights.map((dim) => {
              const score = evaluation[dim.key as keyof Evaluation] as number;
              return (
                <div key={dim.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{dim.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">权重 {dim.weight}%</span>
                      <span className="text-lg font-semibold w-12 text-right">{score.toFixed(1)}</span>
                      <span className="text-sm text-gray-500">/ 5.0</span>
                    </div>
                  </div>
                  <Progress value={(score / 5) * 100} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Project & Supplier Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>项目信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <div className="text-sm text-gray-500">项目名称</div>
              <div className="font-medium">{evaluation.project.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">项目编码</div>
              <div className="font-medium">{evaluation.project.code}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">项目状态</div>
              <Badge variant="outline">{evaluation.project.status}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>供应商信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <div className="text-sm text-gray-500">供应商名称</div>
              <div className="font-medium">{evaluation.supplier.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">技术栈</div>
              <div className="font-medium">{evaluation.supplier.techStack}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">供应商等级</div>
              <Badge variant="outline">{evaluation.supplier.level}级</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comments */}
      {evaluation.comments && (
        <Card>
          <CardHeader>
            <CardTitle>评估备注</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 whitespace-pre-wrap">{evaluation.comments}</p>
          </CardContent>
        </Card>
      )}

      {/* Status Update Actions */}
      {evaluation.status === 'submitted' && (
        <Card>
          <CardHeader>
            <CardTitle>审批操作</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => updateStatus('approved')}
                disabled={updating}
                className="bg-green-600 hover:bg-green-700"
              >
                {updating ? '处理中...' : '通过'}
              </Button>
              <Button
                onClick={() => updateStatus('rejected')}
                disabled={updating}
                variant="destructive"
              >
                {updating ? '处理中...' : '拒绝'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timestamps */}
      <Card>
        <CardHeader>
          <CardTitle>时间信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-gray-500">创建时间</div>
              <div className="font-medium">
                {new Date(evaluation.createdAt).toLocaleString('zh-CN')}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">更新时间</div>
              <div className="font-medium">
                {new Date(evaluation.updatedAt).toLocaleString('zh-CN')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
