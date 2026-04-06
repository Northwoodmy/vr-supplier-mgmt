import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// 获取可用的年份列表
export async function getAvailableYears() {
  try {
    // 从 Project 表获取所有有项目的年份
    const projects = await prisma.project.findMany({
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const years = Array.from(
      new Set(projects.map(p => new Date(p.createdAt).getFullYear()))
    ).sort((a, b) => b - a);

    return NextResponse.json(years);
  } catch (error) {
    console.error('Failed to fetch available years:', error);
    return NextResponse.json([], { status: 500 });
  }
}

// 获取供应商评级报表
export async function GET(request: NextRequest) {
  try {
    // 从 URL 参数获取年份，默认为当前年份
    const searchParams = request.nextUrl.searchParams;
    const yearParam = searchParams.get('year');

    // 如果请求可用年份列表
    if (yearParam === 'list') {
      return getAvailableYears();
    }

    const targetYear = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

    // 获取该年份的起止时间
    const yearStart = new Date(targetYear, 0, 1);
    const yearEnd = new Date(targetYear + 1, 0, 1);

    // 获取所有供应商
    const suppliers = await prisma.supplier.findMany({
      include: {
        projects: {
          include: {
            project: {
              include: {
                qualityReviews: {
                  where: {
                    createdAt: {
                      gte: yearStart,
                      lt: yearEnd,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // 计算每个供应商的年度统计数据
    const ratings = suppliers
      .map((supplier) => {
        const supplierProjects = supplier.projects.filter(sp =>
          sp.project.createdAt >= yearStart && sp.project.createdAt < yearEnd
        );

        // 收集所有质量评价
        const allReviews = supplier.projects.flatMap(sp =>
          sp.project.qualityReviews.filter(r =>
            r.createdAt >= yearStart && r.createdAt < yearEnd
          )
        );

        const projectCount = supplierProjects.length;
        // 优先使用 SupplierProject 的 finalCost/estimatedCost，否则使用项目的 actualCost/budget
        const totalCost = supplierProjects.reduce((sum, sp) => {
          const projectCost = sp.finalCost || sp.estimatedCost || sp.project.actualCost || sp.project.budget || 0;
          return sum + projectCost;
        }, 0);

        // 计算平均质量分数
        const avgQualityScore = allReviews.length > 0
          ? allReviews.reduce((sum, r) => sum + r.totalScore, 0) / allReviews.length
          : 0;

        // 性价比 = 平均分 / (成本 in 万元)
        const costPerformance = totalCost > 0 ? avgQualityScore / (totalCost / 10000) : 0;

        return {
          id: `rating-${supplier.id}-${targetYear}`,
          supplierId: supplier.id,
          year: targetYear,
          projectCount,
          avgQualityScore: Math.round(avgQualityScore * 100) / 100,
          totalCost: Math.round(totalCost * 100) / 100,
          costPerformance: Math.round(costPerformance * 100) / 100,
          supplier: {
            id: supplier.id,
            name: supplier.name,
            level: supplier.level,
          },
        };
      })
      .filter(r => r.projectCount > 0); // 只显示有项目的供应商

    return NextResponse.json(ratings);
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
