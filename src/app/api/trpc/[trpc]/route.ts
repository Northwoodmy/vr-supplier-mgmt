import { prisma } from '@/lib/prisma';
import { appRouter } from '@/server/trpc/router';
import { TRPCError } from '@trpc/server';

// 从 cookie 字符串中解析指定的 cookie
function parseCookie(cookieString: string | null, name: string): string | undefined {
  if (!cookieString) return undefined;
  const match = cookieString
    .split(';')
    .find(c => c.trim().startsWith(`${name}=`));
  return match ? match.split('=')[1] : undefined;
}

// 从请求中获取上下文（包括认证信息）
async function createTRPCContextFromRequest(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const sessionToken = parseCookie(cookieHeader, 'next-auth.session-token');

  let user: { id: string; username: string; email: string; displayName?: string | null; avatar?: string | null; roles: string[]; permissions: string[] } | null = null;

  if (sessionToken) {
    try {
      const session = await prisma.session.findUnique({
        where: { sessionToken: decodeURIComponent(sessionToken) },
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

      if (session && session.user && session.expires > new Date()) {
        const roles = session.user.roles.map((r) => r.role.name);
        const permissions = session.user.roles.flatMap((r) => JSON.parse(r.role.permissions) as string[]);
        user = {
          id: session.user.id,
          username: session.user.username,
          email: session.user.email || '',
          displayName: session.user.displayName,
          avatar: session.user.avatar,
          roles,
          permissions,
        };
      }
    } catch (e) {
      console.error('Failed to get session:', e);
    }
  }

  return {
    user,
    prisma,
  };
}

// 处理 tRPC 请求
async function handleTRPCRequest(request: Request, procedurePath: string): Promise<Response> {
  const ctx = await createTRPCContextFromRequest(request);

  try {
    if (request.method === 'POST') {
      const body = await request.json();
      const input = body.input;

      // 解析 procedure 路径
      const parts = procedurePath.split('.');
      let router = appRouter;
      let procedureName = parts.pop();

      for (const part of parts) {
        // @ts-ignore
        router = router[part];
      }

      if (!procedureName) {
        return new Response(JSON.stringify({ error: 'Invalid procedure' }), { status: 400 });
      }

      // @ts-ignore
      const proc = router[procedureName];

      if (!proc) {
        return new Response(JSON.stringify({ error: 'Procedure not found' }), { status: 404 });
      }

      // 调用 procedure
      const result = await proc({
        ctx,
        input,
        meta: undefined,
      });

      return new Response(JSON.stringify({ result }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  } catch (error) {
    console.error('tRPC error:', error);
    const status = error instanceof TRPCError ? 401 : 500;
    return new Response(JSON.stringify({ error: String(error) }), { status, headers: { 'Content-Type': 'application/json' } });
  }
}

// GET handler - 处理 tRPC GET 请求
export async function GET(request: Request, props: { params: Promise<{ trpc: string }> }) {
  const { trpc } = await props.params;
  return handleTRPCRequest(request, trpc);
}

// POST handler
export async function POST(request: Request, props: { params: Promise<{ trpc: string }> }) {
  const { trpc } = await props.params;
  return handleTRPCRequest(request, trpc);
}
