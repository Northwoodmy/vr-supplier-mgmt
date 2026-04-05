'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import { SaturationBadge } from '@/components/capacity/saturation-badge';
import { useState, useEffect } from 'react';

interface Saturation {
  supplierId: string;
  supplierName: string;
  saturationRate: number;
  monthlyCapacity: number;
  totalLoad: number;
  projectCount: number;
  status?: string;
}

interface Overview {
  totalSuppliers: number;
  avgSaturation: number;
  availableCount: number;
  cautionCount: number;
  saturatedCount: number;
  overloadCount: number;
}

export default function CapacityPage() {
  const router = useRouter();
  const [saturations, setSaturations] = useState<Saturation[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [satRes, overviewRes] = await Promise.all([
          fetch('/api/capacity/saturations'),
          fetch('/api/capacity/overview'),
        ]);
        if (satRes.ok) {
          setSaturations(await satRes.json());
        }
        if (overviewRes.ok) {
          setOverview(await overviewRes.json());
        }
      } catch (error) {
        console.error('Failed to fetch capacity data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">产能仪表盘</h1>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">供应商总数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalSuppliers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">可接项目</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{overview?.availableCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">需谨慎</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{overview?.cautionCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">已饱和</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overview?.saturatedCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">平均饱和度</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.avgSaturation || 0}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Capacity List */}
      <Card>
        <CardHeader>
          <CardTitle>供应商产能明细</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 text-sm font-medium text-gray-500 pb-2 border-b">
              <div className="col-span-4">供应商</div>
              <div className="col-span-2 text-center">月度产能</div>
              <div className="col-span-2 text-center">当前负载</div>
              <div className="col-span-3 text-center">饱和度</div>
              <div className="col-span-1 text-center">状态</div>
            </div>

            {/* Rows */}
            {saturations && saturations.length > 0 ? (
              saturations.map((supplier) => (
                <div
                  key={supplier.supplierId}
                  className="grid md:grid-cols-12 gap-4 items-center py-4 border-b last:border-0 hover:bg-gray-50 rounded-lg px-2 -mx-2 cursor-pointer"
                  onClick={() => router.push(`/suppliers/${supplier.supplierId}`)}
                >
                  <div className="col-span-4">
                    <div className="font-medium">{supplier.supplierName}</div>
                    <div className="text-sm text-gray-500">{supplier.projectCount}个并行项目</div>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-sm">{supplier.monthlyCapacity.toFixed(1)} 人天</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-sm">{supplier.totalLoad.toFixed(1)} 人天</span>
                  </div>
                  <div className="col-span-3">
                    <SaturationBadge saturationRate={supplier.saturationRate} />
                  </div>
                  <div className="col-span-1 text-center">
                    <Badge className={
                      supplier.saturationRate < 60 ? 'bg-green-500' :
                      supplier.saturationRate >= 60 && supplier.saturationRate < 80 ? 'bg-yellow-500' :
                      supplier.saturationRate >= 80 && supplier.saturationRate < 100 ? 'bg-red-500' :
                      'bg-gray-800'
                    }>
                      {supplier.saturationRate < 60 ? '空闲' :
                       supplier.saturationRate >= 60 && supplier.saturationRate < 80 ? '谨慎' :
                       supplier.saturationRate >= 80 && supplier.saturationRate < 100 ? '饱和' : '超载'}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                暂无产能数据
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>空闲 (0-60%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span>谨慎 (60-80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>饱和 (80-100%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-800"></div>
          <span>超载 (&gt;100%)</span>
        </div>
      </div>
    </div>
  );
}
