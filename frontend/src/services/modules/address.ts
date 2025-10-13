import http from '@/services/http'

export type Country = { id: number; name: string; code?: string }
export type Region  = { id: number; name: string; country: number }
export type City    = { id: number; name: string; region: number }

export type Address = {
  id: number
  country: number | null
  region:  number | null
  city:    number | null
  street?: string | null
  building_number?: string | null
  postal_code?: string | null
}

const BASE = '/pet/'

export const addressApi = {
  listCountries: () => http.get<Country[]>(`${BASE}countries/`),
  listRegions:   (countryId: number) => http.get<Region[]>(`${BASE}regions/`, { params: { country: countryId } }),
  listCities:    (regionId: number)  => http.get<City[]>(`${BASE}cities/`,   { params: { region:  regionId } }),
  createAddress: (payload: Partial<Address>) => http.post<Address>(`${BASE}address/`, payload),
  searchAddress: (q: string) => http.get<{results: Address[]}>(`${BASE}address/`, { params: { search: q } }),
}
