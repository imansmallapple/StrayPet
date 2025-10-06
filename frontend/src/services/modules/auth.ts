import http from '@/services/http'

const baseURL: string = 'http://localhost:8000/user/'

const saved = localStorage.getItem('accessToken')
if (saved) setAccessHeader(saved)

export const ENDPOINTS = {
  // DRF SimpleJWT（登录/刷新）
  login: baseURL + 'token/',            // POST {username,password} -> {access,refresh}
  refresh: baseURL + 'token/refresh/',  // POST {refresh}           -> {access}

  // 注册（两种三选一：Djoser / 你自己的 DRF 路由）
  // Djoser:
  register: baseURL + 'register/',
  // 如果没有 Djoser，用你的 DRF 路径（示例）：
  // register: 'users/register/',
  resetRequest: baseURL + 'password/reset/request/',     

  resetConfirm: baseURL + 'password/reset/confirm/',        

  sendEmailCode: baseURL + 'send_email_code/',

  captcha: baseURL + 'captcha/',
   
  me: baseURL + 'me/',
   
}

export function setAccessHeader(token?: string) {
  if (token) {
    (http as any).defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete (http as any).defaults.headers.common.Authorization
  }
}

export const authApi = {
  login: (body: LoginBody) => http.post<LoginResp>(ENDPOINTS.login, body),
  
  refresh: (body: { refresh: string }) => http.post<{ access: string }>(ENDPOINTS.refresh, body),
  
 register: (body: RegisterBody) => http.post<RegisterResp>(ENDPOINTS.register, body),
  
  // 忘记密码：发码
  requestReset: (body: { email: string }) => http.post(ENDPOINTS.resetRequest, body),
  // 忘记密码：确认
  confirmReset: (body: { email: string; code: string; new_password: string; re_new_password: string }) =>
    http.post(ENDPOINTS.resetConfirm, body),

  sendEmailCode: (email: string) => http.post(ENDPOINTS.sendEmailCode, { email }),
  getCaptcha: () => http.get<CaptchaResp>(ENDPOINTS.captcha),

  getMe: () => http.get<UserMe>(ENDPOINTS.me),
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
}