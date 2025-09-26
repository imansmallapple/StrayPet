**中文** | [English](./README.en-US.md)

<!-- <p align="center">
  <img src="https://user-images.githubusercontent.com/logo-url.png" alt="React-Ts-Template Logo" width="120" />
</p> -->

<h1 align="center">React-Ts-Template</h1>

<p align="center">
  基于 React 19、TypeScript 和 Vite 7 构建的现代化前端项目模板
</p>

<p align="center">
  <a href="https://github.com/huangmingfu/react-ts-template/stargazers">
    <img src="https://img.shields.io/github/stars/huangmingfu/react-ts-template" alt="GitHub stars">
  </a>
  <a href="https://github.com/huangmingfu/react-ts-template/issues">
    <img src="https://img.shields.io/github/issues/huangmingfu/react-ts-template" alt="GitHub issues">
  </a>
  <a href="https://github.com/huangmingfu/react-ts-template/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/huangmingfu/react-ts-template" alt="GitHub">
  </a>
  <a href="https://github.com/huangmingfu/react-ts-template/network/members">
    <img src="https://img.shields.io/github/forks/huangmingfu/react-ts-template" alt="GitHub forks">
  </a>
</p>

> 随着 `create-react-app` 脚手架停止维护，开发者需要一个现代化、高效且开箱即用的 React 项目模板。**React-Ts-Template** 应运而生！这是一个基于最新的 **React 19、TypeScript 和 Vite 7** 打造的项目模板，旨在帮助你极速启动项目，节省大量重复的配置时间。

## 🌟 为什么选择 React-Ts-Template？

- ⚡ **极速开发体验** - 基于 Vite 7 构建，冷启动和热更新速度极快
- 🚀 **前沿技术栈** - React 19、TypeScript、Zustand、React-Router v7 等最新技术
- 📦 **开箱即用** - 集成路由、状态管理、请求封装、代码规范等完整解决方案
- 🛡️ **类型安全** - 完整的 TypeScript 类型定义，保障代码质量
- 🎨 **现代 CSS** - SCSS 预编译 + BEM 命名规范，样式管理更规范
- 🔧 **工程化规范** - ESLint、Prettier、Stylelint、Commitlint 等代码质量保障

## 🚀 快速开始

```bash
# 克隆项目
git clone https://github.com/huangmingfu/react-ts-template.git

# 进入项目目录
cd react-ts-template

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产环境
pnpm build:pro
```

## 🧩 核心功能

