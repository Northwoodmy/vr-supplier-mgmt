# 3D/VR影片供应商管理系统 - 实施计划

## 上下文

用户刚接管内容团队，需要管理使用UE5/U3D技术制作3D/VR影片的供应商。目前管理混乱，只有合同没有系统，需要从0搭建一个Web应用，将已设计的评估体系整合进系统中。

## 目标

构建一个供应商管理系统，实现：
1. 供应商档案管理（团队架构、技术能力、分级）
2. 项目管理（关联供应商、追踪交付）
3. 影片品质评估（6维度评分体系）
4. 供应商产能饱和度评估（判断能否接新项目）
5. 年度评比报表（排名、费用汇总、性价比分析）

## 技术选型

**推荐方案：Next.js + Prisma + PostgreSQL**

选择理由：
- 全栈TypeScript，类型安全，适合长期维护
- React生态表单库成熟，适合复杂的6维度评分表单
- Next.js支持服务端渲染报表，性能好
- shadcn/ui组件库可快速搭建管理后台

## 数据库设计概要

### 核心表

#### 供应商相关
- `suppliers` - 供应商基础信息、分级(S/A/B/C)
- `team_members` - 团队架构（UE5/U3D工程师、美术、动画等角色及人数）
- `supplier_capacity` - 供应商产能配置（团队人数、产能系数）

#### 项目相关
- `projects` - 项目信息（预算、实际费用、周期、状态）
- `supplier_projects` - 供应商与项目关联表，含产能分配字段
  - `estimatedManDays` - 预估人天
  - `complexityLevel` - 项目复杂度(simple/medium/complex/extreme)
  - `currentStage` - 当前阶段
  - `workloadShare` - 工作量占比(0-1)
  - `currentLoad` - 当前占用产能（自动计算）
- `project_deliveries` - 交付物版本管理

#### 评估相关
- `quality_reviews` - 品质评估（6维度1-5分 + 加权总分）
- `supplier_ratings` - 供应商年度/季度统计数据（项目数、均分、总费用、性价比）

### 产能评估核心字段说明

**supplier_capacity 表：**
```prisma
totalMembers    Int      // 团队总人数
capacityFactor  Float    @default(0.8) // 产能系数：<10人0.7, 10-20人0.8, 20-50人0.75, >50人0.7
monthlyCapacity Float    // 月度标准产能 = totalMembers × capacityFactor
```

**supplier_projects 产能字段：**
```prisma
estimatedManDays    Int?        // 预估人天
complexityLevel     String      // simple(0.8)/medium(1.0)/complex(1.3)/extreme(1.6)
currentStage        String      // planning/pre_production/production/review/delivery/paused
workloadShare       Float       // 该供应商承担比例(0-1)
currentLoad         Float       // 当前月度占用产能（自动计算）
```

## 核心功能模块

### 1. 供应商管理模块
- 供应商列表（支持按等级、技术栈、饱和度筛选）
- 供应商CRUD表单（包含团队架构动态添加）
- 供应商详情页（展示历史项目、评级趋势、产能分析）
- **供应商产能配置（新增）**

### 2. 项目管理模块
- 项目列表（按状态筛选）
- 项目CRUD表单
- 项目详情页（Tabs：概览/关联供应商/交付物/品质评估）
- **项目工作量预估与分配（新增）**

### 3. 产能管理模块（新增）
- 产能仪表盘（所有供应商饱和度一览）
- **饱和度计算与可视化**
  - 饱和度进度条（🟢0-60% 🟡60-80% 🔴80-100% ⚫>100%）
  - 当前负载 vs 总产能对比
  - 并行项目数显示
- **接新项目评估**
  - 模拟新项目对供应商的影响
  - 风险等级预测
  - 替代方案建议
- 产能预警（超载供应商自动标记）

### 4. 评估管理模块
- 待评估项目列表
- 6维度评分表单（每项1-5分，带详细评价输入）
- 雷达图可视化评分结果
- 评估历史记录

### 5. 报表模块
- 年度供应商排名表
- 费用统计分析
- **产能利用率报表（新增）**
- 性价比散点图
- Excel导出功能

## 产能饱和度评估模型

### 计算公式

```typescript
// 1. 月度标准产能
monthlyCapacity = totalMembers × capacityFactor

// 2. 单个项目月度负载
projectMonthlyLoad = (estimatedManDays / 22 / projectDurationMonths) × workloadShare

// 3. 加权负载（考虑复杂度和阶段）
weightedLoad = projectMonthlyLoad × complexityFactor × stageFactor

// 4. 并行损耗系数
parallelFactor = 1项目(1.0) / 2项目(1.15) / 3项目(1.35) / 4+项目(1.6)

// 5. 总已分配产能
totalAllocatedLoad = Σ(weightedLoad) × parallelFactor

// 6. 饱和度
saturationRate = (totalAllocatedLoad / monthlyCapacity) × 100%
```

### 系数参考表

**复杂度系数：**
| 级别 | 系数 | 说明 |
|-----|------|------|
| simple | 0.8 | 常规场景、标准流程 |
| medium | 1.0 | 正常难度 |
| complex | 1.3 | 大场景、多角色、复杂交互 |
| extreme | 1.6 | 开放世界、大量特效、创新技术 |

**阶段系数：**
| 阶段 | 系数 | 说明 |
|-----|------|------|
| planning | 0.2 | 前期沟通/报价 |
| pre_production | 0.5 | 预制作/概念设计 |
| production | 1.0 | 制作中（核心投入） |
| review | 0.8 | 修改/反馈期 |
| delivery | 0.6 | 收尾/交付 |
| paused | 0.1 | 暂停/等待反馈 |

