import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * 检查供应商是否可以承接新项目
 * GET /api/suppliers/[id]/can-accept-project
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 获取供应商信息
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        projects: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: '供应商不存在' },
        { status: 404 }
      );
    }

    // 导入等级配置
    const { getLevelConfig, canAcceptComplexity, canAcceptNewProject } = await import('@/lib/supplier-level-config');
    const config = getLevelConfig(supplier.level);

    // 计算当前进行中项目数
    const activeProjects = supplier.projects.filter(p =>
      p.project.status !== 'completed' && p.project.status !== 'cancelled'
    );
    const currentProjectCount = activeProjects.length;

    // 检查是否可以承接新项目
    const canAccept = currentProjectCount < config.maxProjects;
    const remainingQuota = config.maxProjects - currentProjectCount;

    return NextResponse.json({
      supplierId: id,
      supplierName: supplier.name,
      level: supplier.level,
      currentProjectCount,
      maxProjects: config.maxProjects,
      canAccept,
      remainingQuota,
      reason: canAccept
        ? '可以承接新项目'
        : `已达到最大并行项目数限制 (${config.maxProjects}个)`,
      allowedComplexity: config.allowedComplexity,
      projectPriority: config.projectPriority,
    });
  } catch (error) {
    console.error('Failed to check project acceptance:', error);
    return NextResponse.json(
      { error: 'Failed to check project acceptance' },
      { status: 500 }
    );
  }
}
