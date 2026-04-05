'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLogin } from '@/lib/auth-hooks';

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');

  const loginMutation = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await loginMutation.mutateAsync({ username, password, remember });
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请检查用户名和密码');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel - Brand */}
      <div className="hidden lg:flex lg:w-[480px] bg-primary flex-col justify-center px-16 rounded-l-2xl">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-semibold text-white mb-8">
              3D/VR 影片<br />供应商管理系统
            </h1>
            <p className="text-lg text-white/80">
              高效管理供应商，精准评估产能，<br />
              提升项目交付质量
            </p>
          </div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 bg-white">
        <Card className="w-full max-w-md border-0 shadow-lg rounded-2xl">
          <CardHeader className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">欢迎回来</h2>
              <p className="text-gray-500 mt-1">请登录您的账户以继续</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="请输入用户名"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loginMutation.isPending}
                  required
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loginMutation.isPending}
                  required
                  className="rounded-lg"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                  记住我
                </label>
              </div>
              {error && (
                <div className="p-3 text-sm text-white bg-red-500 rounded-lg">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full h-11 text-base rounded-lg"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? '登录中...' : '登录'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
