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

## 已归档错误

*暂无记录*

---

## 已归档错误

*暂无记录*

