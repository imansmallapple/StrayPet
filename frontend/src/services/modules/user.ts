// src/services/modules/user.ts
import http from '@/services/http'

export type Me = { id: number; username: string; email?: string; name?: string }

export const userApi = {
  // 这些路由里有哪个就会被命中；没有的会被 try/catch 忽略
  me: () => http.get<any>('/user/me/'),              // 可选：如果你没有该路由，返回 404 也没关系
  byId: (id: string | number) => http.get<any>(`/user/${id}/`), // 细节路由（常见 DRF 风格）
  list: () => http.get<any>('/user'),                // 你的现有路由
}
