import { lazy } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'

import ErrorBoundary from '../error-boundary';
import { LazyLoad, routes } from './utils';

const router: RouteObject[] = [
  {
    path: '/',
    /**
     * 可以在Root组件（自己新建），用 useLoaderData 接收 loader 返回的数据做一些操作
     * @see https://reactrouter.com/en/main/hooks/use-loader-data#useloaderdata
     */
    // element: <Root />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <Navigate to="/home" />, // 重定向
      },
      {
        path: '/home',
        element: LazyLoad(lazy(() => import('@/views/home'))),
      },
      {
        path: '/login',
        element: LazyLoad(lazy(() => import('@/views/test/login'))),
      },
      {
        path: '/user/profile',
        element: LazyLoad(lazy(() => import('@/views/user/profile'))),
      },
      {
        path: '/404',
        element: LazyLoad(lazy(() => import('@/components/not-fount'))),
      },
      {
        path: '/auth/login',
        element: LazyLoad(lazy(() => import('@/views/auth/login'))),
      },
      {
        path: '/auth/register',
        element: LazyLoad(lazy(() => import('@/views/auth/register'))),
      },
      {
        path: '/auth/forget',
        element: LazyLoad(lazy(() => import('@/views/auth/forget'))),
      },
      {
        path: '/auth/reset',
        element: LazyLoad(lazy(() => import('@/views/auth/reset'))),
      },
      // src/router/index.tsx
      {
        path: '/adopt',
        element: LazyLoad(lazy(() => import('@/views/adoption/index'))),
      },
      // 详情页（可选）
      {
        path: '/adopt/:id',
        element: LazyLoad(lazy(() => import('@/views/adoption/detail'))), // 以后做详情时用
      },
            {
        path: '/adopt/:id/apply',
        element: LazyLoad(lazy(() => import('@/views/adoption/apply'))), // 以后做详情时用
      },
      // src/router/index.tsx 节选
      {
        path: '/lost',
        element: LazyLoad(lazy(() => import('@/views/lost/list'))),
      },
      {
        path: '/lost/:id',
        element: LazyLoad(lazy(() => import('@/views/lost/detail'))),
      },
      {
        path: '/lost/report',
        element: LazyLoad(lazy(() => import('@/views/lost/post'))),
      },
      ...routes, // modules 路由
    ],
  },
  {
    path: '*',
    element: <Navigate to="/404" />, // 找不到页面
  },
];

export default createBrowserRouter(router);
