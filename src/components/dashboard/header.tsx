'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth, useLogout } from '@/lib/auth-hooks';

export default function DashboardHeader() {
  const router = useRouter();
  const { data: user } = useAuth();
  const logoutMutation = useLogout();

  // 获取用户头像首字母
  const userInitial = user?.displayName?.[0] || user?.username?.[0] || 'U';

  // 检查权限
  const canManageUsers = user?.permissions?.includes('user:manage');
  const canViewAuditLogs = user?.permissions?.includes('audit:read');

  const handleLogout = () => {
    logoutMutation.mutate();
    router.push('/login');
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">仪表盘</h1>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={(props) => (
              <button
                {...props}
                className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center hover:bg-purple-200 transition-colors"
              >
                <span className="text-purple-700 font-medium text-sm">{userInitial}</span>
              </button>
            )}
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.displayName || user?.username || '用户'}</p>
                <p className="text-xs text-gray-500">{user?.email || user?.username || ''}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {canManageUsers && (
              <DropdownMenuItem onClick={() => router.push('/admin/users')}>
                用户管理
              </DropdownMenuItem>
            )}
            {canViewAuditLogs && (
              <DropdownMenuItem onClick={() => router.push('/admin/audit-logs')}>
                审计日志
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
