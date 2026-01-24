# 分页组件优化说明

## 概述

已完成对项目分页显示的优化。新创建的 `Pagination` 组件实现了"有几页就显示几页"的智能分页逻辑。

## 主要改进

### 1. **智能分页显示**

- **≤ 5页**：显示所有页码
- **> 5页**：只显示关键页码 + 省略号
  - 总是显示第1页和最后一页
  - 显示当前页周围的页码（前后各2页）
  - 中间用省略号 (...) 分隔

### 2. **功能特性**

- ✅ 上一页/下一页按钮（自动禁用）
- ✅ 首页/末页按钮（可选）
- ✅ 直观的页码指示（当前页/总页数）
- ✅ 完全响应式设计
- ✅ 无障碍访问支持 (ARIA labels)
- ✅ 平滑的交互动画

### 3. **样式优化**

- 现代化的设计风格
- 悬停效果提示可交互性
- 活跃页码高亮显示
- 禁用状态清晰反馈
- 移动端友好的适配

## 使用方法

### 基础用法

```tsx
import Pagination from '@/components/Pagination';

// 在组件中使用
<Pagination page={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />;
```

### 完整示例

```tsx
import { useState } from 'react';

import Pagination from '@/components/Pagination';

export default function MyComponent() {
  const [page, setPage] = useState(1);
  const totalPages = 10;

  return (
    <div>
      {/* 你的内容 */}
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        showFirstLast={true} // 显示首尾按钮
      />
    </div>
  );
}
```

### Props 说明

| Props           | 类型                     | 必需 | 说明                          |
| --------------- | ------------------------ | ---- | ----------------------------- |
| `page`          | `number`                 | ✓    | 当前页码 (1-indexed)          |
| `totalPages`    | `number`                 | ✓    | 总页数                        |
| `onPageChange`  | `(page: number) => void` | ✓    | 页码变更回调函数              |
| `showFirstLast` | `boolean`                | -    | 是否显示首尾按钮，默认 `true` |
| `className`     | `string`                 | -    | 自定义样式类名                |

## 已更新的页面

1. ✅ **Blog 页面** (`/blog`) - 文章列表分页
2. ✅ **Blog Archive** (`/blog/archive`) - 按月份归档分页
3. ✅ **Adoption 页面** (`/adopt`) - 宠物领养分页
4. ✅ **Lost Pets 页面** (`/lost`) - 走失宠物分页
5. ✅ **Lost Pets List** (`/lost/list`) - 走失列表分页
6. ✅ **Shelters 页面** (`/shelters`) - 收容所列表分页
7. ✅ **Found Pets** - 被发现的宠物分页
8. ✅ **用户资料 - 我的文章** - 用户文章列表分页
9. ✅ **用户资料 - 收藏文章** - 收藏文章列表分页

## 分页逻辑示例

### 总页数为3页时：

```
[ ← ] 1 2 3 [ → ] (1 / 3)
```

### 总页数为7页，在第4页时：

```
[ ← ] 1 ... 2 3 4 5 6 ... 7 [ → ] (4 / 7)
```

### 总页数为10页，在第1页时：

```
[ ← disabled ] 1 2 3 4 5 ... 10 [ » ] [ → ] (1 / 10)
```

## 样式文件

- 位置：`src/components/Pagination/pagination.scss`
- 响应式断点：
  - 桌面版：全功能显示
  - 平板版 (≤768px)：按钮缩小，间距优化
  - 手机版 (≤480px)：最小化显示，隐藏辅助按钮

## 迁移指南（如果需要手动更新）

### 旧代码示例：

```tsx
{
  totalPages > 1 && (
    <div className="pager">
      <button disabled={page <= 1} onClick={() => goPage(page - 1)}>
        Prev
      </button>
      <span>
        {page} / {totalPages}
      </span>
      <button disabled={page >= totalPages} onClick={() => goPage(page + 1)}>
        Next
      </button>
    </div>
  );
}
```

### 新代码：

```tsx
<Pagination page={page} totalPages={totalPages} onPageChange={goPage} />
```

## 浏览器兼容性

- Chrome/Edge: ✅ 完全支持
- Firefox: ✅ 完全支持
- Safari: ✅ 完全支持
- IE 11: ⚠️ 需要 polyfill

## 性能考虑

- 组件使用 React.memo 优化
- 当总页数为1时自动隐藏，避免不必要的渲染
- 按钮采用事件委托最小化 DOM 节点

## 问题排查

### 分页不显示？

- 检查 `totalPages > 1` 是否为真
- 确认 `page` 和 `totalPages` 值正确

### 按钮样式不对？

- 检查 SCSS 文件是否正确导入
- 验证全局样式未覆盖组件样式

## 未来改进空间

- [ ] 添加"跳转到某页"的输入框
- [ ] 支持自定义显示的页码数量 (目前固定5页)
- [ ] 添加页码数据统计/分析
- [ ] 支持键盘快捷键（← →）导航

---

**版本**: 1.0.0  
**最后更新**: 2026-01-24
