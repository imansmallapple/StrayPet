// src/services/modules/shelter.ts
import http from '@/services/http'

/** Shelter 列表/详情对象 */
export type Shelter = {
  id: number
  name: string
  description?: string
  
  // Contact
  email?: string
  phone?: string
  website?: string
  
  // Address
  address?: number
  street?: string
  building_number?: string
  city?: string
  region?: string
  country?: string
  postal_code?: string
  latitude?: number
  longitude?: number
  
  // Images
  logo_url?: string | null
  cover_url?: string | null
  
  // Capacity
  capacity: number
  current_animals: number
  available_capacity?: number
  occupancy_rate?: number
  
  // Operation
  founded_year?: number | null
  is_verified: boolean
  is_active: boolean
  
  // Social media
  facebook_url?: string
  instagram_url?: string
  twitter_url?: string
  
  // System
  created_by?: number
  created_by_username?: string
  created_at?: string
  updated_at?: string
}

export type PageResp<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

const BASE = '/pet/shelter/'

export type ShelterCreatePayload = {
  name: string
  description?: string
  email?: string
  phone?: string
  website?: string
  
  address?: number
  address_data?: {
    country?: string
    region?: string
    city?: string
    street?: string
    building_number?: string
    postal_code?: string
    latitude?: number
    longitude?: number
    country_code?: string
  }
  
  logo?: File
  cover_image?: File
  
  capacity?: number
  current_animals?: number
  founded_year?: number
  is_verified?: boolean
  is_active?: boolean
  
  facebook_url?: string
  instagram_url?: string
  twitter_url?: string
}

/** 构建 FormData (multipart/form-data) */
export function buildShelterFormData(payload: ShelterCreatePayload): FormData {
  const fd = new FormData()
  
  if (payload.name) fd.append('name', payload.name)
  if (payload.description) fd.append('description', payload.description)
  if (payload.email) fd.append('email', payload.email)
  if (payload.phone) fd.append('phone', payload.phone)
  if (payload.website) fd.append('website', payload.website)
  
  if (payload.address !== undefined) {
    fd.append('address', String(payload.address))
  }
  
  if (payload.address_data) {
    fd.append('address_data', JSON.stringify(payload.address_data))
  }
  
  if (payload.logo) fd.append('logo', payload.logo)
  if (payload.cover_image) fd.append('cover_image', payload.cover_image)
  
  if (payload.capacity !== undefined) {
    fd.append('capacity', String(payload.capacity))
  }
  if (payload.current_animals !== undefined) {
    fd.append('current_animals', String(payload.current_animals))
  }
  if (payload.founded_year !== undefined && payload.founded_year !== null) {
    fd.append('founded_year', String(payload.founded_year))
  }
  
  if (payload.is_verified !== undefined) {
    fd.append('is_verified', payload.is_verified ? 'true' : 'false')
  }
  if (payload.is_active !== undefined) {
    fd.append('is_active', payload.is_active ? 'true' : 'false')
  }
  
  if (payload.facebook_url) fd.append('facebook_url', payload.facebook_url)
  if (payload.instagram_url) fd.append('instagram_url', payload.instagram_url)
  if (payload.twitter_url) fd.append('twitter_url', payload.twitter_url)
  
  return fd
}

/** Shelter API */
export const shelterApi = {
  /** 列表 */
  list(params?: { is_active?: boolean; page?: number; page_size?: number }) {
    return http.get<PageResp<Shelter>>(BASE, { params })
  },

  /** 详情 */
  detail(id: number) {
    return http.get<Shelter>(`${BASE}${id}/`)
  },

  /** 创建 */
  create(payload: ShelterCreatePayload) {
    const formData = buildShelterFormData(payload)
    return http.post<Shelter>(BASE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  /** 更新 */
  update(id: number, payload: Partial<ShelterCreatePayload>) {
    const formData = buildShelterFormData(payload as ShelterCreatePayload)
    return http.patch<Shelter>(`${BASE}${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  /** 删除 */
  delete(id: number) {
    return http.delete(`${BASE}${id}/`)
  }
}
