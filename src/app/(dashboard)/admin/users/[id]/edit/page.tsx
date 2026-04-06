'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/lib/auth-hooks';

interface Role {
  id: string;
  name: string;
  displayName: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  roles: Array<{
    id: string;
    name: string;
    displayName: string;
  }>;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const { data: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    displayName: '',
    roleIds: [] as string[],
  });

  // 检查权限
  const canEdit = currentUser?.permissions?.includes('user:edit');

  useEffect(() => {
    if (!canEdit) return;

    async function fetchData() {
      try {
        const [userRes, rolesRes] = await Promise.all([
          fetch(`/api/admin/users/${params.id}`),
          fetch('/api/admin/roles'),
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
          setFormData({
            username: userData.username,
            email: userData.email,
            password: '',
            displayName: userData.displayName || '',
            roleIds: userData.roles?.map((r: any) => r.id) || [],
          });
        } else if (userRes.status === 404) {
          alert('用户不存在');
          router.push('/admin/users');
        }

        if (rolesRes.ok) {
          setRoles(await rolesRes.json());
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.id, canEdit, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/users/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (res.ok) {
        alert('用户信息已更新');
        router.push('/admin/users');
      } else {
        alert(`更新失败：${result.error || '未知错误'}`);
      }
    } catch (error: any) {
      console.error('Failed to update user:', error);
      alert(`更新失败：${error.message || '未知错误'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!canEdit) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">用户不存在</h2>
          <p className="text-gray-500 mb-4">该用户可能已被删除</p>
          <Button onClick={() => router.push('/admin/users')}>返回列表</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push('/admin/users')}>
          ← 返回列表
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900">编辑用户</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => updateField('username', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="displayName">显示名称</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => updateField('displayName', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  新密码 <span className="text-gray-500 text-sm">(留空则不修改)</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  minLength={6}
                  placeholder="至少 6 位字符"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>角色</Label>
              <Select
                value={formData.roleIds[0] || ''}
                onValueChange={(value) => updateField('roleIds', [value])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择角色">
                    {(value) => roles.find(r => r.id === value)?.displayName || value}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/users')}
          >
            取消
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? '保存中...' : '保存更改'}
          </Button>
        </div>
      </form>
    </div>
  );
}
