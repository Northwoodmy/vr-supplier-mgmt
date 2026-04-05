import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('next-auth.session-token')?.value;

    if (sessionToken) {
      // 删除 session
      await prisma.session.delete({
        where: { sessionToken },
      }).catch(() => {});

      // 清除 cookie
      cookieStore.set('next-auth.session-token', '', {
        httpOnly: true,
        secure: false, // 允许 HTTP 测试
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: '登出失败' },
      { status: 500 }
    );
  }
}
