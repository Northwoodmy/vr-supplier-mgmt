'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth-hooks';
import { ChevronDownIcon } from 'lucide-react';

interface Application {
  id: string;
  companyName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  registeredCapital: number | null;
  teamSize: number | null;
  engineCapability: string | null;
  bankRating: string | null;
  businessScope: string | null;
  status: string;
  applicationDate: string;
  documentReviewResult: string | null;
  documentComments: string | null;
  sampleScore: number | null;
  sampleComments: string | null;
  siteVisitResult: string | null;
  siteVisitComments: string | null;
  trialResult: string | null;
  trialComments: string | null;
  finalScore: number | null;
  finalResult: string | null;
  rejectedReason: string | null;
}

const statusLabels: Record<string, string> = {
  pending: '待审核',
  document_review: '资质初审中',
  sample_review: '样品评审中',
  site_visit: '现场考察中',
  trial_run: '试运行中',
  approved: '已通过',
  rejected: '已拒绝',
};

export default function ReviewApplicationPage() {
  const router = useRouter();
  const params = useParams();
  const { data: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState<Application | null>(null);

  // 资质初审
  const [documentResult, setDocumentResult] = useState('');
  const [documentComments, setDocumentComments] = useState('');

  // 现场考察
  const [siteVisitResult, setSiteVisitResult] = useState('');
  const [siteVisitComments, setSiteVisitComments] = useState('');

  // 样品评审
  const [sampleScores, setSampleScores] = useState({
    visualQuality: 0,
    technicalImplementation: 0,
    creativity: 0,
    audioDesign: 0,
    completeness: 0,
    businessMatch: 0,
  });
  const [sampleComments, setSampleComments] = useState('');

  // 试运行项目验收
  const [trialResult, setTrialResult] = useState('');
  const [trialComments, setTrialComments] = useState('');

  const canManage = currentUser?.permissions?.includes('supplier:manage');

  useEffect(() => {
    if (!canManage) return;

    async function fetchData() {
      try {
        const res = await fetch(`/api/admin/supplier-applications/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setApplication(data);
        }
      } catch (error) {
        console.error('Failed to fetch application:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.id, canManage]);

  const handleDocumentReview = async () => {
    if (!documentResult) {
      alert('请选择审核结果');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/supplier-applications/${params.id}/document-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result: documentResult,
          comments: documentComments,
          nextStatus: documentResult === 'through' ? 'sample_review' : 'rejected',
        }),
      });

      if (res.ok) {
        alert('资质初审完成');
        window.location.reload();
      } else {
        alert(`提交失败：${(await res.json()).error}`);
      }
    } catch (error: any) {
      console.error('Failed to submit review:', error);
      alert('提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSiteVisit = async () => {
    if (!siteVisitResult) {
      alert('请选择考察结果');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/supplier-applications/${params.id}/site-visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteVisitResult,
          siteVisitComments,
          nextStatus: siteVisitResult === 'through' ? 'trial_run' : 'rejected',
        }),
      });

      if (res.ok) {
        alert('现场考察完成');
        window.location.reload();
      } else {
        alert(`提交失败：${(await res.json()).error}`);
      }
    } catch (error: any) {
      console.error('Failed to submit site visit:', error);
      alert('提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSampleReview = async () => {
    const totalScore = Object.values(sampleScores).reduce((sum, score) => sum + score, 0);
    const avgScore = totalScore / 6;

    if (avgScore < 3.0) {
      if (!confirm(`样品评审平均分为 ${avgScore.toFixed(1)}，低于及格分 3.0，将拒绝此申请。确认提交？`)) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/supplier-applications/${params.id}/sample-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scores: sampleScores,
          totalScore: avgScore,
          comments: sampleComments,
        }),
      });

      if (res.ok) {
        alert('样品评审完成');
        window.location.reload();
      } else {
        alert(`提交失败：${(await res.json()).error}`);
      }
    } catch (error: any) {
      console.error('Failed to submit review:', error);
      alert('提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrialReview = async () => {
    if (!trialResult) {
      alert('请选择试运行结果');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/supplier-applications/${params.id}/trial-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trialResult,
          trialComments,
          nextStatus: trialResult === 'through' ? 'approved' : 'rejected',
        }),
      });

      if (res.ok) {
        alert('试运行项目验收完成');
        window.location.reload();
      } else {
        alert(`提交失败：${(await res.json()).error}`);
      }
    } catch (error: any) {
      console.error('Failed to submit trial review:', error);
      alert('提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (!canManage) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500">无权访问此页面</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || !application) {
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
        <Button variant="outline" onClick={() => router.push('/admin/supplier-applications')}>
          ← 返回列表
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">供应商准入评审</h1>
          <p className="text-gray-500 text-sm mt-1">{application.companyName}</p>
        </div>
        <Badge className={statusLabels[application.status] ? 'bg-gray-100 text-gray-700' : ''}>
          {statusLabels[application.status]}
        </Badge>
      </div>

      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle>申请信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">公司名称：</span>
              <span className="font-medium">{application.companyName}</span>
            </div>
            <div>
              <span className="text-gray-500">联系人：</span>
              <span>{application.contactName}</span>
            </div>
            <div>
              <span className="text-gray-500">联系电话：</span>
              <span>{application.contactPhone}</span>
            </div>
            <div>
              <span className="text-gray-500">联系邮箱：</span>
              <span>{application.contactEmail}</span>
            </div>
            <div>
              <span className="text-gray-500">注册资金：</span>
              <span>{application.registeredCapital ? `¥${application.registeredCapital}万` : '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">团队规模：</span>
              <span>{application.teamSize ? `${application.teamSize}人` : '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">引擎能力：</span>
              <span>{application.engineCapability || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">银行评级：</span>
              <span>{application.bankRating || '-'}</span>
            </div>
            {application.businessScope && (
              <div className="col-span-2">
                <span className="text-gray-500">经营范围：</span>
                <p className="mt-1">{application.businessScope}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 资质初审 */}
      {application.status === 'pending' || application.status === 'document_review' ? (
        <Card>
          <CardHeader>
            <CardTitle>资质初审</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>审核结果</Label>
              <div className="relative w-fit">
                <select
                  value={documentResult}
                  onChange={(e) => setDocumentResult(e.target.value)}
                  className="flex min-w-[200px] items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-8 pl-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 appearance-none cursor-pointer"
                >
                  <option value="">请选择审核结果</option>
                  <option value="through">通过</option>
                  <option value="failed">不通过</option>
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentComments">审核意见</Label>
              <Textarea
                id="documentComments"
                value={documentComments}
                onChange={(e) => setDocumentComments(e.target.value)}
                placeholder="请填写审核意见"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => router.push('/admin/supplier-applications')}>
                暂存
              </Button>
              <Button onClick={handleDocumentReview} disabled={submitting}>
                {submitting ? '提交中...' : '提交审核'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>资质初审结果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">结果：</span>
                <Badge variant={application.documentReviewResult === 'through' ? 'default' : 'destructive'}>
                  {application.documentReviewResult === 'through' ? '通过' : '不通过'}
                </Badge>
              </div>
              {application.documentComments && (
                <div>
                  <span className="text-gray-500">审核意见：</span>
                  <p className="mt-1">{application.documentComments}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 样品评审 */}
      {(application.status === 'sample_review' || application.status === 'site_visit' ||
        application.status === 'trial_run' || application.status === 'approved' ||
        application.status === 'rejected') && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>样品评审</CardTitle>
              {application.status === 'sample_review' && !application.sampleScore && (
                <Badge variant="outline">待评审</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {application.status === 'sample_review' && !application.sampleScore ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>视觉质量 (25%)</Label>
                    <div className="relative w-fit">
                      <select
                        value={sampleScores.visualQuality || ''}
                        onChange={(e) => setSampleScores(s => ({ ...s, visualQuality: parseFloat(e.target.value) }))}
                        className="flex min-w-[150px] items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-8 pl-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 appearance-none cursor-pointer"
                      >
                        <option value="">评分 (1-5)</option>
                        {[1, 2, 3, 4, 5].map(n => (
                          <option key={n} value={n}>{n} 分</option>
                        ))}
                      </select>
                      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>技术实现 (20%)</Label>
                    <div className="relative w-fit">
                      <select
                        value={sampleScores.technicalImplementation || ''}
                        onChange={(e) => setSampleScores(s => ({ ...s, technicalImplementation: parseFloat(e.target.value) }))}
                        className="flex min-w-[150px] items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-8 pl-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 appearance-none cursor-pointer"
                      >
                        <option value="">评分 (1-5)</option>
                        {[1, 2, 3, 4, 5].map(n => (
                          <option key={n} value={n}>{n} 分</option>
                        ))}
                      </select>
                      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>创意叙事 (20%)</Label>
                    <div className="relative w-fit">
                      <select
                        value={sampleScores.creativity || ''}
                        onChange={(e) => setSampleScores(s => ({ ...s, creativity: parseFloat(e.target.value) }))}
                        className="flex min-w-[150px] items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-8 pl-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 appearance-none cursor-pointer"
                      >
                        <option value="">评分 (1-5)</option>
                        {[1, 2, 3, 4, 5].map(n => (
                          <option key={n} value={n}>{n} 分</option>
                        ))}
                      </select>
                      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>音频设计 (15%)</Label>
                    <div className="relative w-fit">
                      <select
                        value={sampleScores.audioDesign || ''}
                        onChange={(e) => setSampleScores(s => ({ ...s, audioDesign: parseFloat(e.target.value) }))}
                        className="flex min-w-[150px] items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-8 pl-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 appearance-none cursor-pointer"
                      >
                        <option value="">评分 (1-5)</option>
                        {[1, 2, 3, 4, 5].map(n => (
                          <option key={n} value={n}>{n} 分</option>
                        ))}
                      </select>
                      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>完成度 (10%)</Label>
                    <div className="relative w-fit">
                      <select
                        value={sampleScores.completeness || ''}
                        onChange={(e) => setSampleScores(s => ({ ...s, completeness: parseFloat(e.target.value) }))}
                        className="flex min-w-[150px] items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-8 pl-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 appearance-none cursor-pointer"
                      >
                        <option value="">评分 (1-5)</option>
                        {[1, 2, 3, 4, 5].map(n => (
                          <option key={n} value={n}>{n} 分</option>
                        ))}
                      </select>
                      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>商业匹配 (10%)</Label>
                    <div className="relative w-fit">
                      <select
                        value={sampleScores.businessMatch || ''}
                        onChange={(e) => setSampleScores(s => ({ ...s, businessMatch: parseFloat(e.target.value) }))}
                        className="flex min-w-[150px] items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-8 pl-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 appearance-none cursor-pointer"
                      >
                        <option value="">评分 (1-5)</option>
                        {[1, 2, 3, 4, 5].map(n => (
                          <option key={n} value={n}>{n} 分</option>
                        ))}
                      </select>
                      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sampleComments">评审意见</Label>
                  <Textarea
                    id="sampleComments"
                    value={sampleComments}
                    onChange={(e) => setSampleComments(e.target.value)}
                    placeholder="请填写评审意见"
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => router.push('/admin/supplier-applications')}>
                    暂存
                  </Button>
                  <Button onClick={handleSampleReview} disabled={submitting}>
                    {submitting ? '提交中...' : '提交评审'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">样品得分：</span>
                  <span className="font-medium text-lg">{application.sampleScore?.toFixed(1) || '-'} / 5.0</span>
                  {application.sampleScore && application.sampleScore >= 3.0 && (
                    <Badge variant="default">及格</Badge>
                  )}
                  {application.sampleScore && application.sampleScore < 3.0 && (
                    <Badge variant="destructive">不及格</Badge>
                  )}
                </div>
                {application.sampleComments && (
                  <div>
                    <span className="text-gray-500">评审意见：</span>
                    <p className="mt-1">{application.sampleComments}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 现场考察 */}
      {(application.status === 'site_visit' || application.status === 'trial_run' ||
        application.status === 'approved' || application.status === 'rejected') && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>现场考察</CardTitle>
              {application.status === 'site_visit' && !application.siteVisitResult && (
                <Badge variant="outline">待考察</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {application.status === 'site_visit' && !application.siteVisitResult ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>考察结果</Label>
                  <div className="relative w-fit">
                    <select
                      value={siteVisitResult}
                      onChange={(e) => setSiteVisitResult(e.target.value)}
                      className="flex min-w-[200px] items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-8 pl-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 appearance-none cursor-pointer"
                    >
                      <option value="">请选择考察结果</option>
                      <option value="through">通过</option>
                      <option value="failed">不通过</option>
                      <option value="not_required">无需考察</option>
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteVisitComments">考察意见</Label>
                  <Textarea
                    id="siteVisitComments"
                    value={siteVisitComments}
                    onChange={(e) => setSiteVisitComments(e.target.value)}
                    placeholder="请填写考察意见"
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => router.push('/admin/supplier-applications')}>
                    暂存
                  </Button>
                  <Button onClick={handleSiteVisit} disabled={submitting}>
                    {submitting ? '提交中...' : '提交考察'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">结果：</span>
                  <Badge variant={application.siteVisitResult === 'through' ? 'default' : application.siteVisitResult === 'not_required' ? 'secondary' : 'destructive'}>
                    {application.siteVisitResult === 'through' ? '通过' : application.siteVisitResult === 'not_required' ? '无需考察' : '不通过'}
                  </Badge>
                </div>
                {application.siteVisitComments && (
                  <div>
                    <span className="text-gray-500">考察意见：</span>
                    <p className="mt-1">{application.siteVisitComments}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 试运行项目验收 */}
      {(application.status === 'trial_run' || application.status === 'approved' ||
        application.status === 'rejected') && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>试运行项目验收</CardTitle>
              {application.status === 'trial_run' && !application.trialResult && (
                <Badge variant="outline">待验收</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {application.status === 'trial_run' && !application.trialResult ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>验收结果</Label>
                  <div className="relative w-fit">
                    <select
                      value={trialResult}
                      onChange={(e) => setTrialResult(e.target.value)}
                      className="flex min-w-[200px] items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-8 pl-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 appearance-none cursor-pointer"
                    >
                      <option value="">请选择验收结果</option>
                      <option value="through">通过</option>
                      <option value="failed">不通过</option>
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trialComments">验收意见</Label>
                  <Textarea
                    id="trialComments"
                    value={trialComments}
                    onChange={(e) => setTrialComments(e.target.value)}
                    placeholder="请填写验收意见"
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => router.push('/admin/supplier-applications')}>
                    暂存
                  </Button>
                  <Button onClick={handleTrialReview} disabled={submitting}>
                    {submitting ? '提交中...' : '提交验收'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">结果：</span>
                  <Badge variant={application.trialResult === 'through' ? 'default' : 'destructive'}>
                    {application.trialResult === 'through' ? '通过' : '不通过'}
                  </Badge>
                </div>
                {application.trialComments && (
                  <div>
                    <span className="text-gray-500">验收意见：</span>
                    <p className="mt-1">{application.trialComments}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 后续流程提示 */}
      {application.status === 'approved' && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">已通过 - 正式入库</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700">该供应商已通过所有评审，正式入库为 B 级供应商。</p>
          </CardContent>
        </Card>
      )}

      {application.status === 'rejected' && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">已拒绝</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{application.rejectedReason || '该申请已被拒绝'}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
