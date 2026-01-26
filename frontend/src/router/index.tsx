// 'lazy' is not used in this file as we use lazyWithFallback; keep imports minimal
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'

import ErrorBoundary from '../error-boundary'
import { LazyLoad, routes } from './utils'
import { lazyWithFallback } from './utils/lazy-load'
import RootLayout from '@/layouts/rootLayout'   // ★ 新增

const router: RouteObject[] = [
  {
    path: '/',
    // ★ 这里挂上 RootLayout，这样所有 children 都会带 navbar
    element: <RootLayout />,
    /**
     * 可以在Root组件（自己新建），用 useLoaderData 接收 loader 返回的数据做一些操作
     * @see https://reactrouter.com/en/main/hooks/use-loader-data#useloaderdata
     */
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <Navigate to="/home" />, // 重定向
      },
      {
        path: '/home',
          element: LazyLoad(lazyWithFallback(() => import('@/views/home'))),
      },
      {
        path: '/login',
          element: LazyLoad(lazyWithFallback(() => import('@/views/test/login'))),
      },
      {
        path: '/user/profile',
        element: LazyLoad(lazyWithFallback(() => import('@/views/user/profile'))),
      },
      {
        path: '/user/profile/:userId',
        element: LazyLoad(lazyWithFallback(() => import('@/views/user/ViewUserProfile'))),
      },
      {
        path: '/404',
          element: LazyLoad(lazyWithFallback(() => import('@/components/not-fount'))),
      },
      {
        path: '/auth/login',
          element: LazyLoad(lazyWithFallback(() => import('@/views/auth/login'))),
      },
      {
        path: '/auth/register',
          element: LazyLoad(lazyWithFallback(() => import('@/views/auth/register'))),
      },
      {
        path: '/auth/forget',
          element: LazyLoad(lazyWithFallback(() => import('@/views/auth/forget'))),
      },
      {
        path: '/auth/reset',
          element: LazyLoad(lazyWithFallback(() => import('@/views/auth/reset'))),
      },
      {
        path: '/adopt',
        element: LazyLoad(lazyWithFallback(() => import('@/views/adoption/index'))),
      },
      {
        path: '/adopt/add',
        element: LazyLoad(lazyWithFallback(() => import('@/views/adoption/add'))),
      },
      // 详情页
      {
        path: '/adopt/:id',
        element: LazyLoad(lazyWithFallback(() => import('@/views/adoption/detail'))),
      },
      {
        path: '/adopt/:id/apply',
        element: LazyLoad(lazyWithFallback(() => import('@/views/adoption/apply'))),
      },
      {
        path: '/lost',
          element: LazyLoad(lazyWithFallback(() => import('@/views/lost'))),
      },
      {
        path: '/lost/post',
          element: LazyLoad(lazyWithFallback(() => import('@/views/lost/post'))),
      },
      {
        path: '/lost/:id',
          element: LazyLoad(lazyWithFallback(() => import('@/views/lost/detail'))),
      },
      {
        path: '/found',
          element: LazyLoad(lazyWithFallback(() => import('@/views/donation'))),
      },
      {
        path: '/shelters',
          element: LazyLoad(lazyWithFallback(() => import('@/views/shelters'))),
      },
      {
        path: '/shelters/:id',
          element: LazyLoad(lazyWithFallback(() => import('@/views/shelters/detail'))),
      },
      {
        path: '/blog',
        element: LazyLoad(lazyWithFallback(() => import('@/views/blog'))),
      },
      {
        path: '/blog/create',
        element: LazyLoad(lazyWithFallback(() => import('@/views/blog/create'))),
      },
      {
        path: '/blog/:id',
        element: LazyLoad(lazyWithFallback(() => import('@/views/blog/detail'))),
      },
      {
        path: '/blog/:id/edit',
        element: LazyLoad(lazyWithFallback(() => import('@/views/blog/create'))),
      },
      {
        path: '/blog/archive/:year/:month',
        element: LazyLoad(lazyWithFallback(() => import('@/views/blog/archive'))),
      },
      {
        path: '/holiday-family',
        element: LazyLoad(lazyWithFallback(() => import('@/views/holiday-family'))),
      },
      {
        path: '/holiday-family/apply',
        element: LazyLoad(lazyWithFallback(() => import('@/views/holiday-family/apply'))),
      },
      {
        path: '/holiday-family/list',
        element: LazyLoad(lazyWithFallback(() => import('@/views/holiday-family/list'))),
      },
      {
        path: '/holiday-family/detail/:id',
        element: LazyLoad(lazyWithFallback(() => import('@/views/holiday-family/detail'))),
      },
      {
        path: '/holiday-family/certified/:userId',
        element: LazyLoad(lazyWithFallback(() => import('@/views/holiday-family/certified-user-detail'))),
      },
      {
        path: '/messages',
        element: LazyLoad(lazyWithFallback(() => import('@/views/messages'))),
      },
      ...routes, // modules 路由
    ],
  },
  {
    path: '*',
    element: <Navigate to="/404" />, // 找不到页面
  },
]

export default createBrowserRouter(router)
