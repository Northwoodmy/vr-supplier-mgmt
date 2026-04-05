'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';

// 权重配置
const WEIGHTS = {
  visualQuality: 0.25,
  animationSmoothness: 0.20,
  vfxMatch: 0.15,
  audioQuality: 0.15,
  cameraWork: 0.15,
  storyNovelty: 0.10,
};

// 维度定义
const DIMENSIONS = [
  { key: 'visualQuality', label: '画面质量', description: '模型精度、材质质感、光影氛围、色彩调校', weight: '25%' },
  { key: 'animationSmoothness', label: '动画流畅度', description: '动作自然度、镜头运动、帧率稳定性、动画节奏', weight: '20%' },
  { key: 'vfxMatch', label: '特效匹配度', description: '特效质量、场景融合、剧情契合、性能优化', weight: '15%' },
  { key: 'audioQuality', label: '配音质量', description: '配音表现、音质清晰、音效设计、BGM 匹配', weight: '15%' },
  { key: 'cameraWork', label: '运镜合理性', description: '镜头语言、运动设计、剪辑节奏、VR 舒适度', weight: '15%' },
  { key: 'storyNovelty', label: '剧情新颖度', description: '创意独特性、叙事完整性、情绪感染力、主题表达', weight: '10%' },
] as const;

type DimensionKey = typeof DIMENSIONS[number]['key'];

export default function NewEvaluationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const supplierId = searchParams.get('supplierId');

  const [scores, setScores] = useState<Record<DimensionKey, number>>({
    visualQuality: 3,
    animationSmoothness: 3,
    vfxMatch: 3,
    audioQuality: 3,
    cameraWork: 3,
    storyNovelty: 3,
  });
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [supplier, setSupplier] = useState<any>(null);

  // 获取项目信息
  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/projects/${projectId}`)
      .then((res) => res.json())
      .then((data) => setProject(data))
      .catch((err) => console.error('Failed to fetch project:', err));
  }, [projectId]);

  // 获取供应商信息
  useEffect(() => {
    if (!supplierId) return;
    fetch(`/api/suppliers/${supplierId}`)
      .then((res) => res.json())
      .then((data) => setSupplier(data))
      .catch((err) => console.error('Failed to fetch supplier:', err));
  }, [supplierId]);

  // 计算加权总分
  const totalScore = Object.entries(scores).reduce((sum, [key, value]) => {
    return sum + value * WEIGHTS[key as DimensionKey];
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectId || !supplierId) {
      alert('缺少项目或供应商信息');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          supplierId,
          visualQuality: scores.visualQuality,
          animationSmoothness: scores.animationSmoothness,
          vfxMatch: scores.vfxMatch,
          audioQuality: scores.audioQuality,
          cameraWork: scores.cameraWork,
          storyNovelty: scores.storyNovelty,
          comments: comments || undefined,
        }),
      });

      if (res.ok) {
        router.push('/evaluations');
      } else {
        const error = await res.json();
        throw new Error(error.error || '提交失败');
      }
    } catch (error: any) {
      setSubmitting(false);
      alert(`提交失败：${error.message}`);
    }
  };

  const updateScore = (key: DimensionKey, value: number) => {
    setScores(prev => ({ ...prev, [key]: value }));
  };

  if (!project || !supplier) {
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
        <Button variant="outline" onClick={() => router.push('/evaluations')}>
          ← 返回列表
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900">品质评估</h1>
      </div>

      {/* Project & Supplier Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">项目信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{project.name}</div>
            <div className="text-sm text-gray-500">{project.code}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">供应商</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{supplier.name}</div>
            <div className="text-sm text-gray-500">{supplier.level}级供应商 | {supplier.techStack}</div>
          </CardContent>
        </Card>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>6 维度评分</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 评分维度 */}
            {DIMENSIONS.map((dim) => (
              <div key={dim.key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">{dim.label}</Label>
                    <div className="text-sm text-gray-500">{dim.description}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 w-12 text-right">权重 {dim.weight}</span>
                    <div className="w-20 text-center">
                      <span className="text-2xl font-bold text-primary">{scores[dim.key].toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <Slider
                  value={[scores[dim.key]]}
                  min={1}
                  max={5}
                  step={0.5}
                  onValueChange={(values) => updateScore(dim.key, values[0])}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1 - 非常差</span>
                  <span>2 - 较差</span>
                  <span>3 - 一般</span>
                  <span>4 - 良好</span>
                  <span>5 - 优秀</span>
                </div>
              </div>
            ))}

            {/* 总分 */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">加权总分</div>
                  <div className="text-sm text-gray-500">根据各维度权重计算得出</div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-primary">{totalScore.toFixed(2)}</div>
                  <div className="text-sm text-gray-500">/ 5.0</div>
                </div>
              </div>
            </div>

            {/* 评价意见 */}
            <div className="space-y-2">
              <Label htmlFor="comments">评价意见（可选）</Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="请输入对该供应商本次交付的整体评价、亮点和改进建议..."
                rows={4}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => router.push('/evaluations')}>
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? '提交中...' : '提交评估'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
