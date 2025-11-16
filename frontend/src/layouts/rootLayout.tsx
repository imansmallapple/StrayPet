import { Outlet } from 'react-router-dom'
import TopNavbar from '@/components/navbar'

export default function RootLayout() {
  return (
    <>
      <TopNavbar />  {/* 所有页面都显示的全局导航栏 */}
      <Outlet />     {/* 当前路由对应的页面内容 */}
    </>
  )
}
