import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        teamMembers: true,
        capacity: true,
        _count: {
          select: { projects: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error('Failed to fetch suppliers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      // 基本信息
      name,
      companyName,
      level,
      techStack,
      status,
      description,
      // 联系信息
      contactPerson,
      contactEmail,
      contactPhone,
      address,
      // 资质信息
      legalRepresentative,
      establishedDate,
      registeredCapital,
      businessLicense,
      businessScope,
      // 财务信息
      bankAccount,
      bankName,
      taxType,
      // 其他
      creditRecord,
      remarks,
      // 产能配置
      capacity,
      // 团队架构
      teamMembers,
      // 核心成员、设备情况、代表作品（JSON 格式存储）
      coreMembers,
      equipment,
      sampleWorks,
    } = body;

    // 获取当前用户 ID（简化处理，使用 admin 用户）
    const adminUser = await prisma.user.findFirst({
      where: { username: 'admin' },
    });

    // 创建供应商
    const supplier = await prisma.supplier.create({
      data: {
        // 基本信息
        name,
        companyName,
        level: level || 'B',
        techStack: techStack || 'UE5',
        status: status || 'active',
        description,
        // 联系信息
        contactPerson,
        contactEmail,
        contactPhone,
        address,
        // 资质信息
        legalRepresentative,
        establishedDate: establishedDate ? new Date(establishedDate) : null,
        registeredCapital,
        businessLicense,
        businessScope,
        // 财务信息
        bankAccount,
        bankName,
        taxType,
        // 其他
        creditRecord,
        remarks,
        // JSON 字段
        coreMembers: coreMembers ? JSON.stringify(coreMembers) : null,
        equipment: equipment ? JSON.stringify(equipment) : null,
        sampleWorks: sampleWorks ? JSON.stringify(sampleWorks) : null,
        // 创建者
        createdById: adminUser?.id || 'system',
      },
      include: {
        teamMembers: true,
        capacity: true,
      },
    });

    // 创建产能配置
    if (capacity && supplier.id) {
      await prisma.supplierCapacity.create({
        data: {
          supplierId: supplier.id,
          totalMembers: capacity.totalMembers,
          capacityFactor: capacity.capacityFactor || 0.8,
          monthlyCapacity: capacity.monthlyCapacity || capacity.totalMembers * 0.8,
        },
      });
    }

    // 创建团队成员
    if (teamMembers && teamMembers.length > 0 && supplier.id) {
      for (const member of teamMembers) {
        await prisma.teamMember.create({
          data: {
            supplierId: supplier.id,
            role: member.role,
            category: member.category,
            count: member.count || 1,
            seniorCount: member.seniorCount || 0,
          },
        });
      }
    }

    // 重新查询包含关联数据的供应商
    const fullSupplier = await prisma.supplier.findUnique({
      where: { id: supplier.id },
      include: {
        teamMembers: true,
        capacity: true,
      },
    });

    return NextResponse.json(fullSupplier);
  } catch (error) {
    console.error('Failed to create supplier:', error);
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    );
  }
}
