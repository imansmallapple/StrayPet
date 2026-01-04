// src/services/modules/adopt.ts
import http from '@/services/http'

const baseURL = 'http://localhost:8000/' // 和你 auth.ts 一致；若你改回了 /api 代理，这里就写 'pets/' 即可

export type Pet = {
  id: number
  name: string
  species?: string
  breed?: string
  sex?: string
  age_years?: number
  age_months?: number
  city?: string
  address?: string
  address_display?: string
  description?: string
  status?: 'AVAILABLE' | 'PENDING' | 'ADOPTED' | 'LOST' | 'DRAFT' | 'ARCHIVED' | string
  photo?: string | null
  photos?: string[]
  add_date?: string
  pub_date?: string
  created_by?: { id?: number; username?: string } | number
  address_lat?: number
  address_lon?: number
  is_favorited?: boolean
  favorites_count?: number
  
  // Health and traits
  dewormed?: boolean
  vaccinated?: boolean
  microchipped?: boolean
  child_friendly?: boolean
  trained?: boolean
  loves_play?: boolean
  loves_walks?: boolean
  good_with_dogs?: boolean
  good_with_cats?: boolean
  affectionate?: boolean
  needs_attention?: boolean
  sterilized?: boolean
  contact_phone?: string
  
  // Shelter information
  shelter_name?: string
  shelter_address?: string
  shelter_phone?: string
  shelter_website?: string
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
  // 领养申请：POST /pet/:id/apply/  body: { message?: string }
  apply: (id: number, message?: string) => {
    const body = message ? { message } : {} // exactOptionalPropertyTypes 下不要传 undefined
    return http.post<{ ok: boolean; application_id: number }>(`${ENDPOINTS.pets}${id}/apply/`, body)
  },
  favorite: (id: number) =>
    http.post<{ favorited: boolean; count: number }>(`${ENDPOINTS.pets}${id}/favorite/`, {}),
  unfavorite: (id: number) =>
    http.delete<{ favorited: boolean; count: number }>(`${ENDPOINTS.pets}${id}/unfavorite/`),
  myFavorites: (params?: PetListParams) =>
    http.get<Paginated<Pet>>(`${ENDPOINTS.pets}favorites/`, { params }),
  myPets: (params?: PetListParams) =>
    http.get<Paginated<Pet>>(`${ENDPOINTS.pets}my_pets/`, { params }),
}
