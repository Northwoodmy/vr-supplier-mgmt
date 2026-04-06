'use client';

import { useAuth } from '@/lib/auth-hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// 临时数据
const rankingData = [
  { rank: 1, name: 'ZZ 传媒', level: 'S', projects: 15, avgScore: 4.5, totalCost: 450, costPerformance: 0.100 },
  { rank: 2, name: 'XX 科技有限公司', level: 'A', projects: 12, avgScore: 4.2, totalCost: 380, costPerformance: 0.089 },
  { rank: 3, name: 'YY 工作室', level: 'B', projects: 8, avgScore: 4.0, totalCost: 220, costPerformance: 0.082 },
  { rank: 4, name: 'BB 创意工坊', level: 'B', projects: 6, avgScore: 3.9, totalCost: 180, costPerformance: 0.078 },
  { rank: 5, name: 'AA 数字艺术', level: 'C', projects: 4, avgScore: 3.5, totalCost: 120, costPerformance: 0.058 },
];

const levelColors = {
  S: 'bg-purple-100 text-purple-800',
  A: 'bg-blue-100 text-blue-800',
  B: 'bg-green-100 text-green-800',
  C: 'bg-gray-100 text-gray-800',
};

export default function ReportsPage() {
  const { data: currentUser } = useAuth();

  // 检查权限
  const canViewReport = currentUser?.permissions?.includes('report:view');
  const canExport = currentUser?.permissions?.includes('report:export');

  if (!canViewReport) {
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
        <h1 className="text-2xl font-semibold text-gray-900">报表统计</h1>
        <div className="flex gap-2">
          {canExport && (
            <Button variant="outline" onClick={() => alert('导出功能开发中...')}>
              导出 Excel
            </Button>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">合作项目数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-gray-500 mt-1">较上年 +8</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">平均品质分数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">4.1 / 5.0</div>
            <p className="text-xs text-gray-500 mt-1">较上年 +0.2</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">活跃供应商</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-gray-500 mt-1">S/A 级占 45%</p>
          </CardContent>
        </Card>
      </div>

      {/* Ranking Table */}
      <Card>
        <CardHeader>
          <CardTitle>年度供应商排名</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">排名</TableHead>
                <TableHead>供应商</TableHead>
                <TableHead className="text-center">等级</TableHead>
                <TableHead className="text-center">项目数</TableHead>
                <TableHead className="text-center">平均分</TableHead>
                <TableHead className="text-center">性价比</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankingData.map((item) => (
                <TableRow key={item.name}>
                  <TableCell className="text-center">
                    <div className="w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold
                      {item.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                        item.rank === 2 ? 'bg-gray-100 text-gray-700' :
                        item.rank === 3 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-50 text-gray-500'}">
                      {item.rank}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={levelColors[item.level as keyof typeof levelColors]}>
                      {item.level}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{item.projects}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-semibold">{item.avgScore}</span>
                      <span className="text-xs text-gray-500">/ 5.0</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm font-medium">{item.costPerformance.toFixed(3)}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
