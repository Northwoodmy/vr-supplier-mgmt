// 使用 React Query 直接调用 API
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return res.json();
}

export function useAuth() {
  return useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me');
      if (!res.ok) return null;
      const data = await res.json();
      // Parse permissions if they are JSON strings (SQLite compatibility)
      if (data.permissions && data.permissions.length > 0 && typeof data.permissions[0] === 'string') {
        try {
          const parsed = JSON.parse(data.permissions[0]);
          if (Array.isArray(parsed)) {
            data.permissions = parsed;
          }
        } catch {
          // Keep original if parse fails
        }
      }
      return data;
    },
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { username: string; password: string; remember?: boolean }) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Login failed' }));
        throw new Error(error.error || 'Login failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (!res.ok) throw new Error('Logout failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}
