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

    // 加密密码
    const passwordHash = await hash(password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        username,
        email,
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
        })),
      });
    }

    // 重新获取包含角色的用户信息
    const userWithRoles = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        roles: true,
      },
    });

    return NextResponse.json(userWithRoles);
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
