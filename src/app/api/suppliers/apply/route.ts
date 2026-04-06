import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[Apply API] Request body:', JSON.stringify(body, null, 2));
    const {
      // 基本信息
      companyName,
      contactName,
      contactPhone,
      contactEmail,
      // 资质信息
      registeredCapital,
      businessLicense,
      businessScope,
      // 财务/银行信息
      bankRating,
      creditRecord,
      // 团队信息
      teamSize,
      totalMembers,
      capacityFactor,
      // 引擎能力
      engineCapability,
      // JSON 字段
      coreMembers,
      equipment,
      sampleWorks,
      // 其他
      companyDescription,
    } = body;

    // 验证必填字段
    if (!companyName || !contactName || !contactPhone || !contactEmail) {
      return NextResponse.json(
        { error: '请填写所有必填字段' },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      return NextResponse.json(
        { error: '邮箱格式不正确' },
        { status: 400 }
      );
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(contactPhone)) {
      return NextResponse.json(
        { error: '手机号格式不正确' },
        { status: 400 }
      );
    }

    // 创建申请记录
    const application = await prisma.supplierApplication.create({
      data: {
        companyName,
        contactName,
        contactPhone,
        contactEmail,
        registeredCapital: registeredCapital ? parseFloat(registeredCapital) : null,
        businessLicense: businessLicense || null,
        businessScope: businessScope || null,
        teamSize: teamSize ? parseInt(teamSize) : (totalMembers ? parseInt(totalMembers) : null),
        engineCapability: engineCapability || null,
        bankRating: bankRating || null,
        creditRecord: creditRecord || null,
        // JSON 字段
        coreMembers: coreMembers && coreMembers.length > 0 ? JSON.stringify(coreMembers) : null,
        equipment: equipment && equipment.length > 0 ? JSON.stringify(equipment) : null,
        sampleWorks: sampleWorks && sampleWorks.length > 0 ? JSON.stringify(sampleWorks) : null,
      },
    });

    console.log('[Apply API] Application created:', application.id);

    return NextResponse.json({
      id: application.id,
      message: '申请提交成功',
    });
  } catch (error) {
    console.error('Failed to submit supplier application:', error);
    return NextResponse.json(
      { error: '提交失败，请稍后重试' },
      { status: 500 }
    );
  }
}
