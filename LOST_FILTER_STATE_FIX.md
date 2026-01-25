# Lost Pets 筛选状态保留 - 修改总结

## 问题描述

用户在 `/lost` 路由中筛选宠物信息后，点击卡片查看详情，然后返回时，筛选条件会被重置，导致显示所有宠物而不是之前筛选后的结果。

## 根本原因

1. **detail 页面返回按钮** 硬编码为 `/lost`，没有保留查询参数
2. **列表卡片** 使用硬链接 `<a>` 标签，没有传递查询参数给详情页
3. **地图标记点击** 也没有保留查询参数

## 解决方案

### 1. [frontend/src/views/lost/detail/index.tsx](frontend/src/views/lost/detail/index.tsx)

**修改内容：**

- ✅ 导入 `useLocation` hook
- ✅ 修改所有返回按钮，使用 `navigate(`/lost${location.search}`)` 而不是 `/lost`
- ✅ 这样返回时会自动附加之前的查询参数（如 `?city=Warsaw&species=dog`）

**关键代码：**

```tsx
import { useLocation } from 'react-router-dom'

const location = useLocation()

// 返回按钮
onClick={() => navigate(`/lost${location.search}`)}
```

### 2. [frontend/src/views/lost/index.tsx](frontend/src/views/lost/index.tsx)

**修改内容：**

- ✅ 将卡片链接从 `<a href>` 改为 `<button onClick>`
- ✅ 点击时调用 `navigate()` 并传递查询参数
- ✅ 使用 `sp.toString()` 获取当前的所有查询参数

**关键代码：**

```tsx
// 改前：
<a href={`/lost/${pet.id}`} className="card-link">

// 改后：
<button
  onClick={() => navigate(`/lost/${pet.id}${sp.toString() ? `?${sp.toString()}` : ''}`)}
  className="card-link"
>
```

### 3. [frontend/src/views/lost/components/LostPetsMap.tsx](frontend/src/views/lost/components/LostPetsMap.tsx)

**修改内容：**

- ✅ 导入 `useLocation` hook
- ✅ 修改地图标记点击事件，传递查询参数
- ✅ 保留所有筛选条件

**关键代码：**

```tsx
import { useLocation } from "react-router-dom";

const location = useLocation();

// 标记点击
navigate(`/lost/${petId}${location.search}`);
```

## 工作流程演示

```
1. 用户访问 /lost
   ↓
2. 用户筛选条件（如：city=Warsaw, species=dog）
   URL: /lost?city=Warsaw&species=dog
   ↓
3. 用户点击卡片
   新增：保留 location.search
   导航到：/lost/{id}?city=Warsaw&species=dog
   ↓
4. 用户点击"返回"按钮
   新增：使用 location.search 返回
   导航到：/lost?city=Warsaw&species=dog
   ↓
5. 页面显示筛选后的内容 ✅
```

## 技术细节

### URL 查询参数保留机制

**location.search：**

- 获取当前 URL 的查询字符串部分（包括 `?`）
- 例如：`?city=Warsaw&species=dog&page=2`

**保留方式：**

```tsx
// 方式 1：直接拼接
navigate(`/lost/${id}${location.search}`);

// 方式 2：使用 useSearchParams
navigate(`/lost/${id}${sp.toString() ? `?${sp.toString()}` : ""}`);
```

### React Router useLocation 的用途

`useLocation` 返回当前位置对象，包括：

- `pathname` - 路径部分
- `search` - 查询字符串（`?key=value&...`）
- `hash` - 哈希部分
- `state` - 导航状态

## 影响范围

| 场景                 | 改动前          | 改动后          |
| -------------------- | --------------- | --------------- |
| 点击列表卡片进入详情 | ❌ 丢失筛选状态 | ✅ 保留筛选状态 |
| 点击地图标记进入详情 | ❌ 丢失筛选状态 | ✅ 保留筛选状态 |
| 从详情页返回列表     | ❌ 重置所有筛选 | ✅ 保留筛选状态 |
| 错误提示中的返回按钮 | ❌ 丢失筛选状态 | ✅ 保留筛选状态 |

## 测试步骤

1. **基础筛选测试：**
   - [ ] 访问 `/lost`
   - [ ] 选择城市（例：Warsaw）
   - [ ] 点击筛选按钮
   - [ ] 点击某个卡片进入详情
   - [ ] 点击返回按钮
   - [ ] 确认页面仍显示 Warsaw 的宠物

2. **多条件筛选测试：**
   - [ ] 同时选择城市、宠物类型、时间范围
   - [ ] 点击卡片进入详情
   - [ ] 返回后确认所有筛选条件仍保留

3. **分页测试：**
   - [ ] 筛选后翻页到第 2 页
   - [ ] 点击卡片
   - [ ] 返回确认仍在第 2 页

4. **地图点击测试：**
   - [ ] 点击地图上的标记进入详情
   - [ ] 返回确认筛选状态保留

5. **错误情况测试：**
   - [ ] 详情页加载失败时的返回按钮
   - [ ] 确认返回按钮能保留筛选状态

## 代码质量

- ✅ 无编译错误
- ✅ 类型安全（TypeScript）
- ✅ 一致的代码风格
- ✅ 最小化修改范围
- ✅ 向后兼容

## 性能影响

- 🟢 **无负面影响** - 只是改变了导航方式
- 🟢 使用 React Router 导航而不是硬刷新，性能更好
- 🟢 减少了不必要的 API 请求

## 用户体验改进

- 🎯 用户返回时能看到他们筛选的结果
- 🎯 浏览宠物信息时不会丢失上下文
- 🎯 浏览历史更符合用户预期
- 🎯 减少了重新筛选的步骤

## 相关文件

```
frontend/src/views/lost/
├── index.tsx                    ← 修改：卡片点击传递查询参数
├── detail/
│   └── index.tsx               ← 修改：返回按钮保留查询参数
└── components/
    └── LostPetsMap.tsx         ← 修改：地图标记传递查询参数
```

## 后续建议

1. **收藏功能** - 保存用户的常用筛选条件
2. **历史记录** - 记录用户的搜索历史
3. **分享链接** - 用户可以分享他们的筛选结果给他人
4. **书签** - 用户可以书签保存特定的筛选条件

---

**修改日期：** 2026-01-25  
**修改类型：** UX 优化  
**影响等级：** 低（只影响导航逻辑）  
**测试状态：** ✅ 代码编译通过
