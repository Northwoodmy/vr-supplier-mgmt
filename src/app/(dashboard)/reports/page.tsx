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
import { useEffect, useState } from 'react';

interface SupplierRating {
  id: string;
  supplierId: string;
  year: number;
  projectCount: number;
  avgQualityScore: number;
  totalCost: number;
  costPerformance: number;
  supplier?: {
    id: string;
    name: string;
    level: string;
  };
}

const levelColors = {
  S: 'bg-purple-100 text-purple-800',
  A: 'bg-blue-100 text-blue-800',
  B: 'bg-green-100 text-green-800',
  C: 'bg-gray-100 text-gray-800',
};

export default function ReportsPage() {
  const { data: currentUser } = useAuth();
  const [ratings, setRatings] = useState<SupplierRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // 检查权限
  const canViewReport = currentUser?.permissions?.includes('report:view');
  const canExport = currentUser?.permissions?.includes('report:export');

  // 获取可用年份列表
  useEffect(() => {
    if (!canViewReport) return;

    async function fetchYears() {
      try {
        const res = await fetch('/api/reports?year=list');
        if (res.ok) {
          const years = await res.json();
          setAvailableYears(years);
          // 默认选择最新年份
          if (years.length > 0) {
            setSelectedYear(years[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch available years:', error);
      }
    }
    fetchYears();
  }, [canViewReport]);

  // 获取报表数据
  useEffect(() => {
    if (!canViewReport) return;

    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/reports?year=${selectedYear}`);
        if (res.ok) {
          const data = await res.json();
          setRatings(data);
        }
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [canViewReport, selectedYear]);

  // 按选中年份过滤和排名
  const currentYearRatings = ratings
    .filter(r => r.supplier)
    .sort((a, b) => b.costPerformance - a.costPerformance)
    .map((rating, index) => ({
      ...rating,
      rank: index + 1,
    }));

  // 计算统计数据
  const totalProjects = currentYearRatings.reduce((sum, r) => sum + r.projectCount, 0);
  const avgScore = currentYearRatings.length > 0
    ? currentYearRatings.reduce((sum, r) => sum + r.avgQualityScore, 0) / currentYearRatings.length
    : 0;
  const activeSuppliers = currentYearRatings.length;
  const highLevelSuppliers = currentYearRatings.filter(r => r.supplier?.level === 'S' || r.supplier?.level === 'A').length;
  const highLevelPercent = activeSuppliers > 0 ? Math.round((highLevelSuppliers / activeSuppliers) * 100) : 0;

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
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-gray-900">报表统计</h1>
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="h-10 rounded-md border border-input bg-background px-4 py-2 text-sm focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}年度
                </option>
              ))}
            </select>
          </div>
        </div>
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
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-gray-500 mt-1">{selectedYear}年度</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">平均品质分数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{avgScore.toFixed(1)} / 5.0</div>
            <p className="text-xs text-gray-500 mt-1">6 维度加权平均</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">活跃供应商</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSuppliers}</div>
            <p className="text-xs text-gray-500 mt-1">S/A 级占 {highLevelPercent}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Ranking Table */}
      <Card>
        <CardHeader>
          <CardTitle>{selectedYear}年度供应商排名</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : currentYearRatings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无数据</div>
          ) : (
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
                {currentYearRatings.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-center">
                      <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold
                        ${item.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                          item.rank === 2 ? 'bg-gray-100 text-gray-700' :
                          item.rank === 3 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-50 text-gray-500'}`}>
                        {item.rank}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.supplier?.name || '-'}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={levelColors[item.supplier?.level as keyof typeof levelColors]}>
                        {item.supplier?.level}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{item.projectCount}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-semibold">{item.avgQualityScore.toFixed(1)}</span>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
