// src/services/modules/adopt.ts
import http from '@/services/http'

const baseURL = 'http://localhost:8000/' // 和你 auth.ts 一致；若你改回了 /api 代理，这里就写 'pets/' 即可

export type Pet = {
  id: number
  name: string
  species?: string   // dog/cat/...
  age?: number
  sex?: string       // male/female
  city?: string
  photo?: string     // 图片完整 URL（后端字段名按你实际改）
  description?: string
  status?: string    // available/adopted 等
  created_at?: string
}

export type PetListParams = {
  page?: number
  page_size?: number
  search?: string
  species?: string
  city?: string
  status?: string
  ordering?: string
}

export type Paginated<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export const ENDPOINTS = {
  pets: baseURL + 'pet/', 
}

export const adoptApi = {
  list: (params?: PetListParams) =>
    http.get<Paginated<Pet>>(ENDPOINTS.pets, { params }),
  detail: (id: number) =>
    http.get<Pet>(`${ENDPOINTS.pets}${id}/`),
  // 下面是可选：如果你要发帖/编辑/下架
  create: (body: Partial<Pet>) =>
    http.post<Pet>(ENDPOINTS.pets, body),
  update: (id: number, body: Partial<Pet>) =>
    http.patch<Pet>(`${ENDPOINTS.pets}${id}/`, body),
  remove: (id: number) =>
    http.delete(`${ENDPOINTS.pets}${id}/`),
}
