import http from '@/services/http'

const BASE = '/pet/donation/'

export type DonationCreatePayload = {
  name: string
  species?: string
  breed?: string
  sex?: 'male' | 'female' | 'unknown'
  age_years?: number
  age_months?: number
  description?: string
  address?: number
  // 嵌套地址结构（会被序列化为 JSON）
  address_data?: { country?: string | number; region?: string | number; city?: string | number; street?: string; postal_code?: string }
  dewormed?: boolean
  vaccinated?: boolean
  microchipped?: boolean
  is_stray?: boolean
  contact_phone?: string
  photos?: File[]
}

export function buildDonationFormData(p: DonationCreatePayload): FormData {
  const fd = new FormData()
  if (p.name) fd.append('name', p.name)
  if (p.species) fd.append('species', p.species)
  if (p.breed) fd.append('breed', p.breed)
  if (p.sex) fd.append('sex', p.sex)
  if (p.age_years !== undefined) fd.append('age_years', String(p.age_years))
  if (p.age_months !== undefined) fd.append('age_months', String(p.age_months))
  if (p.description) fd.append('description', p.description)
  if (typeof p.address === 'number') fd.append('address', String(p.address))
  if (p.dewormed !== undefined) fd.append('dewormed', p.dewormed ? 'true' : 'false')
  if (p.vaccinated !== undefined) fd.append('vaccinated', p.vaccinated ? 'true' : 'false')
  if (p.microchipped !== undefined) fd.append('microchipped', p.microchipped ? 'true' : 'false')
  if (p.is_stray !== undefined) fd.append('is_stray', p.is_stray ? 'true' : 'false')
  if (p.contact_phone) fd.append('contact_phone', p.contact_phone)
  if (Array.isArray(p.photos)) {
    p.photos.forEach(f => fd.append('photos', f))
  }
  if (p.address_data) {
    fd.append('address_data', JSON.stringify(p.address_data))
  }
  return fd
}

export const donationApi = {
  list: (params = {}) => http.get(BASE, { params }),
  retrieve: (id: number) => http.get(`${BASE}${id}/`),
  create: (data: FormData | DonationCreatePayload) => {
    const body = data instanceof FormData ? data : buildDonationFormData(data)
    return http.post(BASE, body)
  },
}
