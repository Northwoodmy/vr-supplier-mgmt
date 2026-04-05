'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-hooks';

export default function DashboardPage() {
  const { data: user } = useAuth();

  // 这些数据后续会从 API 获取
  const stats = [
    { label: '供应商总数', value: '24', change: '+2', icon: '👥' },
    { label: '进行中项目', value: '12', change: '+3', icon: '📁' },
    { label: '待评估影片', value: '5', change: '-2', icon: '⭐' },
    { label: '产能饱和度', value: '68%', change: '+5%', icon: '📈' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="shadow-sm border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.label}
              </CardTitle>
              <span className="text-2xl">{stat.icon}</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">
                <span className={stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                  {stat.change}
                </span>{' '}
                较上月
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm border-0">
          <CardHeader>
            <CardTitle>最近项目</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: '科幻短片《星际穿越》', status: '制作中', supplier: 'XX 科技' },
                { name: 'VR 体验《海底世界》', status: '待评估', supplier: 'YY 工作室' },
                { name: '动画广告《夏日清凉》', status: '已交付', supplier: 'ZZ 传媒' },
              ].map((project, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-sidebar rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{project.name}</p>
                    <p className="text-sm text-gray-500">{project.supplier}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
                    {project.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0">
          <CardHeader>
            <CardTitle>待办事项</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { task: '评审《星际穿越》初版交付', priority: '高' },
                { task: '更新供应商产能数据', priority: '中' },
                { task: '生成月度报表', priority: '低' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-sidebar rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.task}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.priority === '高' ? 'bg-red-100 text-red-700' :
                    item.priority === '中' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {item.priority}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
