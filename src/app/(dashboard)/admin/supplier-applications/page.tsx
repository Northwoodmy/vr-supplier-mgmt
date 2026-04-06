'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth-hooks';
import { useRouter } from 'next/navigation';

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
  status: string;
  applicationDate: string;
  documentReviewResult: string | null;
  sampleScore: number | null;
  finalScore: number | null;
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

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  document_review: 'bg-blue-100 text-blue-700',
  sample_review: 'bg-purple-100 text-purple-700',
  site_visit: 'bg-yellow-100 text-yellow-700',
  trial_run: 'bg-orange-100 text-orange-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function SupplierApplicationsPage() {
  const router = useRouter();
  const { data: currentUser } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // 检查权限
  const canManage = currentUser?.permissions?.includes('supplier:manage');

  useEffect(() => {
    if (!canManage) return;

    async function fetchData() {
      try {
        const res = await fetch('/api/admin/supplier-applications');
        if (res.ok) {
          setApplications(await res.json());
        }
      } catch (error) {
        console.error('Failed to fetch applications:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [canManage]);

  const filteredApplications = applications.filter(app => {
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    return true;
  });

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">供应商准入申请</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">所有状态</option>
          <option value="pending">待审核</option>
          <option value="document_review">资质初审中</option>
          <option value="sample_review">样品评审中</option>
          <option value="site_visit">现场考察中</option>
          <option value="trial_run">试运行中</option>
          <option value="approved">已通过</option>
          <option value="rejected">已拒绝</option>
        </select>
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>申请列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>公司名称</TableHead>
                  <TableHead>联系人</TableHead>
                  <TableHead>联系电话</TableHead>
                  <TableHead>注册资金</TableHead>
                  <TableHead>团队规模</TableHead>
                  <TableHead>引擎能力</TableHead>
                  <TableHead>申请日期</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      暂无申请记录
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.companyName}</TableCell>
                      <TableCell>{app.contactName}</TableCell>
                      <TableCell>{app.contactPhone}</TableCell>
                      <TableCell>{app.registeredCapital ? `¥${app.registeredCapital}万` : '-'}</TableCell>
                      <TableCell>{app.teamSize ? `${app.teamSize}人` : '-'}</TableCell>
                      <TableCell>{app.engineCapability || '-'}</TableCell>
                      <TableCell>{new Date(app.applicationDate).toLocaleDateString('zh-CN')}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[app.status]}>
                          {statusLabels[app.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedApplication(app)}
                          >
                            详情
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => router.push(`/admin/supplier-applications/${app.id}/review`)}
                          >
                            评审
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Application Detail Dialog */}
      {selectedApplication && (
        <Dialog open onOpenChange={() => setSelectedApplication(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>申请详情 - {selectedApplication.companyName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* 基本信息 */}
              <div>
                <h3 className="font-semibold mb-2">基本信息</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">联系人：</span>
                    <span className="font-medium">{selectedApplication.contactName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">联系电话：</span>
                    <span>{selectedApplication.contactPhone}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">联系邮箱：</span>
                    <span>{selectedApplication.contactEmail}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">申请日期：</span>
                    <span>{new Date(selectedApplication.applicationDate).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
              </div>

              {/* 资质信息 */}
              <div>
                <h3 className="font-semibold mb-2">资质信息</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">注册资金：</span>
                    <span>{selectedApplication.registeredCapital ? `¥${selectedApplication.registeredCapital}万` : '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">团队规模：</span>
                    <span>{selectedApplication.teamSize ? `${selectedApplication.teamSize}人` : '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">引擎能力：</span>
                    <span>{selectedApplication.engineCapability || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">银行评级：</span>
                    <span>{selectedApplication.bankRating || '-'}</span>
                  </div>
                </div>
              </div>

              {/* 评审信息 */}
              <div>
                <h3 className="font-semibold mb-2">评审信息</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">当前状态：</span>
                    <Badge className={statusColors[selectedApplication.status]}>
                      {statusLabels[selectedApplication.status]}
                    </Badge>
                  </div>
                  {selectedApplication.documentReviewResult && (
                    <div>
                      <span className="text-gray-500">资质初审：</span>
                      <Badge variant={selectedApplication.documentReviewResult === 'through' ? 'default' : 'destructive'}>
                        {selectedApplication.documentReviewResult === 'through' ? '通过' : '不通过'}
                      </Badge>
                    </div>
                  )}
                  {selectedApplication.sampleScore && (
                    <div>
                      <span className="text-gray-500">样品评审得分：</span>
                      <span className="font-medium">{selectedApplication.sampleScore} / 5.0</span>
                    </div>
                  )}
                  {selectedApplication.finalScore && (
                    <div>
                      <span className="text-gray-500">综合评分：</span>
                      <span className="font-medium">{selectedApplication.finalScore} / 5.0</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setSelectedApplication(null)}>
                关闭
              </Button>
              <Button onClick={() => router.push(`/admin/supplier-applications/${selectedApplication.id}/review`)}>
                进入评审
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