**饱和度状态：**
| 区间 | 状态 | 建议 |
|-----|------|------|
| 0-60% | 🟢 available | 可正常接新项目 |
| 60-80% | 🟡 caution | 需谨慎评估，优先小项目 |
| 80-100% | 🔴 saturated | 原则上不接新项目 |
| >100% | ⚫ overload | 已超负荷，需减负荷 |

### 接新项目评估示例

```typescript
interface NewProjectAssessment {
  canAccept: boolean;           // 是否可接
  currentSaturation: number;    // 当前饱和度
  predictedSaturation: number;  // 接新项目后饱和度
  riskLevel: 'low' | 'medium' | 'high';
  recommendation: string;       // 建议
  alternativeSuggestions?: string[]; // 替代方案
}
```

## MVP版本规划（第一阶段，4周）

**目标：建立供应商和项目基础数据，实现基础产能评估**

### Week 1-2: 基础数据
1. 供应商管理（列表、新建/编辑、详情）
2. **供应商产能配置（新增）**
   - 设置团队人数、产能系数
   - 计算月度标准产能
3. 项目管理（列表、新建/编辑）

### Week 3-4: 产能关联与计算
4. **项目与供应商关联增强（新增）**
   - 预估人天、复杂度选择
   - 工作量占比设置
5. **基础饱和度计算（新增）**
   - 实时计算当前负载
   - 供应商列表显示饱和度进度条
6. 基础登录和权限控制

**暂不做**：文件上传（先用URL）、复杂报表、品质评估表单、智能接项目评估

## 第二阶段（3周）：评估体系完善

### Week 1-2: 品质评估落地
- 6维度评分表单
- 加权总分自动计算
- 雷达图展示
- 交付物版本管理

### Week 3: 产能智能评估（新增）
- **接新项目评估功能**
  - 模拟新项目影响
  - 风险预测
  - 推荐排序（饱和度低者优先）
- 产能预警系统

## 第三阶段（2周）：报表与优化

- 年度供应商排名报表
- **产能利用率分析报表（新增）**
  - 各供应商月度产能趋势
  - 历史负载分析
- 费用统计图表
- 性价比分析
- 文件上传功能

## 评估体系落地细节

### 影片品质评估 - 权重配置
- 画面质量 25%（模型精度、材质质感、光影氛围、色彩调校）
- 动画流畅度 20%（动作自然度、镜头运动、帧率稳定性、动画节奏）
- 特效匹配度 15%（特效质量、场景融合、剧情契合、性能优化）
- 配音质量 15%（配音表现、音质清晰、音效设计、BGM匹配）
- 运镜合理性 15%（镜头语言、运动设计、剪辑节奏、VR舒适度）
- 剧情新颖度 10%（创意独特性、叙事完整性、情绪感染力、主题表达）

### 品质评分计算公式
```typescript
totalScore = visualQuality*0.25 + animationSmoothness*0.20 + 
             vfxMatch*0.15 + audioQuality*0.15 + cameraWork*0.15 + storyNovelty*0.10

costPerformance = avgQualityScore / (totalCost / 10000)
```

### 工作流
- 影片评估：项目完成 → 待评估 → 评估中 → 已评估
- 产能更新：项目状态/阶段变更 → 自动重新计算饱和度

## 关键文件清单

| 文件路径 | 说明 |
|---------|------|
| `/prisma/schema.prisma` | 数据库模型定义（含产能相关表） |
| `/src/server/trpc/routers/evaluation.ts` | 品质评估API（含评分计算） |
| `/src/server/trpc/routers/capacity.ts` | **产能评估API（新增）** |
| `/src/components/forms/evaluation-form.tsx` | 6维度评分表单UI |
| `/src/components/capacity/saturation-badge.tsx` | **饱和度显示组件（新增）** |
| `/src/components/capacity/new-project-assessment.tsx` | **接新项目评估组件（新增）** |
| `/src/server/trpc/routers/report.ts` | 报表生成API |
| `/src/app/(dashboard)/projects/[id]/page.tsx` | 项目详情页（整合交付物+评估） |
| `/src/app/(dashboard)/capacity/page.tsx` | **产能仪表盘页面（新增）** |

## 项目初始化命令

```bash
npx create-next-app@latest vr-supplier-mgmt --typescript --tailwind --app
npm install @prisma/client prisma @trpc/server @trpc/client @trpc/react-query @tanstack/react-query zod react-hook-form @hookform/resolvers recharts xlsx lucide-react date-fns
npx shadcn-ui@latest init
npx prisma init
```

## 部署配置

### 网络要求
- **部署方式**：局域网内部署
- **访问地址**：`http://<服务器IP>:23456`
- **端口**：固定 `23456`
- **绑定**：`0.0.0.0`（允许局域网内所有设备访问）

### 生产环境启动
```bash
# 方式1: 直接启动
PORT=23456 npm start -- -H 0.0.0.0

# 方式2: PM2守护进程
pm2 start npm --name "vr-supplier-mgmt" -- start -- -p 23456 -H 0.0.0.0
```

### 环境变量
```env
PORT=23456
HOST=0.0.0.0
NEXTAUTH_URL="http://服务器局域网IP:23456"
DATABASE_URL="postgresql://..."
```

## 验证方式

### 基础功能
1. 创建供应商并录入团队架构和产能配置
2. 创建项目并关联供应商，填写预估人天和复杂度
3. 查看供应商饱和度是否正确计算

### 产能评估
4. 修改项目阶段，观察饱和度实时变化
5. 为同一供应商添加多个并行项目，验证并行损耗计算
6. 使用"接新项目评估"功能，验证预测准确性

### 品质与报表
7. 填写品质评估表单，验证加权总分计算
8. 查看供应商年度排名报表
9. 导出Excel报表验证数据准确性
