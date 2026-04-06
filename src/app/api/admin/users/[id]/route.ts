import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // Transform to flatten role info
    const transformedUser = {
      ...user,
      roles: user.roles.map((ur: any) => ur.role),
    };

    return NextResponse.json(transformedUser);
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
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
    const { username, email, password, displayName, roleIds } = body;

    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 检查用户名是否已被其他用户使用
    const userWithSameName = await prisma.user.findFirst({
      where: { username, id: { not: id } },
    });

    if (userWithSameName) {
      return NextResponse.json(
        { error: '用户名已被使用' },
        { status: 400 }
      );
    }

    // 检查邮箱是否已被其他用户使用（如果提供了邮箱）
    if (email && email.trim() !== '') {
      const userWithSameEmail = await prisma.user.findFirst({
        where: { email: email.trim(), id: { not: id } },
      });
      if (userWithSameEmail) {
        return NextResponse.json(
          { error: '邮箱已被使用' },
          { status: 400 }
        );
      }
    }

    // 更新用户信息
    const updateData: any = {
      username,
      email: (email && email.trim() !== '') ? email.trim() : null,
      displayName: displayName || username,
    };

    // 如果提供了密码，则更新密码
    if (password && password.trim() !== '') {
      const bcrypt = await import('bcryptjs');
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    // 更新角色
    if (roleIds) {
      // 删除旧角色
      await prisma.userRole.deleteMany({
        where: { userId: id },
      });

      // 添加新角色
      if (roleIds.length > 0) {
        await prisma.userRole.createMany({
          data: roleIds.map((roleId: string) => ({
            userId: id,
            roleId,
            assignedBy: 'system', // 暂时使用 system
          })),
        });
      }
    }

    // 重新获取包含角色的用户信息
    const userWithRoles = await prisma.user.findUnique({
      where: { id },
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
      roles: userWithRoles!.roles.map((ur: any) => ur.role),
    };

    return NextResponse.json(transformedUser);
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
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

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
