# 项目错误记录

本文档记录项目开发过程中遇到的反复出现的错误，供后续开发参考，避免重复踩坑。

## 使用说明

- 按时间倒序记录新发现的错误
- 每条记录包含：错误描述、原因、解决方案、预防措施
- 定期回顾，更新解决方案

---

## 错误记录模板

```markdown
### ERR-XXX: 错误标题

**发现时间**: YYYY-MM-DD

**错误描述**: 
简要描述错误现象

**错误信息**:
```
具体的错误日志或报错信息
```

**原因分析**:
为什么会发生这个错误

**解决方案**:
1. 步骤1
2. 步骤2

**预防措施**:
- 建议1
- 建议2

**相关文件**:
- `/path/to/file1`
- `/path/to/file2`

**参考链接**:
- [链接标题](URL)
```

---

## 待记录区域

### ERR-003: 项目创建 API 外键约束失败

**发现时间**: 2026-04-06

**错误描述**: 
调用 POST /api/projects 创建项目时返回 500 错误"Failed to create project"

**错误信息**:
```
Foreign key constraint violated on the foreign key
```

**原因分析**:
API 代码中使用 `createdById: 'system'` 作为固定用户 ID，但数据库中没有这个用户

**解决方案**:
修改 `/src/app/api/projects/route.ts`，使用 `getCurrentUser()` 从 session 获取当前登录用户 ID

**预防措施**:
- 不要在代码中硬编码不存在的用户 ID
- 所有需要用户关联的操作都应从 session 获取当前用户

**相关文件**:
- `/src/app/api/projects/route.ts`

---

### ERR-001: Pencil设计中的百分比宽度错误

**发现时间**: 2024-04-05

**错误描述**: 
在Pencil中尝试使用百分比宽度（如`width: "72%"`）创建进度条时失败

**错误信息**:
```
/width expected one of: number, "$variable", sizing behavior (fit_content or fill_container, with optional fallback size like fit_content(100)), got "72%"
```

**原因分析**:
Pencil的`.pen`格式不支持百分比宽度值，只支持固定数字、变量引用或sizing behavior（fit_content/fill_container）

**解决方案**:
1. 使用固定像素值代替百分比（如`width: 100`）
2. 对于进度条，使用frame嵌套：外层固定宽度，内层用固定像素表示进度
3. 使用`fill_container`配合父frame的layout来实现自适应

**预防措施**:
- 设计时始终使用`fit_content`或`fill_container`进行自适应布局
- 需要精确控制时使用固定像素值
- 避免使用CSS百分比概念

**相关文件**:
- `/pencil-new.pen` 供应商卡片组件

---

## 已修复错误

### ERR-006: 评估表单 Slider 组件无法通过点击改变值 ✅

**修复时间**: 2026-04-06

**解决方案**:
1. 创建新的 `RatingSelector` 组件（`/src/components/ui/rating-selector.tsx`）
2. 使用按钮组替代 Slider，每个分数值对应一个可点击的按钮
3. 按钮显示分数和描述（如"4 - 良好"），选中时高亮显示
4. 修改评估页面使用新的 `RatingSelector` 组件

**相关文件**:
- `/src/components/ui/rating-selector.tsx` (新建)
- `/src/app/(dashboard)/evaluations/new/page.tsx` (已更新)

---

### ERR-005: 项目创建时供应商关联未保存 ✅

**修复时间**: 2026-04-06

**解决方案**:
修改 `/src/app/api/projects/route.ts`，使用 `$transaction` 确保所有供应商关联都成功创建，添加详细日志

**相关文件**:
- `/src/app/api/projects/route.ts`

---

### ERR-004: 供应商申请数据持久化失败 ✅

**修复时间**: 2026-04-06

**解决方案**:
在 `/src/app/api/suppliers/apply/route.ts` 中添加 `engineCapability` 字段到 prisma.create 的 data 对象

**相关文件**:
- `/src/app/api/suppliers/apply/route.ts`

---

### ERR-002: 供应商分配页面 404 ✅

**修复时间**: 2026-04-06

**解决方案**:
创建 `/src/app/(dashboard)/projects/[id]/suppliers/page.tsx` 页面和对应的 API 路由

**相关文件**:
- `/src/app/(dashboard)/projects/[id]/suppliers/page.tsx` (新建)
- `/src/app/api/projects/[id]/suppliers/route.ts` (新建)

---

## 待修复错误

### ERR-001: Pencil 设计中的百分比宽度错误

**发现时间**: 2024-04-05

**错误描述**: 
在 Pencil 中尝试使用百分比宽度（如`width: "72%"`）创建进度条时失败

**错误信息**:
```
/width expected one of: number, "$variable", sizing behavior (fit_content or fill_container, with optional fallback size like fit_content(100)), got "72%"
```

**原因分析**:
Pencil 的`.pen`格式不支持百分比宽度值，只支持固定数字、变量引用或 sizing behavior（fit_content/fill_container）

**解决方案**:
1. 使用固定像素值代替百分比（如`width: 100`）
2. 对于进度条，使用 frame 嵌套：外层固定宽度，内层用固定像素表示进度
3. 使用 `fill_container` 配合父 frame 的 layout 来实现自适应

**相关文件**:
- `/pencil-new.pen` 供应商卡片组件

---

