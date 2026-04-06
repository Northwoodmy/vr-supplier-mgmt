'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

interface TeamMemberFormData {
  role: string;
  category: string;
  count: number;
  seniorCount: number;
}

interface CoreMemberFormData {
  name: string;
  position: string;
  experience: number;
  description: string;
}

interface EquipmentFormData {
  name: string;
  model: string;
  quantity: number;
  description: string;
}

interface SampleWorkFormData {
  name: string;
  description: string;
  url: string;
}

const TAX_TYPE_OPTIONS = [
  { value: 'general', label: '一般纳税人' },
  { value: 'small', label: '小规模纳税人' },
];

const BANK_RATING_OPTIONS = [
  { value: 'AAA', label: 'AAA（极好）' },
  { value: 'AA', label: 'AA（良好）' },
  { value: 'A', label: 'A（较好）' },
  { value: 'BBB', label: 'BBB（一般）' },
  { value: 'BB', label: 'BB（较差）' },
];

const CAPACITY_FACTOR_OPTIONS = [
  { value: '0.7', label: '0.7 - 小型团队 (<10 人) / 大型团队 (>50 人)' },
  { value: '0.75', label: '0.75 - 中型团队 (20-50 人)' },
  { value: '0.8', label: '0.8 - 标准团队 (10-20 人)' },
];

const ROLE_OPTIONS = [
  { value: 'UE5 工程师', category: 'engineering' },
  { value: 'U3D 工程师', category: 'engineering' },
  { value: '美术师', category: 'art' },
  { value: '动画师', category: 'animation' },
  { value: '特效师', category: 'vfx' },
  { value: '项目经理', category: 'management' },
];

