import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('next-auth.session-token')?.value;

    if (!sessionToken) {
      return NextResponse.json(null);
    }

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        user: {
          include: {
            roles: {
              include: { role: true }
            }
          }
        }
      },
    });

    if (!session || session.expires < new Date()) {
      return NextResponse.json(null);
    }

    const roles = session.user.roles.map((r) => r.role.name);
    const permissions = session.user.roles.flatMap((r) => JSON.parse(r.role.permissions) as string[]);

    return NextResponse.json({
      id: session.user.id,
      username: session.user.username,
      email: session.user.email,
      displayName: session.user.displayName,
      avatar: session.user.avatar,
      roles,
      permissions,
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(null);
  }
}
