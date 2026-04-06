import { prisma } from './prisma';

/**
 * 记录审计日志
 */
export async function logAudit(
  userId: string,
  action: string,
  resource: string,
  resourceId?: string | null,
  details?: string,
  ipAddress?: string | null,
  userAgent?: string | null,
) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
    },
  });
}

/**
 * 从 request 中获取当前用户
 */
export async function getCurrentUser(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(';').map(c => c.trim());
    const sessionCookie = cookies.find(c => c.startsWith('next-auth.session-token='));

    if (!sessionCookie) return null;

    const sessionToken = sessionCookie.split('=')[1];

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (!session || session.expires < new Date()) {
      return null;
    }

    const roles = session.user.roles.map((r) => r.role.name);
    const permissions = session.user.roles.flatMap((r) => JSON.parse(r.role.permissions) as string[]);

    return {
      id: session.user.id,
      username: session.user.username,
      email: session.user.email,
      displayName: session.user.displayName,
      avatar: session.user.avatar,
      roles,
      permissions,
    };
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}
