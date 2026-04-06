'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/lib/auth-hooks';
import { useRouter } from 'next/navigation';
import { ChevronDownIcon } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
  roles: Array<{
    id: string;
    name: string;
    displayName: string;
  }>;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
}

export default function UsersPage() {
  const router = useRouter();
  const { data: currentUser } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  // 检查权限
  const canManage = currentUser?.permissions?.includes('user:manage');
  const canCreate = currentUser?.permissions?.includes('user:create');
  const canEdit = currentUser?.permissions?.includes('user:edit');
  const canDelete = currentUser?.permissions?.includes('user:delete');

  // 获取用户列表和角色列表
  useEffect(() => {
    if (!canManage) return;

    async function fetchData() {
      try {
        const [usersRes, rolesRes] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/roles'),
        ]);
        if (usersRes.ok) {
          setUsers(await usersRes.json());
        }
        if (rolesRes.ok) {
          setRoles(await rolesRes.json());
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [canManage]);

  const handleCreate = async (data: any) => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        // 重新获取用户列表以确保数据格式正确
        const usersRes = await fetch('/api/admin/users');
        if (usersRes.ok) {
          setUsers(await usersRes.json());
        }
        setIsCreateDialogOpen(false);
        alert('用户创建成功！');
      } else {
        alert(`创建失败：${result.error || '未知错误'}`);
      }
    } catch (error: any) {
      console.error('Failed to create user:', error);
      alert(`创建失败：${error.message || '未知错误'}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此用户吗？')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const refetch = async () => {
    const res = await fetch('/api/admin/users');
    if (res.ok) {
      setUsers(await res.json());
    }
  };

  if (!canManage) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500">无权访问此页面</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">用户管理</h1>
        {canCreate && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger
              render={
                <Button>+ 新建用户</Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新建用户</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  await handleCreate({
                    username: formData.get('username') as string,
                    email: formData.get('email') as string,
                    password: formData.get('password') as string,
                    displayName: formData.get('displayName') as string,
                    roleIds: selectedRoleId ? [selectedRoleId] : [],
                  });
                  setSelectedRoleId(null);
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="username">用户名</Label>
                  <Input name="username" id="username" required className="w-full" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input name="email" id="email" type="email" className="w-full" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">密码</Label>
                  <Input name="password" id="password" type="password" minLength={6} required className="w-full" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">显示名称</Label>
                  <Input name="displayName" id="displayName" className="w-full" />
                </div>
                <div className="space-y-2">
                  <Label>角色</Label>
                  <div className="relative w-fit">
                    <select
                      value={selectedRoleId || ''}
                      onChange={(e) => setSelectedRoleId(e.target.value || null)}
                      className="flex min-w-[200px] items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-8 pl-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer"
                    >
                      <option value="" disabled>选择角色</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.displayName}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsCreateDialogOpen(false);
                    setSelectedRoleId(null);
                  }}>
                    取消
                  </Button>
                  <Button type="submit" disabled={isCreating || !selectedRoleId}>
                    {isCreating ? '创建中...' : '创建'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户名</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>显示名称</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>最后登录</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.displayName || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map((role: any, idx: number) => (
                            <Badge key={role?.id || `role-${user.id}-${idx}`} variant="secondary">
                              {role?.displayName || role?.name || '-'}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.status === 'active'
                            ? 'default'
                            : user.status === 'suspended'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {user.status === 'active' ? '正常' : user.status === 'suspended' ? '暂停' : '已删除'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('zh-CN') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedUser(user)}
                        >
                          查看
                        </Button>
                        {canEdit && user.id !== currentUser?.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/admin/users/${user.id}/edit`)}
                          >
                            编辑
                          </Button>
                        )}
                        {canDelete && user.id !== currentUser?.id && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(user.id)}
                          >
                            删除
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      {selectedUser && (
        <Dialog open onOpenChange={() => setSelectedUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>用户详情</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-500">用户名</Label>
                <p className="font-medium">{selectedUser.username}</p>
              </div>
              <div>
                <Label className="text-gray-500">邮箱</Label>
                <p>{selectedUser.email}</p>
              </div>
              <div>
                <Label className="text-gray-500">显示名称</Label>
                <p>{selectedUser.displayName || '-'}</p>
              </div>
              <div>
                <Label className="text-gray-500">角色</Label>
                <div className="flex gap-1 flex-wrap mt-1">
                  {selectedUser.roles && selectedUser.roles.length > 0 ? (
                    selectedUser.roles.map((role: any, idx: number) => (
                      <Badge key={role?.id || `role-${selectedUser.id}-${idx}`} variant="secondary">
                        {role?.displayName || role?.name || '-'}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-gray-500">状态</Label>
                <div className="mt-1">
                  <Badge
                    variant={
                      selectedUser.status === 'active'
                        ? 'default'
                        : selectedUser.status === 'suspended'
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {selectedUser.status === 'active' ? '正常' : selectedUser.status === 'suspended' ? '暂停' : '已删除'}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">创建时间</Label>
                <p>{new Date(selectedUser.createdAt).toLocaleString('zh-CN')}</p>
              </div>
              <div>
                <Label className="text-gray-500">最后登录</Label>
                <p>{selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString('zh-CN') : '-'}</p>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                关闭
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
