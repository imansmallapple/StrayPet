// src/services/modules/auth.ts
import http from '@/services/http'

const baseURL = 'http://localhost:8000/user/'

export const ENDPOINTS = {
  login:   baseURL + 'token/',
  refresh: baseURL + 'token/refresh/',
  register: baseURL + 'register/',
  resetRequest: baseURL + 'password/reset/request/',
  resetConfirm: baseURL + 'password/reset/confirm/',
  sendEmailCode: baseURL + 'send_email_code/',
  captcha: baseURL + 'captcha/',
  me: baseURL + 'me/',
  // 你后端当前返回“个人详情”的路由（若不同，自行改为你后端真实可用的）
  detail: baseURL + 'detail/',   // ← 这里用于 Profile 页面
}

export function setAccessHeader(token?: string) {
  if (token) {
    (http as any).defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete (http as any).defaults.headers.common.Authorization
  }
}

export const authApi = {
  login:   (body: LoginBody) => http.post<LoginResp>(ENDPOINTS.login, body),
  refresh: (body: { refresh: string }) => http.post<{ access: string }>(ENDPOINTS.refresh, body),

  register: (body: RegisterBody) => http.post<RegisterResp>(ENDPOINTS.register, body),
  requestReset: (body: { email: string }) => http.post(ENDPOINTS.resetRequest, body),
  confirmReset: (body: { email: string; code: string; new_password: string; re_new_password: string }) =>
    http.post(ENDPOINTS.resetConfirm, body),

  sendEmailCode: (email: string) => http.post(ENDPOINTS.sendEmailCode, { email }),
  getCaptcha: () => http.get<CaptchaResp>(ENDPOINTS.captcha),

  getMe: () => http.get<UserMe>(ENDPOINTS.me),
  getProfile: () => http.get<UserMe>(ENDPOINTS.detail),
  updateProfile: (data: Partial<UserMe>) => http.patch<UserMe>(ENDPOINTS.me, data),
}

export type LoginBody = {
  username: string
  password: string
  captcha: string
  uid: string
}
export type LoginResp = { access: string; refresh?: string }
export type RegisterBody = {
  username: string
  email: string
  password: string
  password1: string
  code: string
}
export type RegisterResp = { tokens?: { access: string; refresh?: string } }
export type CaptchaResp = { uid: string; image: string }

export type UserMe = {
  id: number
  username: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  preferred_species?: string
  preferred_size?: string
  preferred_age_min?: number
  preferred_age_max?: number
  preferred_gender?: string
  has_experience?: boolean
  living_situation?: string
  has_yard?: boolean
  other_pets?: string
  additional_notes?: string
}
