'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { Plus, Trash2 } from 'lucide-react';

interface TeamMemberFormData {
  id?: string;
  role: string;
  category: string;
  count: number;
  seniorCount: number;
}

const ROLE_OPTIONS = [
  { value: 'UE5 工程师', category: 'engineering' },
  { value: 'U3D 工程师', category: 'engineering' },
  { value: '美术师', category: 'art' },
  { value: '动画师', category: 'animation' },
  { value: '特效师', category: 'vfx' },
  { value: '项目经理', category: 'management' },
];

export default function NewSupplierPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMemberFormData[]>([]);

  // 受控组件状态
  const [formData, setFormData] = useState({
    name: '',
    level: 'B',
    techStack: 'UE5',
    status: 'active',
    description: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    totalMembers: 0,
    capacityFactor: '0.8',
  });

  const createSupplier = trpc.supplier.create.useMutation({
    onSuccess: () => {
      router.push('/suppliers');
    },
    onError: (error) => {
      setLoading(false);
      alert(`创建失败：${error.message}`);
    },
  });

  const addTeamMember = () => {
    setTeamMembers([
      ...teamMembers,
      { role: '', category: '', count: 0, seniorCount: 0 },
    ]);
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const updateTeamMember = (index: number, field: keyof TeamMemberFormData, value: string | number) => {
    const updated = [...teamMembers];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-set category based on role
    if (field === 'role' && typeof value === 'string') {
      const roleOption = ROLE_OPTIONS.find(r => r.value === value);
      if (roleOption) {
        updated[index].category = roleOption.category;
      }
    }

    setTeamMembers(updated);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const supplierData = {
      name: formData.name,
      level: formData.level as 'S' | 'A' | 'B' | 'C',
      techStack: formData.techStack,
      status: formData.status as 'active' | 'inactive' | 'blacklisted',
      description: formData.description || undefined,
      contactPerson: formData.contactPerson || undefined,
      contactEmail: formData.contactEmail || undefined,
      contactPhone: formData.contactPhone || undefined,
      address: formData.address || undefined,
    };

    const capacityData = {
      totalMembers: formData.totalMembers,
      capacityFactor: parseFloat(formData.capacityFactor) || 0.8,
    };

    const validTeamMembers = teamMembers.filter(tm => tm.role && tm.count > 0);

    createSupplier.mutate({
      supplier: supplierData,
      teamMembers: validTeamMembers.length > 0 ? validTeamMembers : undefined,
      capacity: capacityData,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push('/suppliers')}>
          ← 返回列表
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900">新建供应商</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 基本信息 */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">供应商名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入供应商名称"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">等级 *</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {(value) => {
                        const levelMap: Record<string, string> = {
                          'S': 'S 级 - 战略合作伙伴',
                          'A': 'A 级 - 优质供应商',
                          'B': 'B 级 - 备选供应商',
                          'C': 'C 级 - 淘汰中',
                        };
                        return levelMap[value] || value;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S">S 级 - 战略合作伙伴</SelectItem>
                    <SelectItem value="A">A 级 - 优质供应商</SelectItem>
                    <SelectItem value="B">B 级 - 备选供应商</SelectItem>
                    <SelectItem value="C">C 级 - 淘汰中</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="techStack">技术栈 *</Label>
                <Select
                  value={formData.techStack}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, techStack: value }))}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {(value) => {
                        const techMap: Record<string, string> = {
                          'UE5': 'UE5',
                          'U3D': 'U3D',
                          'Both': 'UE5 + U3D',
                        };
                        return techMap[value] || value;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UE5">UE5</SelectItem>
                    <SelectItem value="U3D">U3D</SelectItem>
                    <SelectItem value="Both">UE5 + U3D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">状态</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {(value) => {
                        const statusMap: Record<string, string> = {
                          'active': '活跃',
                          'inactive': '停用',
                        };
                        return statusMap[value] || value;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">活跃</SelectItem>
                    <SelectItem value="inactive">停用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请输入供应商描述"
                rows={3}
              />
            </div>

            {/* 联系信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">联系信息</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">联系人</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                    placeholder="请输入联系人姓名"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">邮箱</Label>
                  <Input
                    id="contactEmail"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                    type="email"
                    placeholder="请输入邮箱"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">电话</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                    placeholder="请输入电话号码"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">地址</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="请输入地址"
                  />
                </div>
              </div>
            </div>

            {/* 产能配置 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">产能配置</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="totalMembers">团队总人数 *</Label>
                  <Input
                    id="totalMembers"
                    value={formData.totalMembers}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalMembers: parseInt(e.target.value) || 0 }))}
                    type="number"
                    placeholder="请输入团队人数"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacityFactor">产能系数</Label>
                  <Select
                    value={formData.capacityFactor}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, capacityFactor: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {(value) => {
                          const factorMap: Record<string, string> = {
                            '0.7': '0.7 - 小型团队 (<10 人) / 大型团队 (>50 人)',
                            '0.75': '0.75 - 中型团队 (20-50 人)',
                            '0.8': '0.8 - 标准团队 (10-20 人)',
                          };
                          return factorMap[value] || value;
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.7">0.7 - 小型团队 (&lt;10 人) / 大型团队 (&gt;50 人)</SelectItem>
                      <SelectItem value="0.75">0.75 - 中型团队 (20-50 人)</SelectItem>
                      <SelectItem value="0.8">0.8 - 标准团队 (10-20 人)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 团队架构 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">团队架构</h3>
              {teamMembers.map((member, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-end gap-4">
                      <div className="flex-1 space-y-2">
                        <Label>角色</Label>
                        <Select
                          value={member.role}
                          onValueChange={(value) => updateTeamMember(index, 'role', value || '')}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择角色">
                              {(value) => value || '选择角色'}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-32 space-y-2">
                        <Label>人数</Label>
                        <Input
                          type="number"
                          value={member.count}
                          onChange={(e) => updateTeamMember(index, 'count', parseInt(e.target.value) || 0)}
                          min={0}
                        />
                      </div>
                      <div className="w-32 space-y-2">
                        <Label>资深人数</Label>
                        <Input
                          type="number"
                          value={member.seniorCount}
                          onChange={(e) => updateTeamMember(index, 'seniorCount', parseInt(e.target.value) || 0)}
                          min={0}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTeamMember(index)}
                        className="mb-[3px]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addTeamMember}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                添加团队角色
              </Button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => router.push('/suppliers')}>
                取消
              </Button>
              <Button type="submit" disabled={loading || createSupplier.isPending}>
                {loading ? '保存中...' : '保存供应商'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
