// src/services/http.ts
import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ENDPOINTS } from './modules/auth';

const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // 建议设为 'http://localhost:8000'
  timeout: 10000,
  // ⚠️ 不要在这里写死 'Content-Type': 'application/json'
});

// === token 读写 ===
const getAccess = () => localStorage.getItem('accessToken');
const getRefresh = () => localStorage.getItem('refreshToken');
const setAccess = (t: string) => localStorage.setItem('accessToken', t);
const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// === 请求拦截：自动加 Authorization；FormData 时移除 Content-Type 让浏览器接管 ===
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccess();
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }

  // 关键：表单上传不能写死 application/json
  const isForm = typeof FormData !== 'undefined' && config.data instanceof FormData;
  if (isForm && config.headers) {
    delete (config.headers as any)['Content-Type'];
  }

  return config;
});

// === 401 刷新：去抖，避免并发重复 ===
let refreshing: Promise<string> | null = null;

http.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = (error.response && (error.response as any).status) || 0;

    if (status === 401 && original && !original._retried) {
      const refresh = getRefresh();
      if (!refresh) {
        clearTokens();
        return Promise.reject(error);
      }

      original._retried = true;

      refreshing =
        refreshing ||
        axios.post<{ access: string }>(ENDPOINTS.refresh, { refresh }) // 注意：用 axios 直发，避免被同一实例再拦截
             .then(({ data }) => {
               setAccess(data.access);
               return data.access;
             })
             .finally(() => { refreshing = null; });

      try {
        const newAccess = await refreshing;
        original.headers = original.headers || {};
        (original.headers as any).Authorization = `Bearer ${newAccess}`;
        return http(original);
      } catch (e) {
        clearTokens();
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  }
);

export default http;
