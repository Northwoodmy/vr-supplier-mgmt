import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

/**
 * 初始化数据库
 * - 创建默认角色
 * - 创建初始超级管理员账号
 */
export async function initializeDatabase() {
  try {
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

    for (const role of roles) {
      await prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: {
          ...role,
          permissions: JSON.stringify(role.permissions),
        },
      });
    }

    // 创建初始超级管理员账号
    const adminUsername = process.env.INIT_ADMIN_USERNAME || 'admin';
    const adminEmail = process.env.INIT_ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.INIT_ADMIN_PASSWORD || 'Admin@123';

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
      }

      console.log(`初始超级管理员已创建：${adminUsername}`);
    }

    console.log('数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

/**
 * 检查用户是否有指定权限
 */
export async function userHasPermission(userId: string, permission: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user || user.status !== 'active') {
    return false;
  }

  // 检查是否有任一角色包含该权限
  for (const userRole of user.roles) {
    const permissions = JSON.parse(userRole.role.permissions) as string[];
    if (permissions.includes(permission)) {
      return true;
    }
  }
  return false;
}

/**
 * 获取用户的所有权限
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user || user.status !== 'active') {
    return [];
  }

  const allPermissions = new Set<string>();
  for (const userRole of user.roles) {
    const permissions = JSON.parse(userRole.role.permissions) as string[];
    for (const permission of permissions) {
      allPermissions.add(permission);
    }
  }

  return Array.from(allPermissions);
}

/**
 * 记录审计日志
 */
export async function logAudit(
  userId: string,
  action: string,
  resource: string,
  resourceId?: string | null,
  details?: Record<string, unknown>,
  ipAddress?: string | null,
  userAgent?: string | null,
) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      resource,
      resourceId,
      details: details ? JSON.stringify(details) : undefined,
      ipAddress,
      userAgent,
    },
  });
}