export default function SupplierApplyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

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
    companyName: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',

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
    bankRating: 'AAA',
    creditRecord: '',

    // 产能配置
    totalMembers: '',
    capacityFactor: '0.8',

    // 其他
    companyDescription: '',
    remarks: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 检查必填字段
    if (!formData.companyName || !formData.contactName || !formData.contactPhone || !formData.contactEmail) {
      alert('请填写所有必填字段');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/suppliers/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          teamMembers: teamMembers.filter(tm => tm.role && tm.count > 0),
          coreMembers: coreMembers.filter(cm => cm.name && cm.position),
          equipment: equipments.filter(eq => eq.name),
          sampleWorks: sampleWorks.filter(sw => sw.name),
        }),
      });

      const result = await res.json();

      if (res.ok) {
        alert('申请提交成功！我们将在 3 个工作日内完成资质初审。');
        router.push('/suppliers');
      } else {
        alert(`提交失败：${result.error || '未知错误'}`);
      }
    } catch (error: any) {
      console.error('Failed to submit application:', error);
      alert(`提交失败：${error.message || '未知错误'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push('/suppliers')}>
          ← 返回列表
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">供应商准入申请</h1>
          <p className="text-gray-500 text-sm mt-1">填写详细信息，开启合作之旅</p>
        </div>
      </div>

      {/* 申请须知 */}
      <Card>
        <CardHeader>
          <CardTitle>申请须知</CardTitle>
          <CardDescription>了解供应商准入流程和要求</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-5 gap-4 text-sm">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2">1</div>
              <p className="font-medium">资质初审</p>
              <p className="text-gray-500">3 个工作日</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2">2</div>
              <p className="font-medium">样品评审</p>
              <p className="text-gray-500">5 个工作日</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2">3</div>
              <p className="font-medium">现场考察</p>
              <p className="text-gray-500">可选</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2">4</div>
              <p className="font-medium">试运行</p>
              <p className="text-gray-500">1-2 个月</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2">5</div>
              <p className="font-medium">正式入库</p>
              <p className="text-gray-500">B 级起步</p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>基本条件：</strong>合法注册企业法人，注册资金≥100 万元，专职制作团队≥5 人，核心成员≥3 年 VR/3D 制作经验
            </p>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>请填写公司基本信息和联系方式</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">公司名称 *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  required
                  placeholder="请输入公司全称"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactName">联系人 *</Label>
                <Input
                  id="contactName"
                  value={formData.contactName}
                  onChange={(e) => updateField('contactName', e.target.value)}
                  required
                  placeholder="请输入联系人姓名"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactPhone">联系电话 *</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => updateField('contactPhone', e.target.value)}
                  required
                  placeholder="请输入手机号码"
                  type="tel"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">联系邮箱 *</Label>
                <Input
                  id="contactEmail"
                  value={formData.contactEmail}
                  onChange={(e) => updateField('contactEmail', e.target.value)}
                  required
                  placeholder="请输入企业邮箱"
                  type="email"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 资质信息 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>资质信息</CardTitle>
            <CardDescription>请提供公司资质相关信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="legalRepresentative">法人代表</Label>
                <Input
                  id="legalRepresentative"
                  value={formData.legalRepresentative}
                  onChange={(e) => updateField('legalRepresentative', e.target.value)}
                  placeholder="请输入法人代表姓名"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="establishedDate">成立日期</Label>
                <Input
                  id="establishedDate"
                  type="date"
                  value={formData.establishedDate}
                  onChange={(e) => updateField('establishedDate', e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="registeredCapital">注册资金（万元）</Label>
                <Input
                  id="registeredCapital"
                  value={formData.registeredCapital}
                  onChange={(e) => updateField('registeredCapital', e.target.value)}
                  type="number"
                  placeholder="请输入注册资金"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessLicense">营业执照 URL</Label>
                <Input
                  id="businessLicense"
                  value={formData.businessLicense}
                  onChange={(e) => updateField('businessLicense', e.target.value)}
                  placeholder="请输入营业执照扫描件 URL"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessScope">经营范围</Label>
              <Textarea
                id="businessScope"
                value={formData.businessScope}
                onChange={(e) => updateField('businessScope', e.target.value)}
                placeholder="请输入营业执照上的经营范围"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* 财务信息 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>财务信息</CardTitle>
            <CardDescription>请提供公司财务相关信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="bankAccount">银行账号</Label>
                <Input
                  id="bankAccount"
                  value={formData.bankAccount}
                  onChange={(e) => updateField('bankAccount', e.target.value)}
                  placeholder="请输入银行账号"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankName">开户行</Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => updateField('bankName', e.target.value)}
                  placeholder="请输入开户行名称"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxType">纳税人类型</Label>
                <Select
                  value={formData.taxType}
                  onValueChange={(value) => updateField('taxType', value || 'general')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择">
                      {(value) => TAX_TYPE_OPTIONS.find(opt => opt.value === value)?.label || value}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">一般纳税人</SelectItem>
                    <SelectItem value="small">小规模纳税人</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bankRating">银行信用评级</Label>
                <Select
                  value={formData.bankRating}
                  onValueChange={(value) => updateField('bankRating', value || 'AAA')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择">
                      {(value) => BANK_RATING_OPTIONS.find(opt => opt.value === value)?.label || value}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AAA">AAA（极好）</SelectItem>
                    <SelectItem value="AA">AA（良好）</SelectItem>
                    <SelectItem value="A">A（较好）</SelectItem>
                    <SelectItem value="BBB">BBB（一般）</SelectItem>
                    <SelectItem value="BB">BB（较差）</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="creditRecord">信誉记录</Label>
                <Input
                  id="creditRecord"
                  value={formData.creditRecord}
                  onChange={(e) => updateField('creditRecord', e.target.value)}
                  placeholder="请输入信誉记录说明"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 产能配置 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>产能配置</CardTitle>
            <CardDescription>请配置公司产能相关信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="totalMembers">团队总人数 *</Label>
                <Input
                  id="totalMembers"
                  value={formData.totalMembers}
                  onChange={(e) => updateField('totalMembers', e.target.value)}
                  type="number"
                  placeholder="请输入团队人数"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacityFactor">产能系数</Label>
                <Select
                  value={formData.capacityFactor}
                  onValueChange={(value) => updateField('capacityFactor', value || '0.8')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择">
                      {(value) => CAPACITY_FACTOR_OPTIONS.find(opt => opt.value === value)?.label || value}
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
          </CardContent>
        </Card>

        {/* 团队架构 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>团队架构</CardTitle>
            <CardDescription>请填写团队角色和人员配置</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {teamMembers.map((member, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-end gap-4 flex-wrap">
                    <div className="flex-1 space-y-2 min-w-[200px]">
                      <Label>角色</Label>
                      <Select
                        value={member.role}
                        onValueChange={(value) => updateTeamMember(index, 'role', value || '')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择角色">
                            {(value) => ROLE_OPTIONS.find(opt => opt.value === value)?.value || value}
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
          </CardContent>
        </Card>

        {/* 核心成员 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>核心成员</CardTitle>
            <CardDescription>请填写核心成员信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        {/* 设备情况 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>设备情况</CardTitle>
            <CardDescription>请填写公司设备情况</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        {/* 代表作品 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>代表作品</CardTitle>
            <CardDescription>请填写公司代表作品</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        {/* 其他信息 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>其他信息</CardTitle>
            <CardDescription>其他需要说明的信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyDescription">公司介绍</Label>
              <Textarea
                id="companyDescription"
                value={formData.companyDescription}
                onChange={(e) => updateField('companyDescription', e.target.value)}
                placeholder="请简要介绍公司情况"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="remarks">备注</Label>
              <Textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) => updateField('remarks', e.target.value)}
                placeholder="其他需要说明的信息"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/suppliers')}
          >
            取消
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? '提交中...' : '提交申请'}
          </Button>
        </div>
      </form>
    </div>
  );
}
