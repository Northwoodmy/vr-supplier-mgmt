import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform data to flatten role info
    const transformedUsers = users.map(user => ({
      ...user,
      roles: user.roles.map((ur: any) => ur.role),
    }));

    return NextResponse.json(transformedUsers);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, password, displayName, roleIds } = body;

    // 检查用户名是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '用户名已存在' },
        { status: 400 }
      );
    }

    // 检查邮箱是否已被使用（如果提供了邮箱）
    if (email && email.trim() !== '') {
      const existingEmail = await prisma.user.findUnique({
        where: { email: email.trim() },
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: '邮箱已被使用' },
          { status: 400 }
        );
      }
    }

    // 加密密码
    const passwordHash = await hash(password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        username,
        email: (email && email.trim() !== '') ? email.trim() : null,
        passwordHash,
        displayName: displayName || username,
      },
      include: {
        roles: true,
      },
    });

    // 如果有角色 ID，分配角色
    if (roleIds && roleIds.length > 0) {
      await prisma.userRole.createMany({
        data: roleIds.map((roleId: string) => ({
          userId: user.id,
          roleId,
          assignedBy: 'system',
        })),
      });
    }

    // 重新获取包含角色的用户信息
    const userWithRoles = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Transform to flatten role info
    const transformedUser = {
      ...userWithRoles,
      roles: userWithRoles?.roles.map((ur: any) => ur.role) || [],
    };

    return NextResponse.json(transformedUser);
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
