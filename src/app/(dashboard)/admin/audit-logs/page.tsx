'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/lib/auth-hooks';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    displayName?: string;
    email: string;
  };
}

interface AuditData {
  logs: AuditLog[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface StatItem {
  action?: string;
  resource?: string;
  userId?: string;
  count: number;
}

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  LOGIN: 'bg-purple-100 text-purple-700',
  LOGOUT: 'bg-gray-100 text-gray-700',
  EXPORT: 'bg-yellow-100 text-yellow-700',
  ASSIGN_ROLE: 'bg-indigo-100 text-indigo-700',
  LEVEL_CHANGE: 'bg-pink-100 text-pink-700',
};

const resourceColors: Record<string, string> = {
  user: 'bg-blue-100 text-blue-700',
  supplier: 'bg-green-100 text-green-700',
  project: 'bg-purple-100 text-purple-700',
  evaluation: 'bg-orange-100 text-orange-700',
};

export default function AuditLogsPage() {
  const { data: currentUser } = useAuth();
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    resource: '',
    page: 1,
  });
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [actionStats, setActionStats] = useState<StatItem[] | null>(null);
  const [resourceStats, setResourceStats] = useState<StatItem[] | null>(null);
  const [userStats, setUserStats] = useState<StatItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const canView = currentUser?.permissions?.includes('audit:view');

  useEffect(() => {
    if (!canView) return;

    async function fetchData() {
      try {
        const queryParams = new URLSearchParams({
          page: filters.page.toString(),
          pageSize: '20',
        });
        if (filters.action) queryParams.set('action', filters.action);
        if (filters.resource) queryParams.set('resource', filters.resource);
        if (filters.userId) queryParams.set('userId', filters.userId);

        const [logsRes, statsRes] = await Promise.all([
          fetch(`/api/admin/audit-logs?${queryParams}`),
          fetch('/api/admin/audit-logs/stats'),
        ]);

        if (logsRes.ok) {
          setAuditData(await logsRes.json());
        }
        if (statsRes.ok) {
          const stats = await statsRes.json();
          setActionStats(stats.actions);
          setResourceStats(stats.resources);
          setUserStats(stats.users);
        }
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [canView, filters.page, filters.action, filters.resource, filters.userId]);

  if (!canView) {
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
        <h1 className="text-2xl font-semibold text-gray-900">审计日志</h1>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">操作类型</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {actionStats?.map((stat) => (
                <Badge
                  key={stat.action}
                  className={stat.action ? actionColors[stat.action] || 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-700'}
                  variant="secondary"
                >
                  {stat.action}: {stat.count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">资源类型</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {resourceStats?.map((stat) => (
                <Badge
                  key={stat.resource}
                  className={stat.resource ? resourceColors[stat.resource] || 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-700'}
                  variant="secondary"
                >
                  {stat.resource}: {stat.count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">活跃用户</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {userStats?.slice(0, 3).map((stat) => (
                <div key={stat.userId} className="flex items-center justify-between text-sm">
                  <span>用户：{stat.userId ? stat.userId.slice(0, 8) + '...' : '未知'}</span>
                  <Badge variant="outline">{stat.count} 次</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>操作类型</Label>
              <Select
                value={filters.action === 'all' ? '' : filters.action}
                onValueChange={(value) => setFilters({ ...filters, action: value || '', page: 1 })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部" items={[{ value: '', label: '全部' }, ...(actionStats?.map(s => ({ value: s.action || '', label: s.action || '' })) || [])]} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部</SelectItem>
                  {actionStats?.map((stat) => (
                    <SelectItem key={stat.action} value={stat.action}>
                      {stat.action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>资源类型</Label>
              <Select
                value={filters.resource === 'all' ? '' : filters.resource}
                onValueChange={(value) => setFilters({ ...filters, resource: value || '', page: 1 })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部" items={[{ value: '', label: '全部' }, ...(resourceStats?.map(s => ({ value: s.resource || '', label: s.resource || '' })) || [])]} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部</SelectItem>
                  {resourceStats?.map((stat) => (
                    <SelectItem key={stat.resource} value={stat.resource}>
                      {stat.resource}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>操作</Label>
              <Button
                variant="outline"
                onClick={() => setFilters({ userId: '', action: '', resource: '', page: 1 })}
              >
                重置筛选
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>操作日志</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>用户</TableHead>
                    <TableHead>操作</TableHead>
                    <TableHead>资源</TableHead>
                    <TableHead>资源 ID</TableHead>
                    <TableHead>详情</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditData?.logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleString('zh-CN')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.user?.displayName || log.user?.username || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={actionColors[log.action] || 'bg-gray-100 text-gray-700'}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={resourceColors[log.resource] || 'bg-gray-100 text-gray-700'}
                          variant="outline"
                        >
                          {log.resource}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {log.resourceId || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">
                        {log.details || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {auditData && auditData.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    第 {auditData.page} 页，共 {auditData.totalPages} 页，总计 {auditData.total} 条
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={auditData.page <= 1}
                      onClick={() => setFilters({ ...filters, page: auditData.page - 1 })}
                    >
                      上一页
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={auditData.page >= auditData.totalPages}
                      onClick={() => setFilters({ ...filters, page: auditData.page + 1 })}
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
