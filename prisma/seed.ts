import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';

const adapter = new PrismaBetterSqlite3({ url: 'file:../dev.db' });

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('开始初始化数据库...');

  // 创建默认角色
  const roles = [
    {
      name: 'super_admin',
      displayName: '超级管理员',
      description: '完整系统权限，包括用户管理',
      permissions: [
        'user:manage', 'user:create', 'user:edit', 'user:delete', 'user:assign-role',
        'supplier:manage', 'supplier:create', 'supplier:edit', 'supplier:delete',
        'project:manage', 'project:create', 'project:edit', 'project:delete',
        'evaluation:manage', 'evaluation:create', 'evaluation:edit',
        'report:view', 'report:export',
        'capacity:view', 'capacity:assess',
        'audit:view'
      ],
    },
    {
      name: 'admin',
      displayName: '管理员',
      description: '管理供应商和项目，查看报表',
      permissions: [
        'supplier:manage', 'supplier:create', 'supplier:edit', 'supplier:delete',
        'project:manage', 'project:create', 'project:edit', 'project:delete',
        'evaluation:manage', 'evaluation:create', 'evaluation:edit',
        'report:view', 'report:export',
        'capacity:view', 'capacity:assess',
      ],
    },
    {
      name: 'user',
      displayName: '普通用户',
      description: '基础编辑和查看权限',
      permissions: [
        'supplier:create', 'supplier:edit',
        'project:create', 'project:edit',
        'evaluation:create', 'evaluation:edit',
        'report:view',
        'capacity:view',
      ],
    },
  ];

  for (const roleData of roles) {
    await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: {
        name: roleData.name,
        displayName: roleData.displayName,
        description: roleData.description,
        permissions: JSON.stringify(roleData.permissions),
      },
    });
    console.log(`角色 ${roleData.displayName} 已创建/更新`);
  }

  // 创建初始超级管理员账号
  const adminUsername = 'admin';
  const adminEmail = 'admin@example.com';
  const adminPassword = 'Admin@123';

  const existingAdmin = await prisma.user.findFirst({
    where: { username: adminUsername },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const adminUser = await prisma.user.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        passwordHash,
        displayName: '系统管理员',
        status: 'active',
      },
    });

    // 分配超级管理员角色
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'super_admin' },
    });

    if (superAdminRole) {
      await prisma.userRole.create({
        data: {
          userId: adminUser.id,
          roleId: superAdminRole.id,
          assignedBy: 'system',
        },
      });
      console.log('超级管理员角色已分配');
    }

    console.log(`初始超级管理员已创建：${adminUsername} / ${adminPassword}`);
  } else {
    console.log('超级管理员账号已存在');
    // 重新获取用户以确保有 ID
    existingAdmin.id = existingAdmin.id;
  }

  // 确保 existingAdmin 有 ID（如果已存在则重新获取）
  const adminUserForSeed = existingAdmin || await prisma.user.findFirst({ where: { username: 'admin' } });

  console.log('数据库初始化完成！');

  // 创建测试供应商
  const testSuppliers = [
    {
      name: 'XX 科技有限公司',
      level: 'A' as const,
      techStack: 'UE5',
      status: 'active' as const,
      description: '专注于 UE5  VR 内容制作',
      contactPerson: '张三',
      contactEmail: 'zhangsan@xxtech.com',
      contactPhone: '13800138000',
      address: '北京市海淀区',
      teamMembers: [
        { role: 'UE5 工程师', category: 'engineering', count: 5, seniorCount: 2 },
        { role: '美术师', category: 'art', count: 8, seniorCount: 3 },
      ],
      totalMembers: 15,
      capacityFactor: 0.8,
    },
    {
      name: 'YY 工作室',
      level: 'B' as const,
      techStack: 'U3D',
      status: 'active' as const,
      description: 'Unity 3D 内容开发商',
      contactPerson: '李四',
      contactEmail: 'lisi@yystudio.com',
      teamMembers: [
        { role: 'U3D 工程师', category: 'engineering', count: 3, seniorCount: 1 },
        { role: '动画师', category: 'animation', count: 4, seniorCount: 2 },
      ],
      totalMembers: 10,
      capacityFactor: 0.8,
    },
    {
      name: 'ZZ 传媒',
      level: 'S' as const,
      techStack: 'Both',
      status: 'active' as const,
      description: '双引擎全能供应商',
      contactPerson: '王五',
      contactEmail: 'wangwu@zzmedia.com',
      teamMembers: [
        { role: 'UE5 工程师', category: 'engineering', count: 10, seniorCount: 5 },
        { role: 'U3D 工程师', category: 'engineering', count: 8, seniorCount: 4 },
        { role: '美术师', category: 'art', count: 15, seniorCount: 8 },
        { role: '动画师', category: 'animation', count: 12, seniorCount: 6 },
      ],
      totalMembers: 50,
      capacityFactor: 0.75,
    },
  ];

  for (const supplierData of testSuppliers) {
    const { teamMembers, totalMembers, capacityFactor, ...supplier } = supplierData;
    const created = await prisma.supplier.create({
      data: {
        ...supplier,
        createdById: adminUserForSeed?.id || 'unknown',
        teamMembers: {
          create: teamMembers.map(tm => ({
            ...tm,
          })),
        },
        capacity: {
          create: {
            totalMembers,
            capacityFactor,
            monthlyCapacity: totalMembers * capacityFactor,
          },
        },
      },
      include: {
        teamMembers: true,
        capacity: true,
      },
    });
    console.log(`供应商 ${created.name} 已创建`);
  }

  // 创建测试项目
  const suppliers = await prisma.supplier.findMany();
  if (suppliers.length > 0) {
    const testProjects = [
      {
        name: '科幻短片《星际穿越》',
        code: 'PRJ-2024-001',
        description: '5 分钟科幻 VR 短片',
        budget: 500000,
        status: 'production' as const,
        currentStage: 'production' as const,
        startDate: new Date('2024-01-01'),
        expectedDeliveryDate: new Date('2024-06-30'),
      },
      {
        name: 'VR 体验《海底世界》',
        code: 'PRJ-2024-002',
        description: '沉浸式海底 VR 体验',
        budget: 350000,
        status: 'review' as const,
        currentStage: 'review' as const,
        startDate: new Date('2024-02-01'),
        expectedDeliveryDate: new Date('2024-05-31'),
      },
    ];

    for (const projectData of testProjects) {
      const created = await prisma.project.create({
        data: {
          ...projectData,
          createdById: adminUserForSeed?.id || 'unknown',
          suppliers: {
            create: {
              supplierId: suppliers[0].id,
              estimatedManDays: 100,
              complexityLevel: 'medium' as const,
              currentStage: projectData.currentStage,
              workloadShare: 1.0,
            },
          },
        },
        include: {
          suppliers: true,
        },
      });
      console.log(`项目 ${created.name} 已创建`);
    }
  }

  console.log('测试数据创建完成！');

  // 创建品质评估数据
  console.log('\n开始创建品质评估数据...');
  const createdProjects = await prisma.project.findMany({
    include: { suppliers: true }
  });

  const adminUser = await prisma.user.findFirst({ where: { username: 'admin' } });

  const evaluationData = [
    {
      projectId: createdProjects.find(p => p.code === 'PRJ-2024-001')!.id,
      supplierId: suppliers[0].id,
      reviewerId: adminUser!.id,
      visualQuality: 4.5,
      animationSmoothness: 4.0,
      vfxMatch: 4.5,
      audioQuality: 4.0,
      cameraWork: 4.5,
      storyNovelty: 4.0,
      totalScore: 4.5 * 0.25 + 4.0 * 0.20 + 4.5 * 0.15 + 4.0 * 0.15 + 4.5 * 0.15 + 4.0 * 0.10,
      comments: '整体质量优秀，视觉特效出色',
      status: 'approved' as const,
    },
    {
      projectId: createdProjects.find(p => p.code === 'PRJ-2024-002')!.id,
      supplierId: suppliers[0].id,
      reviewerId: adminUser!.id,
      visualQuality: 4.0,
      animationSmoothness: 4.5,
      vfxMatch: 4.0,
      audioQuality: 4.5,
      cameraWork: 4.0,
      storyNovelty: 4.5,
      totalScore: 4.0 * 0.25 + 4.5 * 0.20 + 4.0 * 0.15 + 4.5 * 0.15 + 4.0 * 0.15 + 4.5 * 0.10,
      comments: 'VR 体验沉浸感强，动画流畅',
      status: 'approved' as const,
    },
  ];

  for (const evalData of evaluationData) {
    const review = await prisma.qualityReview.create({
      data: evalData,
    });
    console.log(`品质评估已创建：${review.id}`);
  }

  // 创建供应商年度评级
  console.log('\n开始创建供应商评级数据...');
  const ratingsData = [
    {
      supplierId: suppliers[0].id,
      year: 2024,
      projectCount: 5,
      avgQualityScore: 4.25,
      totalCost: 800000,
      costPerformance: 5.31,
    },
    {
      supplierId: suppliers[1].id,
      year: 2024,
      projectCount: 3,
      avgQualityScore: 3.8,
      totalCost: 450000,
      costPerformance: 8.44,
    },
    {
      supplierId: suppliers[2].id,
      year: 2024,
      projectCount: 8,
      avgQualityScore: 4.6,
      totalCost: 1500000,
      costPerformance: 3.07,
    },
  ];

  for (const ratingData of ratingsData) {
    const rating = await prisma.supplierRating.create({
      data: ratingData,
    });
    console.log(`供应商评级已创建：${rating.supplierId} - ${rating.year}`);
  }

  // 创建审计日志测试数据
  const auditLogsData = [
    { action: 'LOGIN', resource: 'user', details: '用户登录系统' },
    { action: 'CREATE', resource: 'supplier', details: '创建供应商 XX 科技有限公司' },
    { action: 'CREATE', resource: 'supplier', details: '创建供应商 YY 工作室' },
    { action: 'CREATE', resource: 'supplier', details: '创建供应商 ZZ 传媒' },
    { action: 'CREATE', resource: 'project', details: '创建项目 VR 体验《海底世界》' },
    { action: 'CREATE', resource: 'project', details: '创建项目 科幻短片《星际穿越》' },
    { action: 'UPDATE', resource: 'project', details: '更新项目状态' },
    { action: 'CREATE', resource: 'evaluation', details: '创建品质评估' },
    { action: 'ASSIGN_ROLE', resource: 'user', details: '分配用户角色' },
    { action: 'EXPORT', resource: 'report', details: '导出供应商报表' },
  ];

  const seedUser = await prisma.user.findFirst({ where: { username: 'admin' } });
  if (seedUser) {
    for (const logData of auditLogsData) {
      await prisma.auditLog.create({
        data: {
          userId: seedUser.id,
          action: logData.action,
          resource: logData.resource,
          details: logData.details,
        },
      });
    }
    console.log(`已创建 ${auditLogsData.length} 条审计日志测试数据`);
  }

  console.log('\n所有测试数据创建完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
