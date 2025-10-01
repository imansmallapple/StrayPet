import http from '@/services/http'

const baseURL: string = 'http://localhost:8000/'

export const ENDPOINTS = {
  // DRF SimpleJWT（登录/刷新）
  login: baseURL + 'token/',            // POST {username,password} -> {access,refresh}
  refresh: baseURL + 'token/refresh/',  // POST {refresh}           -> {access}

  // 注册（两种三选一：Djoser / 你自己的 DRF 路由）
  // Djoser:
  register: baseURL + 'register/',
  // 如果没有 Djoser，用你的 DRF 路径（示例）：
  // register: 'users/register/',
  resetRequest: baseURL + 'auth/users/reset_password/',               // POST { email }
  
  resetConfirm: baseURL + 'auth/users/reset_password_confirm/',       // POST { uid, token, new_password, re_new_password }

   sendEmailCode: baseURL + 'send_email_code/',

   captcha: baseURL + 'captcha/',
   
}

export const authApi = {
  login: (body: LoginBody) => http.post<LoginResp>(ENDPOINTS.login, body),
  
  refresh: (body: { refresh: string }) => http.post<{ access: string }>(ENDPOINTS.refresh, body),
  
 register: (body: RegisterBody) => http.post<RegisterResp>(ENDPOINTS.register, body),
  
  // ← 新增：申请重置邮件
  requestReset: (body: { email: string }) =>
    http.post(ENDPOINTS.resetRequest, body),

  // ← 新增：确认重置（带 uid/token）
  confirmReset: (body: { uid: string; token: string; new_password: string; re_new_password: string }) =>
    http.post(ENDPOINTS.resetConfirm, body),

  sendEmailCode: (email: string) => http.post(ENDPOINTS.sendEmailCode, { email }),
  getCaptcha: () => http.get<CaptchaResp>(ENDPOINTS.captcha),
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


