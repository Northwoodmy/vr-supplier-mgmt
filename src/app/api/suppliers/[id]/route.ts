import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        teamMembers: true,
        capacity: true,
        projects: {
          include: {
            project: true,
          },
        },
        qualityReviews: true,
        levelChanges: true,
        trainings: true,
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: '供应商不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Failed to fetch supplier:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplier' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      // 团队架构（数组，需要单独处理）
      teamMembers,
      // JSON 字段
      coreMembers,
      equipment,
      sampleWorks,
    } = body;

    // 检查供应商是否存在
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        teamMembers: true,
        capacity: true,
      },
    });

    if (!existingSupplier) {
      return NextResponse.json(
        { error: '供应商不存在' },
        { status: 404 }
      );
    }

    // 更新供应商基本信息
    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: {
        // 基本信息
        name: name !== undefined ? name : existingSupplier.name,
        companyName: companyName !== undefined ? companyName : existingSupplier.companyName,
        level: level !== undefined ? level : existingSupplier.level,
        techStack: techStack !== undefined ? techStack : existingSupplier.techStack,
        status: status !== undefined ? status : existingSupplier.status,
        description: description !== undefined ? description : existingSupplier.description,
        // 联系信息
        contactPerson: contactPerson !== undefined ? contactPerson : existingSupplier.contactPerson,
        contactEmail: contactEmail !== undefined ? contactEmail : existingSupplier.contactEmail,
        contactPhone: contactPhone !== undefined ? contactPhone : existingSupplier.contactPhone,
        address: address !== undefined ? address : existingSupplier.address,
        // 资质信息
        legalRepresentative: legalRepresentative !== undefined ? legalRepresentative : existingSupplier.legalRepresentative,
        establishedDate: establishedDate !== undefined ? (establishedDate ? new Date(establishedDate) : null) : existingSupplier.establishedDate,
        registeredCapital: registeredCapital !== undefined ? registeredCapital : existingSupplier.registeredCapital,
        businessLicense: businessLicense !== undefined ? businessLicense : existingSupplier.businessLicense,
        businessScope: businessScope !== undefined ? businessScope : existingSupplier.businessScope,
        // 财务信息
        bankAccount: bankAccount !== undefined ? bankAccount : existingSupplier.bankAccount,
        bankName: bankName !== undefined ? bankName : existingSupplier.bankName,
        taxType: taxType !== undefined ? taxType : existingSupplier.taxType,
        // 其他
        creditRecord: creditRecord !== undefined ? creditRecord : existingSupplier.creditRecord,
        remarks: remarks !== undefined ? remarks : existingSupplier.remarks,
        // JSON 字段
        coreMembers: coreMembers !== undefined ? (coreMembers ? JSON.stringify(coreMembers) : null) : existingSupplier.coreMembers,
        equipment: equipment !== undefined ? (equipment ? JSON.stringify(equipment) : null) : existingSupplier.equipment,
        sampleWorks: sampleWorks !== undefined ? (sampleWorks ? JSON.stringify(sampleWorks) : null) : existingSupplier.sampleWorks,
      },
      include: {
        teamMembers: true,
        capacity: true,
      },
    });

    // 更新产能配置
    if (capacity && updatedSupplier.id) {
      if (existingSupplier.capacity) {
        await prisma.supplierCapacity.update({
          where: { supplierId: updatedSupplier.id },
          data: {
            totalMembers: capacity.totalMembers !== undefined ? capacity.totalMembers : existingSupplier.capacity.totalMembers,
            capacityFactor: capacity.capacityFactor !== undefined ? capacity.capacityFactor : existingSupplier.capacity.capacityFactor,
            monthlyCapacity: capacity.monthlyCapacity !== undefined ? capacity.monthlyCapacity : existingSupplier.capacity.monthlyCapacity,
          },
        });
      } else {
        await prisma.supplierCapacity.create({
          data: {
            supplierId: updatedSupplier.id,
            totalMembers: capacity.totalMembers,
            capacityFactor: capacity.capacityFactor || 0.8,
            monthlyCapacity: capacity.monthlyCapacity || capacity.totalMembers * 0.8,
          },
        });
      }
    }

    // 更新团队成员（先删除旧的，再创建新的）
    if (teamMembers !== undefined && updatedSupplier.id) {
      // 删除现有团队成员
      await prisma.teamMember.deleteMany({
        where: { supplierId: updatedSupplier.id },
      });

      // 创建新的团队成员
      if (teamMembers && teamMembers.length > 0) {
        for (const member of teamMembers) {
          await prisma.teamMember.create({
            data: {
              supplierId: updatedSupplier.id,
              role: member.role,
              category: member.category,
              count: member.count || 1,
              seniorCount: member.seniorCount || 0,
            },
          });
        }
      }
    }

    // 重新查询包含关联数据的供应商
    const fullSupplier = await prisma.supplier.findUnique({
      where: { id: updatedSupplier.id },
      include: {
        teamMembers: true,
        capacity: true,
      },
    });

    return NextResponse.json(fullSupplier);
  } catch (error) {
    console.error('Failed to update supplier:', error);
    return NextResponse.json(
      { error: 'Failed to update supplier' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        projects: true,
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: '供应商不存在' },
        { status: 404 }
      );
    }

    // 检查是否有关联的项目
    if (supplier.projects.length > 0) {
      return NextResponse.json(
        { error: '该供应商已关联项目，无法删除' },
        { status: 400 }
      );
    }

    await prisma.supplier.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete supplier:', error);
    return NextResponse.json(
      { error: 'Failed to delete supplier' },
      { status: 500 }
    );
  }
}
