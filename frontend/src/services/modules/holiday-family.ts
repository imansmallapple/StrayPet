// src/services/modules/holiday-family.ts
import http from '@/services/http'

export interface HolidayFamilyApplication {
  fullName: string
  email: string
  phone: string
  country: string
  state: string
  city: string
  postalCode: string
  streetAddress: string
  petCount: number
  petTypes: {
    dogs: boolean
    cats: boolean
    rabbits: boolean
    others: boolean
    othersText: string
  }
  motivation: string
  introduction: string
  idDocument: File | null
  familyPhotos: File[]
  termsAgreed: boolean
}

export interface HolidayFamilyRecord {
  id: number
  user: number
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  petCount: number
  petTypes: string
  motivation: string
  status: 'pending' | 'approved' | 'rejected'
  appliedAt: string
  reviewedAt?: string
  reviewNotes?: string
}

const BASE = '/holiday-family'

export const holidayFamilyApi = {
  // 提交申请
  apply: async (data: HolidayFamilyApplication) => {
    const formData = new FormData()
    
    // 添加基本字段
    formData.append('full_name', data.fullName)
    formData.append('email', data.email)
    formData.append('phone', data.phone)
    formData.append('country', data.country)
    formData.append('state', data.state)
    formData.append('city', data.city)
    formData.append('postal_code', data.postalCode)
    formData.append('street_address', data.streetAddress)
    formData.append('pet_count', data.petCount.toString())
    
    // 添加宠物类型
    formData.append('can_take_dogs', data.petTypes.dogs.toString())
    formData.append('can_take_cats', data.petTypes.cats.toString())
    formData.append('can_take_rabbits', data.petTypes.rabbits.toString())
    formData.append('can_take_others', data.petTypes.othersText)
    
    // 添加文本字段
    formData.append('motivation', data.motivation)
    formData.append('introduction', data.introduction)
    formData.append('terms_agreed', data.termsAgreed.toString())
    
    // 添加文件
    if (data.idDocument) {
      formData.append('id_document', data.idDocument)
    }
    if (data.familyPhotos.length > 0) {
      data.familyPhotos.forEach((file, index) => {
        formData.append(`family_photos_${index}`, file)
      })
    }
    
    return http.post<any>(`${BASE}/apply/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    })
  },

  // 获取申请详情
  getDetail: (id: string) =>
    http.get(`${BASE}/${id}/`),

  // 获取当前用户的申请
  getMyApplication: () =>
    http.get<HolidayFamilyRecord>(`${BASE}/my-application/`),

  // 获取申请列表（仅管理员）
  getList: () =>
    http.get(`${BASE}/`),

  // 批准申请
  approve: (id: string) =>
    http.post(`${BASE}/${id}/approve/`),

  // 拒绝申请
  reject: (id: string, reason: string) =>
    http.post(`${BASE}/${id}/reject/`, { reason }),

  // 获取特定用户的已批准的Holiday Family应用信息
  getUserApplication: (userId: number) =>
    http.get(`${BASE}/user-application/${userId}/`),

  // 编辑Holiday Family应用
  updateApplication: (id: string, data: Partial<HolidayFamilyApplication>) => {
    const formData = new FormData()
    
    // 添加允许编辑的字段
    if (data.phone) formData.append('phone', data.phone)
    if (data.streetAddress) formData.append('street_address', data.streetAddress)
    if (data.city) formData.append('city', data.city)
    if (data.state) formData.append('state', data.state)
    if (data.postalCode) formData.append('postal_code', data.postalCode)
    if (data.motivation) formData.append('motivation', data.motivation)
    if (data.introduction) formData.append('introduction', data.introduction)
    
    return http.patch<any>(`${BASE}/${id}/update_application/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    })
  },

  // 更新照片
  updatePhotos: (id: string, newPhotos: File[] = [], deletePhotoIds: number[] = []) => {
    const formData = new FormData()
    
    // 添加要删除的照片ID
    deletePhotoIds.forEach(photoId => {
      formData.append('delete_photo_ids', photoId.toString())
    })
    
    // 添加新照片
    newPhotos.forEach((file) => {
      formData.append('family_photos', file)
    })
    
    return http.post<any>(`${BASE}/${id}/update_photos/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    })
  },
}
