// src/services/modules/lost.ts
import http from '@/services/http'

export type LostPet = {
  id: number
  name: string
  species?: string
  breed?: string
  age_months?: number
  sex?: 'M' | 'F' | 'U'
  color?: string
  description?: string
  pub_date?: string
  address?: string | { full?: string }
  cover?: string
}

export type PageResp<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

const BASE = '/pet/lost/'

// 创建时我们只需要 name，其他字段都可选
export type LostCreatePayload = {
  name: string
  species?: string
  breed?: string
  color?: string
  description?: string
  address?: string
  age_months?: number     // 注意：不要传 undefined；没有就不要放这个 key
  sex?: 'M' | 'F' | 'U'
}

export const lostApi = {
  list: (params: { page?: number; page_size?: number; ordering?: string; search?: string } = {}) =>
    http.get<PageResp<LostPet>>(BASE, { params }),

  retrieve: (id: number) => http.get<LostPet>(`${BASE}${id}/`),

  create: (data: LostCreatePayload) => http.post(BASE, data),

  update: (id: number, data: Partial<LostCreatePayload>) => http.patch(`${BASE}${id}/`, data),

  remove: (id: number) => http.delete(`${BASE}${id}/`),
}
