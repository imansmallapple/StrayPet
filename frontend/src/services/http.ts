import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ENDPOINTS } from './modules/auth';

const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // 建议为 /api
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

const getAccess = () => localStorage.getItem('accessToken');
const getRefresh = () => localStorage.getItem('refreshToken');
const setAccess = (t: string) => localStorage.setItem('accessToken', t);
const clearTokens = () => { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); };

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccess();
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// —— 401 刷新逻辑（去抖，避免并发重复刷新）——
let refreshing: Promise<string> | null = null;

http.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retried?: boolean };
    const status = (error.response && (error.response as any).status) || 0;

    if (status === 401 && !original?._retried) {
      const refresh = getRefresh();
      if (!refresh) { clearTokens(); return Promise.reject(error); }

      original._retried = true;
      refreshing =
        refreshing ||
        http.post<{ access: string }>(ENDPOINTS.refresh, { refresh })
            .then(({ data }) => { setAccess(data.access); return data.access; })
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
