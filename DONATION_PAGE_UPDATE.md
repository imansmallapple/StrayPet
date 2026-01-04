# 捐赠页面改造总结

## 改动内容

### 1. 前端页面改造

**文件**: [frontend/src/views/donation/index.tsx](frontend/src/views/donation/index.tsx)

- **原功能**: 个人宠物领养表单（Create an adoption listing）
- **新功能**: 宠物收容机构查询目录

#### 新页面结构：

1. **标题区域** - "捡到走失/流浪狗了吗？"
2. **重要信息提示** - 用户有责任先通知收容所
3. **操作指南** - 捡到宠物时的 4 个步骤

   - 在附近散步寻找狗主
   - 在社交媒体发布照片
   - 检查是否有芯片
   - 向收容所报告

4. **收容所列表** - 网格显示所有活跃的收容机构
   - 显示名称、验证状态
   - 容量信息（当前/总容量）
   - 联系方式（邮箱、电话、网站）
   - 社交媒体链接

#### 技术实现：

- 使用 `shelterApi.list()` 从后端获取收容所列表
- 从 `@/services/modules/shelter` 导入 Shelter 类型
- 支持加载状态和错误处理
- 响应式网格布局

### 2. 样式美化

**文件**: [frontend/src/views/donation/index.scss](frontend/src/views/donation/index.scss)

新增样式：

- `.guides-grid` - 操作指南网格（4 列自适应）
- `.guide-card` - 单个指南卡片（带悬停效果）
- `.guide-number` - 编号圆形徽章（黄色背景）
- `.shelters-grid` - 收容所网格布局
- `.shelter-card` - 收容所卡片样式
- `.shelter-header` - 卡片头部（带名称和验证徽章）
- `.shelter-info` - 容量/年份信息区
- `.shelter-contact` - 联系方式列表
- `.shelter-social` - 社交媒体链接
- `.cta-button` - 行动号召按钮

### 3. 后端 API

**已有 API** - 无需修改

- **端点**: `/api/pet/shelter/`
- **方法**: GET（列表）、POST（创建）、GET（详情）等
- **权限**: `IsAuthenticatedOrReadOnly` - 任何人都可以查看
- **ViewSet**: `ShelterViewSet` (supports filtering, ordering)

### 4. 数据库数据

已在数据库中添加 6 个收容所示例：

1. 北京动物救助中心
2. 上海宠物之家
3. 广州爱心宠物救援站
4. 深圳温暖家园
5. 西安动物保护委员会
6. 杭州友好宠物救助中心

## 页面 URL

```
http://localhost:5173/donation
```

## 使用流程

1. 用户访问 `/donation` 路由
2. 页面加载显示：

   - 页面标题和说明
   - 4 个步骤指南卡片
   - 所有活跃的收容所列表

3. 用户可以：
   - 查看收容所详情（名称、描述、容量等）
   - 点击邮箱/电话/网站链接联系收容所
   - 点击社交媒体图标访问收容所社交账号

## 截图对比

页面现在显示的内容与用户上传的截图相符：

- ✅ 标题："捡到走失/流浪狗了吗？"
- ✅ 关键信息提示框
- ✅ 4 个步骤指南卡片
- ✅ 收容所列表（网格布局）
- ✅ 每个收容所的完整信息

## 后续可能的扩展

1. 添加按位置筛选的功能
2. 添加收容所评分/评论
3. 集成地图显示收容所位置
4. 添加"联系收容所"的快捷按钮
5. 显示收容所的实时动物库存
