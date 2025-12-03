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
  address_data?: {
    country?: string | number
    region?: string | number
    city?: string | number
    street?: string
    postal_code?: string
    latitude?: number
    longitude?: number
  }
  dewormed?: boolean
  vaccinated?: boolean
  microchipped?: boolean
  is_stray?: boolean
  contact_phone?: string
  photos?: File[]
  // Additional traits
  sterilized?: boolean
  child_friendly?: boolean
  trained?: boolean
  loves_play?: boolean
  loves_walks?: boolean
  good_with_dogs?: boolean
  good_with_cats?: boolean
  affectionate?: boolean
  needs_attention?: boolean
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
  if (p.sterilized !== undefined) fd.append('sterilized', p.sterilized ? 'true' : 'false')
  if (p.child_friendly !== undefined) fd.append('child_friendly', p.child_friendly ? 'true' : 'false')
  if (p.trained !== undefined) fd.append('trained', p.trained ? 'true' : 'false')
  if (p.loves_play !== undefined) fd.append('loves_play', p.loves_play ? 'true' : 'false')
  if (p.loves_walks !== undefined) fd.append('loves_walks', p.loves_walks ? 'true' : 'false')
  if (p.good_with_dogs !== undefined) fd.append('good_with_dogs', p.good_with_dogs ? 'true' : 'false')
  if (p.good_with_cats !== undefined) fd.append('good_with_cats', p.good_with_cats ? 'true' : 'false')
  if (p.affectionate !== undefined) fd.append('affectionate', p.affectionate ? 'true' : 'false')
  if (p.needs_attention !== undefined) fd.append('needs_attention', p.needs_attention ? 'true' : 'false')
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
