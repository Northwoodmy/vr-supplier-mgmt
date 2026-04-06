'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Supplier {
  id: string;
  name: string;
  companyName?: string;
  techStack: string;
  level: string;
  status: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  description?: string;

  // 资质信息
  legalRepresentative?: string;
  establishedDate?: string;
  registeredCapital?: number;
  businessLicense?: string;
  businessScope?: string;

  // 财务信息
  bankAccount?: string;
  bankName?: string;
  taxType?: string;

  // 其他
  creditRecord?: string;
  remarks?: string;

  // JSON 字段
  coreMembers?: string; // JSON string
  equipment?: string; // JSON string
  sampleWorks?: string; // JSON string

  teamMembers: Array<{
    id: string;
    role: string;
    category: string;
    count: number;
    seniorCount: number;
  }>;
  capacity: {
    id: string;
    totalMembers: number;
    capacityFactor: number;
    monthlyCapacity: number;
  } | null;
  projects: Array<{
    id: string;
    projectId: string;
    estimatedManDays: number;
    complexityLevel: string;
    currentStage: string;
    workloadShare: number;
    project: {
      id: string;
      name: string;
      code: string;
      status: string;
    };
  }>;
  qualityReviews: Array<{
    id: string;
    totalScore: number;
    comments?: string;
    createdAt: string;
  }>;
}

const levelConfig: Record<string, { label: string; color: string }> = {
  S: { label: 'S 级', color: 'bg-purple-100 text-purple-700' },
  A: { label: 'A 级', color: 'bg-blue-100 text-blue-700' },
  B: { label: 'B 级', color: 'bg-green-100 text-green-700' },
  C: { label: 'C 级', color: 'bg-gray-100 text-gray-700' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: '合作中', color: 'bg-green-100 text-green-700' },
  inactive: { label: '未激活', color: 'bg-gray-100 text-gray-700' },
  suspended: { label: '暂停', color: 'bg-red-100 text-red-700' },
};

const stageConfig: Record<string, string> = {
  planning: '筹备中',
  pre_production: '预制作',
  production: '制作中',
  review: '审核中',
  delivery: '交付中',
  completed: '已完成',
  paused: '已暂停',
};

