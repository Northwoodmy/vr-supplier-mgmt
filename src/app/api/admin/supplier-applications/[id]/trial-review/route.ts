import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { trialResult, trialComments, nextStatus } = body;

    if (!trialResult || !['through', 'failed'].includes(trialResult)) {
      return NextResponse.json(
        { error: '请选择正确的试运行结果' },
        { status: 400 }
      );
    }

    // 获取当前登录用户
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('next-auth.session-token')?.value;
    let currentUserId = null;

    if (sessionToken) {
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true }
      });
      if (session) {
        currentUserId = session.userId;
      }
    }

    // 如果没有找到用户，使用 admin 用户 ID
    if (!currentUserId) {
      const adminUser = await prisma.user.findFirst({
        where: { username: 'admin' }
      });
      currentUserId = adminUser?.id || 'system';
    }

    // 确定下一步状态
    let finalNextStatus: 'approved' | 'rejected' = nextStatus || (trialResult === 'through' ? 'approved' : 'rejected');
    let rejectedReason = null;

    if (trialResult === 'failed') {
      rejectedReason = `试运行未通过：${trialComments || '试运行评估未达标'}`;
    }

    // 如果通过，创建正式供应商记录
    let supplierId = null;
    if (trialResult === 'through') {
      // 先获取申请记录
      const application = await prisma.supplierApplication.findUnique({
        where: { id }
      });

      if (application) {
        // 创建正式供应商（默认为 B 级）
        const supplier = await prisma.supplier.create({
          data: {
            name: application.companyName,
            level: 'B', // 通过评审的供应商默认为 B 级
            status: 'active',
            contactPerson: application.contactName,
            contactEmail: application.contactEmail,
            contactPhone: application.contactPhone,
            description: `自动创建自准入申请 - ${application.engineCapability || '未指定'} 引擎能力`,
            techStack: application.engineCapability || 'UE5', // 根据引擎能力设置
            createdById: currentUserId,
            // applicationId 字段存在外键约束问题，暂时不保存
          },
        });

        // 更新申请记录，关联供应商
        await prisma.supplierApplication.update({
          where: { id },
          data: { supplierId: supplier.id },
        });

        supplierId = supplier.id;

        // 如果申请记录中有团队规模和引擎能力，创建产能配置和团队记录
        const totalMembers = application.teamSize || 10;
        const capacityFactor = totalMembers < 10 ? 0.7 : totalMembers >= 10 && totalMembers < 20 ? 0.8 : totalMembers >= 20 && totalMembers < 50 ? 0.75 : 0.7;

        if (application.teamSize || application.engineCapability) {
          await prisma.supplierCapacity.create({
            data: {
              supplierId: supplier.id,
              totalMembers,
              capacityFactor,
              monthlyCapacity: totalMembers * capacityFactor,
            },
          });
        }

        // 创建团队记录（如果有引擎能力信息）
        if (application.engineCapability) {
          const roles = [];
          if (application.engineCapability === 'UE5' || application.engineCapability === 'Both') {
            roles.push({ role: 'UE5 工程师', category: 'engineering', count: Math.floor(totalMembers * 0.3), seniorCount: Math.floor(totalMembers * 0.1) });
          }
          if (application.engineCapability === 'Unity' || application.engineCapability === 'Both') {
            roles.push({ role: 'U3D 工程师', category: 'engineering', count: Math.floor(totalMembers * 0.2), seniorCount: Math.floor(totalMembers * 0.08) });
          }
          roles.push({ role: '美术师', category: 'art', count: Math.floor(totalMembers * 0.25), seniorCount: Math.floor(totalMembers * 0.1) });
          roles.push({ role: '动画师', category: 'animation', count: Math.floor(totalMembers * 0.15), seniorCount: Math.floor(totalMembers * 0.05) });

          for (const roleData of roles) {
            if (roleData.count > 0) {
              await prisma.teamMember.create({
                data: {
                  supplierId: supplier.id,
                  ...roleData,
                },
              });
            }
          }
        }
      }
    }

    // 更新申请记录
    const updatedApplication = await prisma.supplierApplication.update({
      where: { id },
      data: {
        trialResult,
        trialComments,
        trialProjectAt: new Date(),
        status: finalNextStatus,
        rejectedReason: rejectedReason,
        completedAt: finalNextStatus === 'rejected' ? new Date() : new Date(),
        supplierId, // 关联创建的供应商
      },
    });

    return NextResponse.json({
      ...updatedApplication,
      createdSupplierId: supplierId,
    });
  } catch (error) {
    console.error('Failed to submit trial review:', error);
    return NextResponse.json(
      { error: '提交失败：' + (error as Error).message },
      { status: 500 }
    );
  }
}
