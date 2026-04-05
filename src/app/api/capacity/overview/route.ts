import { NextResponse } from 'next/server';

// 获取产能概览数据
export async function GET() {
  try {
    // 从 saturations API 获取数据
    const saturationsRes = await fetch('http://localhost:23456/api/capacity/saturations');
    const saturations = await saturationsRes.json();

    const totalSuppliers = saturations.length;
    const avgSaturation = saturations.length > 0
      ? Math.round(saturations.reduce((acc: number, s: any) => acc + s.saturationRate, 0) / saturations.length)
      : 0;

    const availableCount = saturations.filter((s: any) => s.saturationRate < 60).length;
    const cautionCount = saturations.filter((s: any) => s.saturationRate >= 60 && s.saturationRate < 80).length;
    const saturatedCount = saturations.filter((s: any) => s.saturationRate >= 80 && s.saturationRate < 100).length;
    const overloadCount = saturations.filter((s: any) => s.saturationRate >= 100).length;

    return NextResponse.json({
      totalSuppliers,
      avgSaturation,
      availableCount,
      cautionCount,
      saturatedCount,
      overloadCount,
    });
  } catch (error) {
    console.error('Failed to fetch capacity overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch capacity overview' },
      { status: 500 }
    );
  }
}
