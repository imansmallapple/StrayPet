// src/services/modules/lost.ts
import http from '@/services/http'

/** Lost 列表/详情对象（对齐后端 LostSerializer 字段） */
export type LostPet = {
  id: number
  pet_name?: string
  species: string
  breed?: string
  color?: string
  sex: 'male' | 'female'
  size?: string

  address?: number | string | { id?: number; full?: string }

  lost_time: string
  description?: string
  reward?: string | number | null

  photo?: string | null
  photo_url?: string | null

  status?: 'open' | 'found' | 'closed'
  reporter?: number
  reporter_username?: string
  created_at?: string
  updated_at?: string
}

export type PageResp<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

const BASE = '/pet/lost/'

export type LostCreatePayload = {
  pet_name?: string
  species: string
  breed?: string
  color?: string
  sex: 'male' | 'female'
  size?: string
  address: number
  lost_time: string
  description?: string
  reward?: string | number
  photo?: File | null
}

export type LostUpdatePayload = Partial<LostCreatePayload>

/** 构建 multipart/form-data 体 */
export function buildLostFormData(p: LostCreatePayload | LostUpdatePayload): FormData {
  const fd = new FormData()
  if (p.pet_name) fd.append('pet_name', p.pet_name)
  if (p.species) fd.append('species', p.species)
  if (p.breed) fd.append('breed', p.breed)
  if (p.color) fd.append('color', p.color)
  if (p.sex) fd.append('sex', p.sex)
  if (p.size) fd.append('size', p.size)
  if (typeof p.address === 'number') fd.append('address', String(p.address))
  if (p.lost_time) fd.append('lost_time', p.lost_time)
  if (p.description) fd.append('description', p.description)
  if (p.reward !== undefined && p.reward !== null && p.reward !== '') {
    fd.append('reward', String(p.reward))
  }
  if (p.photo instanceof File) fd.append('photo', p.photo)
  return fd
}

export const lostApi = {
  list: (params: { page?: number; page_size?: number; ordering?: string; search?: string } = {}) =>
    http.get<PageResp<LostPet>>(BASE, { params }),

  retrieve: (id: number) => http.get<LostPet>(`${BASE}${id}/`),

  create: (data: FormData | LostCreatePayload) => {
    const body = data instanceof FormData ? data : buildLostFormData(data)
    return http.post(BASE, body)
  },

  update: (id: number, data: FormData | LostUpdatePayload) => {
    const body = data instanceof FormData ? data : buildLostFormData(data)
    return http.patch(`${BASE}${id}/`, body)
  },

  remove: (id: number) => http.delete(`${BASE}${id}/`),
}