- **路由懒加载**：封装实现了路由懒加载，提升页面切换性能，减少初始加载时间。（详见`router`）
- **路由守卫**：封装了灵活的路由守卫管理，确保用户访问权限控制，增强应用的安全性。（详见`router`）
- **全局状态管理**：提供了 Zustand 全局状态管理示例代码，简化跨组件状态共享，提升开发效率。（详见`store`）
- **Axios 请求封装**：对 Axios 进行封装，统一处理 HTTP 请求和响应，简化与后端接口的交互流程。（详见[service](./src/services)）
- **工具函数、hooks**：提供了一些方便实用的工具函数和hooks。（详见[utils](./src/utils)、[hooks](./src/hooks)）
- **react-dev-inspector集成**：点击页面元素，IDE直接打开对应代码插件，方便开发者调试代码，提高开发效率。(详见[vite.config.ts](./vite.config.ts)）
- **import顺序自动美化排序**：集成了 prettier-plugin-sort-imports 插件，可以自动美化 import 顺序，提高代码的可读性和可维护性。
- **其他**：提供一些方便根据环境运行、打包的命令；配置了分包策略；本地反向代理解决跨域；还有详细的`保姆级注释`等等。

## 🛠 技术栈选型

| 类别 | 技术 | 描述 |
| --- | --- | --- |
| **核心框架** | React 19 | 最新版 React，更高性能和更流畅的用户体验 |
| **路由管理** | React-Router v7 | 支持路由懒加载，优化页面切换性能 |
| **状态管理** | Zustand | 轻量级状态管理库，简单易用 |
| **样式方案** | SCSS + BEM | 模块化样式管理，结构清晰（可自行选择使用css module `xxx.module.scss`） |
| **HTTP库** | Axios | 统一处理 HTTP 请求和响应 |
| **工具库** | ahooks + es-toolkit | 丰富的 React Hooks 和 JS 工具函数 |
| **构建工具** | Vite 7 | 极速的构建工具，提升开发体验 |
| **类型检查** | TypeScript | 强大的类型系统，保障代码质量 |
| **代码规范** | ESLint + Prettier + Stylelint | 统一代码风格，提高代码质量 |

## 📁 项目结构

```
├── .vscode              # VSCode 配置
├── .husky               # Git Hooks
├── .github              # GitHub 配置
├── public               # 静态资源
├── src                  # 源代码
│   ├── assets           # 静态资源
│   ├── components       # 公共组件
│   ├── hooks            # 自定义 Hooks
│   ├── views            # 页面组件
│   ├── router           # 路由配置
│   ├── services         # 接口封装
│   ├── store            # 状态管理
│   ├── styles           # 样式文件
│   ├── types            # 类型定义
│   ├── utils            # 工具函数
│   ├── app.tsx          # 根组件
│   └── main.tsx         # 入口文件
├── .env                 # 环境变量
└── ...                  # 配置文件
```

## 🎯 特色亮点

### 🚀 高性能构建

- 基于 Vite 7 构建，冷启动时间快至毫秒级
- 支持代码分割和动态导入，优化首屏加载速度

### 🛡️ 完善的类型系统

- 完整的 TypeScript 类型定义
- 严格的 tsconfig 配置，开启所有严格检查选项
- 统一的类型管理，便于维护和协作

### 🎨 规范化的代码风格

- 集成 ESLint、Prettier、Stylelint 三大代码规范工具
- 统一的 commit message 规范（Commitlint + Husky）
- 自动格式化代码，保证团队代码风格一致性

### 🔧 强大的开发工具链

- react-dev-inspector 集成，点击页面元素直接跳转到源码
- import 顺序自动排序，提高代码可读性
- 多环境配置（dev/test/pro），满足不同部署需求

## 📦 关于路由缓存 keep-alive

> React 官方暂时没有实现 vue \<keep-alive\> 类似的功能。React 官方出于两点考虑拒绝添加这个功能，具体可以自行搜索查阅。为了达到状态保存的效果，官方推荐以下两种手动保存状态的方式：

- 将需要保存状态组件的 state 提升至父组件中保存。
- 使用 CSS visible 属性来控制需要保存状态组件的渲染，而不是使用 if/else，以避免 React 将其卸载。

> 不过也有一些相关库实现了这个功能，如：`react-router-cache-route、react-activation、keepalive-for-react` 等等，如果项目中需要状态缓存处理的数据量较小，那最好还是按照 React 官方的建议，手动解决状态缓存问题。

## ⚠️ 注意事项

> 1. 目前有一些 ui 库或其他第三方库还尚未支持 `react19`，注意甄别安装使用。
> 2. 本项目并未使用 19 版本的相关特性，如需要可以直接使用如下命令降级到 18 版本。

```bash
pnpm install react@18.3.1 react-dom@18.3.1
```

## 🤝 贡献

欢迎任何形式的贡献！如果你觉得这个项目有帮助，请给个 Star ⭐ 支持一下！

1. Fork 本项目
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 📄 许可证

本项目采用 MIT 许可证，详情请查看 [LICENSE](./LICENSE) 文件。

---

<h3 align="center">如果你喜欢这个项目，请不要吝啬你的 Star ⭐</h3>

<p align="center">
  <a href="https://github.com/huangmingfu/react-ts-template">
    <img src="https://img.shields.io/github/stars/huangmingfu/react-ts-template?style=social" alt="GitHub stars">
  </a>
</p>
