'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

interface CoreMemberFormData {
  id?: string;
  name: string;
  position: string;
  experience: number;
  description: string;
}

interface EquipmentFormData {
  id?: string;
  name: string;
  model: string;
  quantity: number;
  description: string;
}

interface SampleWorkFormData {
  id?: string;
  name: string;
  description: string;
  url: string;
}

const ROLE_OPTIONS = [
  { value: 'UE5 工程师', category: 'engineering' },
  { value: 'U3D 工程师', category: 'engineering' },
  { value: '美术师', category: 'art' },
  { value: '动画师', category: 'animation' },
  { value: '特效师', category: 'vfx' },
  { value: '项目经理', category: 'management' },
];

const LEVEL_OPTIONS = [
  { value: 'S', label: 'S 级 - 战略合作伙伴' },
  { value: 'A', label: 'A 级 - 优质供应商' },
  { value: 'B', label: 'B 级 - 备选供应商' },
  { value: 'C', label: 'C 级 - 淘汰中' },
];

const TECH_STACK_OPTIONS = [
  { value: 'UE5', label: 'UE5' },
  { value: 'U3D', label: 'U3D' },
  { value: 'Both', label: 'UE5 + U3D' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: '活跃' },
  { value: 'inactive', label: '停用' },
  { value: 'blacklisted', label: '黑名单' },
];

const TAX_TYPE_OPTIONS = [
  { value: 'general', label: '一般纳税人' },
  { value: 'small', label: '小规模纳税人' },
];

const CAPACITY_FACTOR_OPTIONS = [
  { value: '0.7', label: '0.7 - 小型团队 (<10 人) / 大型团队 (>50 人)' },
  { value: '0.75', label: '0.75 - 中型团队 (20-50 人)' },
  { value: '0.8', label: '0.8 - 标准团队 (10-20 人)' },
];

