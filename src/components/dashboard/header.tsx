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
import { useLogout } from '@/lib/auth-hooks';

export default function DashboardHeader() {
  const router = useRouter();

  const logoutMutation = useLogout();

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
                <span className="text-purple-700 font-medium text-sm">A</span>
              </button>
            )}
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">管理员</p>
                <p className="text-xs text-gray-500">admin@example.com</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/admin/users')}>
              用户管理
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/admin/audit-logs')}>
              审计日志
            </DropdownMenuItem>
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
