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
  city?: string
  region?: string
  country?: string

  lost_time: string
  description?: string
  reward?: string | number | null

  photo?: string | null
  photo_url?: string | null

  status?: 'open' | 'found' | 'closed'
  reporter?: number
  reporter_username?: string
  contact_phone?: string
  contact_email?: string
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
  status?: 'open' | 'found' | 'closed'
  address_data?: {
    country?: string | null
    region?: string | null
    city?: string | null
    street?: string | null
    building_number?: string | null
    postal_code?: string | null
    lat?: number | null
    lng?: number | null
  }
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
  
  // Handle address or address_data
  if (typeof p.address === 'number') {
    fd.append('address', String(p.address))
  } else if ((p as any).address_data) {
    // Only send address_data if it has non-null/non-empty values
    const addressData = (p as any).address_data
    const hasAddressData = Object.values(addressData).some(v => v !== null && v !== '' && v !== undefined)
    if (hasAddressData) {
      fd.append('address_data', JSON.stringify(addressData))
    }
  }
  
  if (p.lost_time) {
    // Ensure lost_time is properly formatted for Django
    // It should be an ISO format string, optionally with Z suffix
    let lostTime = p.lost_time
    if (typeof lostTime === 'string' && !lostTime.includes('Z')) {
      // If datetime is missing Z suffix, add it
      lostTime = lostTime.endsWith(':00') ? `${lostTime}Z` : `${lostTime}Z`
    }
    fd.append('lost_time', lostTime)
  }
  if (p.description) fd.append('description', p.description)
  if (p.reward !== undefined && p.reward !== null && p.reward !== '') {
    fd.append('reward', String(p.reward))
  }
  if (p.photo instanceof File) fd.append('photo', p.photo)
  
  // Handle status field
  if ((p as any).status) {
    fd.append('status', (p as any).status)
  }
  
  return fd
}

export const lostApi = {
  list: (params: { page?: number; page_size?: number; ordering?: string; search?: string; status?: string } = {}) =>
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