const complexityConfig: Record<string, string> = {
  simple: '简单',
  medium: '中等',
  complex: '复杂',
  extreme: '极复杂',
};

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [backLink, setBackLink] = useState('/suppliers');

  useEffect(() => {
    if (!params?.id) return;

    // 检查是否有 from 参数，用于返回来源页面
    const searchParams = new URLSearchParams(window.location.search);
    const from = searchParams.get('from');
    if (from === 'capacity') {
      setBackLink('/capacity');
    }

    async function fetchSupplier() {
      try {
        const res = await fetch(`/api/suppliers/${params.id}`);
        if (res.ok) {
          setSupplier(await res.json());
        }
      } catch (error) {
        console.error('Failed to fetch supplier:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSupplier();
  }, [params?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">供应商不存在</h2>
          <p className="text-gray-500 mb-4">该页面可能已被删除或移动</p>
          <Button variant="outline" onClick={() => router.push('/suppliers')}>
            返回列表
          </Button>
        </div>
      </div>
    );
  }

  const avgQualityScore = supplier.qualityReviews.length > 0
    ? supplier.qualityReviews.reduce((sum, r) => sum + r.totalScore, 0) / supplier.qualityReviews.length
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{supplier.name}</h1>
          {supplier.companyName && (
            <p className="text-gray-500 mt-1">{supplier.companyName}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{supplier.techStack}</Badge>
            <Badge className={levelConfig[supplier.level]?.color}>
              {levelConfig[supplier.level]?.label}
            </Badge>
            <Badge className={statusConfig[supplier.status]?.color}>
              {statusConfig[supplier.status]?.label}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/suppliers/${supplier.id}/edit`)}>
            编辑
          </Button>
          <Button variant="outline" onClick={() => router.push(backLink)}>
            返回列表
          </Button>
        </div>
      </div>

      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-gray-500">供应商简称</div>
              <div className="font-medium">{supplier.name || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">公司全称</div>
              <div className="font-medium">{supplier.companyName || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">技术栈</div>
              <div className="font-medium">{supplier.techStack || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">描述</div>
              <div className="font-medium">{supplier.description || '-'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 联系信息 */}
      <Card>
        <CardHeader>
          <CardTitle>联系信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-sm text-gray-500">联系人</div>
              <div className="font-medium">{supplier.contactPerson || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">邮箱</div>
              <div className="font-medium">{supplier.contactEmail || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">电话</div>
              <div className="font-medium">{supplier.contactPhone || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">地址</div>
              <div className="font-medium">{supplier.address || '-'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 资质信息 */}
      <Card>
        <CardHeader>
          <CardTitle>资质信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-gray-500">法人代表</div>
              <div className="font-medium">{supplier.legalRepresentative || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">成立日期</div>
              <div className="font-medium">
                {supplier.establishedDate
                  ? new Date(supplier.establishedDate).toLocaleDateString('zh-CN')
                  : '-'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">注册资金（万元）</div>
              <div className="font-medium">{supplier.registeredCapital ? `${supplier.registeredCapital} 万元` : '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">营业执照</div>
              <div className="font-medium">
                {supplier.businessLicense ? (
                  <a href={supplier.businessLicense} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    查看营业执照
                  </a>
                ) : (
                  '-'
                )}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-500 mb-1">经营范围</div>
            <div className="font-medium">{supplier.businessScope || '-'}</div>
          </div>
        </CardContent>
      </Card>

      {/* 财务信息 */}
      <Card>
        <CardHeader>
          <CardTitle>财务信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-gray-500">银行账号</div>
              <div className="font-medium">{supplier.bankAccount || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">开户行</div>
              <div className="font-medium">{supplier.bankName || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">纳税人类型</div>
              <div className="font-medium">
                {supplier.taxType === 'general' ? '一般纳税人' : supplier.taxType === 'small' ? '小规模纳税人' : '-'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 产能配置 */}
      {supplier.capacity && (
        <Card>
          <CardHeader>
            <CardTitle>产能概况</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-sm text-gray-500">团队规模</div>
                <div className="text-2xl font-bold">{supplier.capacity.totalMembers} 人</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">月产能</div>
                <div className="text-2xl font-bold">{supplier.capacity.monthlyCapacity.toFixed(1)} 人天</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">产能系数</div>
                <div className="text-2xl font-bold">{supplier.capacity.capacityFactor.toFixed(2)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 团队架构 */}
      {supplier.teamMembers && supplier.teamMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>团队架构</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {supplier.teamMembers.map((member) => (
                <div key={member.id} className="p-4 border rounded-lg">
                  <div className="font-medium">{member.role}</div>
                  <div className="text-sm text-gray-500">{member.category}</div>
                  <div className="flex items-center gap-4 mt-2">
                    <div>
                      <span className="text-xs text-gray-500">总数：</span>
                      <span className="font-medium">{member.count}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">资深：</span>
                      <span className="font-medium">{member.seniorCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 核心成员 */}
      {supplier.coreMembers && (
        <Card>
          <CardHeader>
            <CardTitle>核心成员</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {JSON.parse(supplier.coreMembers).map((member: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-gray-500">{member.position}</div>
                    </div>
                    <div className="text-sm text-gray-500">{member.experience} 年经验</div>
                  </div>
                  {member.description && (
                    <p className="text-sm text-gray-600 mt-2">{member.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 设备情况 */}
      {supplier.equipment && (
        <Card>
          <CardHeader>
            <CardTitle>设备情况</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {JSON.parse(supplier.equipment).map((eq: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{eq.name}</div>
                      <div className="text-sm text-gray-500">{eq.model}</div>
                    </div>
                    <div className="text-sm text-gray-500">x{eq.quantity}</div>
                  </div>
                  {eq.description && (
                    <p className="text-sm text-gray-600 mt-2">{eq.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 代表作品 */}
      {supplier.sampleWorks && (
        <Card>
          <CardHeader>
            <CardTitle>代表作品</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {JSON.parse(supplier.sampleWorks).map((work: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="font-medium">{work.name}</div>
                  {work.description && (
                    <p className="text-sm text-gray-600 mt-1">{work.description}</p>
                  )}
                  {work.url && (
                    <a href={work.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      查看作品 →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 其他信息 */}
      {(supplier.creditRecord || supplier.remarks) && (
        <Card>
          <CardHeader>
            <CardTitle>其他信息</CardTitle>
          </CardHeader>
          <CardContent>
            {supplier.creditRecord && (
              <div className="mb-4">
                <div className="text-sm text-gray-500 mb-1">信誉记录</div>
                <div className="font-medium">{supplier.creditRecord}</div>
              </div>
            )}
            {supplier.remarks && (
              <div>
                <div className="text-sm text-gray-500 mb-1">备注</div>
                <div className="font-medium">{supplier.remarks}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 进行中项目 */}
      <Card>
        <CardHeader>
          <CardTitle>进行中项目</CardTitle>
        </CardHeader>
        <CardContent>
          {supplier.projects.length > 0 ? (
            <div className="space-y-3">
              {supplier.projects.map((proj) => (
                <div
                  key={proj.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{proj.project.name}</span>
                      <Badge variant="outline">{proj.project.code}</Badge>
                      <Badge variant="secondary">{stageConfig[proj.currentStage] || proj.currentStage}</Badge>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      预计工时：{proj.estimatedManDays} 人天 ·
                      复杂度：{complexityConfig[proj.complexityLevel] || proj.complexityLevel} ·
                      负载占比：{(proj.workloadShare * 100).toFixed(0)}%
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/projects/${proj.projectId}`)}
                  >
                    查看项目
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              暂无进行中项目
            </div>
          )}
        </CardContent>
      </Card>

      {/* 品质评分 */}
      {avgQualityScore !== null && (
        <Card>
          <CardHeader>
            <CardTitle>品质评分</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-primary">{avgQualityScore.toFixed(2)}</div>
              <div className="text-gray-500">
                基于 {supplier.qualityReviews.length} 次评估
              </div>
            </div>
            {supplier.qualityReviews.length > 0 && (
              <div className="mt-4 space-y-2">
                {supplier.qualityReviews.slice(-5).reverse().map((review) => (
                  <div key={review.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="text-sm">
                      <span className="font-medium">评分：{review.totalScore.toFixed(2)}</span>
                      {review.comments && (
                        <span className="text-gray-500 ml-2">- {review.comments}</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
