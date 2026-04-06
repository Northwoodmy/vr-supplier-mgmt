'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-hooks';
import { Users, FolderOpen, Star, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TodoItem {
  id: string;
  type: 'evaluation' | 'delivery' | 'capacity';
  task: string;
  priority: '高' | '中' | '低';
  link: string;
  createdAt: string;
}

interface DashboardStats {
  totalSuppliers: number;
  activeProjects: number;
  pendingEvaluations: number;
  avgSaturation: number;
  supplierChange: number;
  projectChange: number;
  evaluationChange: number;
  saturationChange: number;
}

interface RecentProject {
  id: string;
  name: string;
  code: string;
  status: string;
  suppliers: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: user } = useAuth();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);

  // 获取仪表盘数据
  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, projectsRes, todosRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/recent-projects'),
          fetch('/api/dashboard/todos'),
        ]);

        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
        if (projectsRes.ok) {
          setRecentProjects(await projectsRes.json());
        }
        if (todosRes.ok) {
          setTodos(await todosRes.json());
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // 格式化变化值
  const formatChange = (value: number) => {
    if (value === 0) return '-';
    return value > 0 ? `+${value}` : `${value}`;
  };

  return (
    <div className="space-y-6">
      {/* Stats overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              供应商总数
            </CardTitle>
            <Users className="w-6 h-6 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSuppliers || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              <span className={((stats?.supplierChange || 0) >= 0) ? 'text-green-600' : 'text-red-600'}>
                {formatChange(stats?.supplierChange || 0)}
              </span>{' '}
              较上月
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              进行中项目
            </CardTitle>
            <FolderOpen className="w-6 h-6 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeProjects || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              <span className={((stats?.projectChange || 0) >= 0) ? 'text-green-600' : 'text-red-600'}>
                {formatChange(stats?.projectChange || 0)}
              </span>{' '}
              较上月
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              待评估影片
            </CardTitle>
            <Star className="w-6 h-6 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingEvaluations || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              <span className={((stats?.evaluationChange || 0) >= 0) ? 'text-green-600' : 'text-red-600'}>
                {formatChange(stats?.evaluationChange || 0)}
              </span>{' '}
              较上月
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              产能饱和度
            </CardTitle>
            <TrendingUp className="w-6 h-6 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgSaturation || 0}%</div>
            <p className="text-xs text-gray-500 mt-1">
              <span className={((stats?.saturationChange || 0) >= 0) ? 'text-green-600' : 'text-red-600'}>
                {formatChange(stats?.saturationChange || 0)}
              </span>{' '}
              较上月
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm border-0">
          <CardHeader>
            <CardTitle>最近项目</CardTitle>
          </CardHeader>
          <CardContent>
            {recentProjects.length > 0 ? (
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 bg-sidebar rounded-lg cursor-pointer hover:bg-sidebar-accent transition-colors"
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{project.name}</p>
                      <p className="text-sm text-gray-500">{project.suppliers || '未分配供应商'}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
                      {project.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                暂无项目数据
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0">
          <CardHeader>
            <CardTitle>待办事项</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">加载中...</div>
            ) : todos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无待办事项</div>
            ) : (
              <div className="space-y-4">
                {todos.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-sidebar rounded-lg cursor-pointer hover:bg-sidebar-accent transition-colors"
                    onClick={() => router.push(item.link)}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      item.priority === '高' ? 'bg-red-500' :
                      item.priority === '中' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.task}</p>
                      <p className="text-xs text-gray-500">
                        {item.type === 'evaluation' && '品质评估'}
                        {item.type === 'delivery' && '项目交付'}
                        {item.type === 'capacity' && '产能预警'}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                      item.priority === '高' ? 'bg-red-100 text-red-700' :
                      item.priority === '中' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {item.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
