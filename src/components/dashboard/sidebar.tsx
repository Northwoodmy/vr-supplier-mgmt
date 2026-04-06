'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-hooks';
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  TrendingUp,
  Star,
  ClipboardList,
  Shield,
  FileText,
  Building2,
} from 'lucide-react';

const navigation = [
  { name: '仪表盘', href: '/', icon: LayoutDashboard },
  { name: '供应商管理', href: '/suppliers', icon: Users },
  { name: '项目管理', href: '/projects', icon: FolderOpen },
  { name: '产能评估', href: '/capacity', icon: TrendingUp },
  { name: '品质评估', href: '/evaluations', icon: Star },
  { name: '报表统计', href: '/reports', icon: ClipboardList },
];

const adminNavigation = [
  { name: '用户管理', href: '/admin/users', icon: Shield },
  { name: '审计日志', href: '/admin/audit-logs', icon: FileText },
  { name: '供应商准入', href: '/admin/supplier-applications', icon: Building2 },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { data: user } = useAuth();
  const canManageUsers = user?.permissions?.includes('user:manage');
  const canViewAudit = user?.permissions?.includes('audit:view');
  const canManageSuppliers = user?.permissions?.includes('supplier:manage');
  const canViewReport = user?.permissions?.includes('report:view');
  const showAdmin = canManageUsers || canViewAudit || canManageSuppliers;

  // 根据权限过滤导航菜单
  const filteredNavigation = navigation.filter((item) => {
    if (item.href === '/reports') return canViewReport;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-sidebar border-r">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b bg-sidebar-accent/30">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-white text-lg font-semibold">V</span>
        </div>
        <span className="font-semibold text-gray-900">供应商管理系统</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-[28px] text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-gray-600 hover:bg-sidebar-accent/50'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}

        {/* Admin Navigation */}
        {showAdmin && (
          <div className="pt-4 mt-4 border-t">
            <p className="px-4 py-2 text-xs font-medium text-gray-500">系统管理</p>
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              const canAccess =
                (item.href === '/admin/users' && canManageUsers) ||
                (item.href === '/admin/audit-logs' && canViewAudit) ||
                (item.href === '/admin/supplier-applications' && canManageSuppliers);

              if (!canAccess) return null;

              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-[28px] text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-gray-600 hover:bg-sidebar-accent/50'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* User section */}
      <div className="p-4 border-t bg-white/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-sidebar-accent-foreground font-medium">{user?.displayName?.[0] || user?.username?.[0] || 'U'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.displayName || user?.username}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