export default function NewSupplierPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 团队架构
  const [teamMembers, setTeamMembers] = useState<TeamMemberFormData[]>([]);
  // 核心成员
  const [coreMembers, setCoreMembers] = useState<CoreMemberFormData[]>([]);
  // 设备情况
  const [equipments, setEquipments] = useState<EquipmentFormData[]>([]);
  // 代表作品
  const [sampleWorks, setSampleWorks] = useState<SampleWorkFormData[]>([]);

  // 基本信息
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    level: 'B' as 'S' | 'A' | 'B' | 'C',
    techStack: 'UE5',
    status: 'active' as 'active' | 'inactive' | 'blacklisted',
    description: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    address: '',

    // 资质信息
    legalRepresentative: '',
    establishedDate: '',
    registeredCapital: '',
    businessLicense: '',
    businessScope: '',

    // 财务信息
    bankAccount: '',
    bankName: '',
    taxType: 'general',

    // 其他
    creditRecord: '',
    remarks: '',

    // 产能配置
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

  // 团队架构操作
  const addTeamMember = () => {
    setTeamMembers([...teamMembers, { role: '', category: '', count: 0, seniorCount: 0 }]);
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const updateTeamMember = (index: number, field: keyof TeamMemberFormData, value: string | number) => {
    const updated = [...teamMembers];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'role' && typeof value === 'string') {
      const roleOption = ROLE_OPTIONS.find(r => r.value === value);
      if (roleOption) {
        updated[index].category = roleOption.category;
      }
    }

    setTeamMembers(updated);
  };

  // 核心成员操作
  const addCoreMember = () => {
    setCoreMembers([...coreMembers, { name: '', position: '', experience: 0, description: '' }]);
  };

  const removeCoreMember = (index: number) => {
    setCoreMembers(coreMembers.filter((_, i) => i !== index));
  };

  const updateCoreMember = (index: number, field: keyof CoreMemberFormData, value: string | number) => {
    const updated = [...coreMembers];
    updated[index] = { ...updated[index], [field]: value };
    setCoreMembers(updated);
  };

  // 设备情况操作
  const addEquipment = () => {
    setEquipments([...equipments, { name: '', model: '', quantity: 1, description: '' }]);
  };

  const removeEquipment = (index: number) => {
    setEquipments(equipments.filter((_, i) => i !== index));
  };

  const updateEquipment = (index: number, field: keyof EquipmentFormData, value: string | number) => {
    const updated = [...equipments];
    updated[index] = { ...updated[index], [field]: value };
    setEquipments(updated);
  };

  // 代表作品操作
  const addSampleWork = () => {
    setSampleWorks([...sampleWorks, { name: '', description: '', url: '' }]);
  };

  const removeSampleWork = (index: number) => {
    setSampleWorks(sampleWorks.filter((_, i) => i !== index));
  };

  const updateSampleWork = (index: number, field: keyof SampleWorkFormData, value: string) => {
    const updated = [...sampleWorks];
    updated[index] = { ...updated[index], [field]: value };
    setSampleWorks(updated);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // 验证必填字段
    if (!formData.name || !formData.companyName || !formData.contactPerson || !formData.contactEmail) {
      alert('请填写所有必填字段');
      setLoading(false);
      return;
    }

    const supplierData: any = {
      name: formData.name,
      companyName: formData.companyName,
      level: formData.level,
      techStack: formData.techStack,
      status: formData.status,
      description: formData.description || undefined,
      contactPerson: formData.contactPerson || undefined,
      contactEmail: formData.contactEmail || undefined,
      contactPhone: formData.contactPhone || undefined,
      address: formData.address || undefined,

      // 资质信息
      legalRepresentative: formData.legalRepresentative || undefined,
      establishedDate: formData.establishedDate ? new Date(formData.establishedDate) : undefined,
      registeredCapital: formData.registeredCapital ? parseFloat(formData.registeredCapital) : undefined,
      businessLicense: formData.businessLicense || undefined,
      businessScope: formData.businessScope || undefined,

      // 财务信息
      bankAccount: formData.bankAccount || undefined,
      bankName: formData.bankName || undefined,
      taxType: formData.taxType || undefined,

      // 其他
      creditRecord: formData.creditRecord || undefined,
      remarks: formData.remarks || undefined,
    };

    const capacityData = {
      totalMembers: formData.totalMembers,
      capacityFactor: parseFloat(formData.capacityFactor) || 0.8,
    };

    // 过滤有效的团队数据
    const validTeamMembers = teamMembers.filter(tm => tm.role && tm.count > 0);
    const validCoreMembers = coreMembers.filter(cm => cm.name && cm.position);
    const validEquipments = equipments.filter(eq => eq.name);
    const validSampleWorks = sampleWorks.filter(sw => sw.name);

    createSupplier.mutate({
      supplier: supplierData,
      teamMembers: validTeamMembers.length > 0 ? validTeamMembers : undefined,
      coreMembers: validCoreMembers.length > 0 ? validCoreMembers : undefined,
      equipments: validEquipments.length > 0 ? validEquipments : undefined,
      sampleWorks: validSampleWorks.length > 0 ? validSampleWorks : undefined,
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
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">新建供应商</h1>
          <p className="text-gray-500 text-sm mt-1">填写供应商详细信息，建立合作关系</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>供应商基础信息和联系方式</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">供应商简称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入供应商简称"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">公司全称 *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="请输入公司全称"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">等级 *</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, level: (value as 'S' | 'A' | 'B' | 'C') || 'B' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择等级" items={LEVEL_OPTIONS} />
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
                  onValueChange={(value) => setFormData(prev => ({ ...prev, techStack: value || 'UE5' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择技术栈" items={TECH_STACK_OPTIONS} />
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
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: (value as 'active' | 'inactive' | 'blacklisted') || 'active' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择状态" items={STATUS_OPTIONS} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">活跃</SelectItem>
                    <SelectItem value="inactive">停用</SelectItem>
                    <SelectItem value="blacklisted">黑名单</SelectItem>
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
                  <Label htmlFor="contactPerson">联系人 *</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                    placeholder="请输入联系人姓名"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">邮箱 *</Label>
                  <Input
                    id="contactEmail"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                    type="email"
                    placeholder="请输入邮箱"
                    required
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

            {/* 资质信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">资质信息</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="legalRepresentative">法人代表</Label>
                  <Input
                    id="legalRepresentative"
                    value={formData.legalRepresentative}
                    onChange={(e) => setFormData(prev => ({ ...prev, legalRepresentative: e.target.value }))}
                    placeholder="请输入法人代表姓名"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="establishedDate">成立日期</Label>
                  <Input
                    id="establishedDate"
                    type="date"
                    value={formData.establishedDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, establishedDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registeredCapital">注册资金（万元）</Label>
                  <Input
                    id="registeredCapital"
                    value={formData.registeredCapital}
                    onChange={(e) => setFormData(prev => ({ ...prev, registeredCapital: e.target.value }))}
                    type="number"
                    placeholder="请输入注册资金"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessLicense">营业执照 URL</Label>
                  <Input
                    id="businessLicense"
                    value={formData.businessLicense}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessLicense: e.target.value }))}
                    placeholder="请输入营业执照扫描件 URL"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessScope">经营范围</Label>
                <Textarea
                  id="businessScope"
                  value={formData.businessScope}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessScope: e.target.value }))}
                  placeholder="请输入营业执照上的经营范围"
                  rows={3}
                />
              </div>
            </div>

            {/* 财务信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">财务信息</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bankAccount">银行账号</Label>
                  <Input
                    id="bankAccount"
                    value={formData.bankAccount}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankAccount: e.target.value }))}
                    placeholder="请输入银行账号"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">开户行</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                    placeholder="请输入开户行名称"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxType">纳税人类型</Label>
                  <Select
                    value={formData.taxType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, taxType: value || 'general' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择纳税人类型" items={TAX_TYPE_OPTIONS} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">一般纳税人</SelectItem>
                      <SelectItem value="small">小规模纳税人</SelectItem>
                    </SelectContent>
                  </Select>
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
                    onValueChange={(value) => setFormData(prev => ({ ...prev, capacityFactor: value || '0.8' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择产能系数" items={CAPACITY_FACTOR_OPTIONS} />
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
                            <SelectValue placeholder="选择角色" items={ROLE_OPTIONS.map(r => ({ value: r.value, label: r.value }))} />
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

            {/* 核心成员 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">核心成员</h3>
              {coreMembers.map((member, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-end gap-4 flex-wrap">
                      <div className="flex-1 space-y-2 min-w-[200px]">
                        <Label>姓名</Label>
                        <Input
                          value={member.name}
                          onChange={(e) => updateCoreMember(index, 'name', e.target.value)}
                          placeholder="请输入姓名"
                        />
                      </div>
                      <div className="flex-1 space-y-2 min-w-[150px]">
                        <Label>职位</Label>
                        <Input
                          value={member.position}
                          onChange={(e) => updateCoreMember(index, 'position', e.target.value)}
                          placeholder="请输入职位"
                        />
                      </div>
                      <div className="w-32 space-y-2">
                        <Label>从业年限</Label>
                        <Input
                          type="number"
                          value={member.experience}
                          onChange={(e) => updateCoreMember(index, 'experience', parseInt(e.target.value) || 0)}
                          min={0}
                        />
                      </div>
                      <div className="flex-[2] space-y-2 min-w-[200px]">
                        <Label>简介</Label>
                        <Input
                          value={member.description}
                          onChange={(e) => updateCoreMember(index, 'description', e.target.value)}
                          placeholder="请输入简介"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCoreMember(index)}
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
                onClick={addCoreMember}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                添加核心成员
              </Button>
            </div>

            {/* 设备情况 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">设备情况</h3>
              {equipments.map((equipment, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-end gap-4 flex-wrap">
                      <div className="flex-1 space-y-2 min-w-[150px]">
                        <Label>设备名称</Label>
                        <Input
                          value={equipment.name}
                          onChange={(e) => updateEquipment(index, 'name', e.target.value)}
                          placeholder="请输入设备名称"
                        />
                      </div>
                      <div className="flex-1 space-y-2 min-w-[150px]">
                        <Label>型号</Label>
                        <Input
                          value={equipment.model}
                          onChange={(e) => updateEquipment(index, 'model', e.target.value)}
                          placeholder="请输入型号"
                        />
                      </div>
                      <div className="w-32 space-y-2">
                        <Label>数量</Label>
                        <Input
                          type="number"
                          value={equipment.quantity}
                          onChange={(e) => updateEquipment(index, 'quantity', parseInt(e.target.value) || 1)}
                          min={1}
                        />
                      </div>
                      <div className="flex-[2] space-y-2 min-w-[200px]">
                        <Label>备注</Label>
                        <Input
                          value={equipment.description}
                          onChange={(e) => updateEquipment(index, 'description', e.target.value)}
                          placeholder="请输入备注"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeEquipment(index)}
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
                onClick={addEquipment}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                添加设备
              </Button>
            </div>

            {/* 代表作品 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">代表作品</h3>
              {sampleWorks.map((work, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-end gap-4 flex-wrap">
                      <div className="flex-1 space-y-2 min-w-[200px]">
                        <Label>作品名称</Label>
                        <Input
                          value={work.name}
                          onChange={(e) => updateSampleWork(index, 'name', e.target.value)}
                          placeholder="请输入作品名称"
                        />
                      </div>
                      <div className="flex-1 space-y-2 min-w-[200px]">
                        <Label>作品链接</Label>
                        <Input
                          value={work.url}
                          onChange={(e) => updateSampleWork(index, 'url', e.target.value)}
                          placeholder="请输入作品链接"
                        />
                      </div>
                      <div className="flex-[2] space-y-2 min-w-[200px]">
                        <Label>简介</Label>
                        <Input
                          value={work.description}
                          onChange={(e) => updateSampleWork(index, 'description', e.target.value)}
                          placeholder="请输入作品简介"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSampleWork(index)}
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
                onClick={addSampleWork}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                添加代表作品
              </Button>
            </div>

            {/* 其他信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">其他信息</h3>
              <div className="space-y-2">
                <Label htmlFor="creditRecord">信誉记录</Label>
                <Textarea
                  id="creditRecord"
                  value={formData.creditRecord}
                  onChange={(e) => setFormData(prev => ({ ...prev, creditRecord: e.target.value }))}
                  placeholder="请输入信誉记录说明"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="remarks">备注</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="其他需要说明的信息"
                  rows={3}
                />
              </div>
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
