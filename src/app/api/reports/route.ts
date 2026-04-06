import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// 获取供应商评级报表
export async function GET() {
  try {
    // 获取当前年份
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear + 1, 0, 1);

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
          id: `rating-${supplier.id}-${currentYear}`,
          supplierId: supplier.id,
          year: currentYear,
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
