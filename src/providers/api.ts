// src/providers/api.ts
import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type CancelToken,
} from "axios";
import { common } from "../constants/common";

/**
 * Centralized axios API provider for RST
 *
 * Important: builds the final absolute URL itself to avoid axios joining baseURL + url
 * which can produce `...?action=/backofficeLogin`. This file guarantees `...?action=backofficeLogin`.
 */

/* --------------------- Types --------------------- */

export type ApiOk<T = any> = { ok: true; status: number; data: T; headers: any };
export type ApiErr = { ok: false; status: number | null; error: string; details?: any };
export type ApiResult<T = any> = ApiOk<T> | ApiErr;
export type InterceptorId = number;

/* --------------------- Config & Instance --------------------- */

// BASE_URL must include trailing '=' exactly as you requested
const BASE_URL = common.API_BASE_URL;

const defaultConfig: AxiosRequestConfig = {
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

const axiosInstance: AxiosInstance = axios.create(defaultConfig);

/* --------------------- Auth helpers --------------------- */

export const setAuthToken = (token: string | null, useBearer = true) => {
  if (!token) {
    clearAuthToken();
    return;
  }
  const headerValue = useBearer && !token.startsWith("Bearer ") ? `Bearer ${token}` : token;
  axiosInstance.defaults.headers.common["Authorization"] = headerValue;
};

export const clearAuthToken = () => {
  delete axiosInstance.defaults.headers.common["Authorization"];
};

/* --------------------- Interceptor helpers --------------------- */

export const addRequestInterceptor = (
  onFulfilled: (cfg: AxiosRequestConfig) => AxiosRequestConfig | Promise<AxiosRequestConfig>,
  onRejected?: (err: any) => any
): InterceptorId => axiosInstance.interceptors.request.use(onFulfilled, onRejected);

export const addResponseInterceptor = (
  onFulfilled: (res: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>,
  onRejected?: (err: any) => any
): InterceptorId => axiosInstance.interceptors.response.use(onFulfilled, onRejected);

export const removeRequestInterceptor = (id: InterceptorId) =>
  axiosInstance.interceptors.request.eject(id);

export const removeResponseInterceptor = (id: InterceptorId) =>
  axiosInstance.interceptors.response.eject(id);

/* --------------------- Error parsing --------------------- */

const parseAxiosError = (err: unknown): ApiErr => {
  if (!axios.isAxiosError(err)) {
    return { ok: false, status: null, error: String(err) || "Unknown error" };
  }
  const axiosErr = err as AxiosError;
  const status = axiosErr.response?.status ?? null;
  const data: any = axiosErr.response?.data;
  const message =
    (data && (data.message || data.error || data.msg)) ||
    axiosErr.message ||
    "Network or server error";
  return { ok: false, status, error: message, details: data ?? axiosErr.toJSON?.() };
};

/* --------------------- Core request wrapper (FIXED) --------------------- */

/**
 * IMPORTANT:
 * - We compute finalUrl = BASE_URL + (url without any leading slashes)
 * - We call axiosInstance.request with baseURL: undefined and url = finalUrl (absolute) so
 *   axios does not attempt to join baseURL + url and insert an extra "/".
 */
const request = async <T = any>(cfg: AxiosRequestConfig): Promise<ApiResult<T>> => {
  try {
    // determine endpoint string user supplied (e.g. "backofficeLogin" or "/backofficeLogin")
    const suppliedUrl = cfg.url ? String(cfg.url) : "";

    // remove any leading slashes to avoid "=/" issue
    const cleaned = suppliedUrl.replace(/^\/+/, "");

    // compute final absolute url (BASE_URL already has trailing '=')
    const finalUrl = `${BASE_URL}${cleaned}`;

    // clone config but ensure axios won't combine with baseURL again
    const finalConfig: AxiosRequestConfig = {
      ...cfg,
      baseURL: undefined, // explicitly unset to prevent axios from joining
      url: finalUrl,
    };

    const res = await axiosInstance.request<T>(finalConfig);
    return { ok: true, status: res.status, data: res.data as T, headers: res.headers };
  } catch (err) {
    return parseAxiosError(err);
  }
};

/* --------------------- Convenience methods --------------------- */

const apiClient = {
  raw: axiosInstance,

  get: async <T = any>(url: string, cfg?: AxiosRequestConfig) =>
    request<T>({ ...(cfg || {}), url, method: "GET" }),

  post: async <T = any>(url: string, data?: any, cfg?: AxiosRequestConfig) =>
    request<T>({ ...(cfg || {}), url, method: "POST", data }),

  put: async <T = any>(url: string, data?: any, cfg?: AxiosRequestConfig) =>
    request<T>({ ...(cfg || {}), url, method: "PUT", data }),

  patch: async <T = any>(url: string, data?: any, cfg?: AxiosRequestConfig) =>
    request<T>({ ...(cfg || {}), url, method: "PATCH", data }),

  delete: async <T = any>(url: string, cfg?: AxiosRequestConfig) =>
    request<T>({ ...(cfg || {}), url, method: "DELETE" }),
};

export default apiClient;

/* --------------------- Retry helper --------------------- */

export const requestWithRetry = async <T = any>(
  cfg: AxiosRequestConfig,
  retries = 2,
  retryDelayMs = 500
): Promise<ApiResult<T>> => {
  let attempt = 0;
  let lastErr: ApiErr | null = null;

  while (attempt <= retries) {
    const result = await request<T>(cfg);
    if (result.ok) return result;
    if (!result.ok) lastErr = result;
    if (result.status && result.status >= 400 && result.status < 500) break;
    attempt++;
    await new Promise((r) => setTimeout(r, retryDelayMs * attempt));
  }

  return lastErr ?? { ok: false, status: null, error: "Unknown error" };
};

/* --------------------- Cancel token helper --------------------- */

export const createCancelToken = (): { token: CancelToken; cancel: () => void } => {
  const source = axios.CancelToken.source();
  return { token: source.token, cancel: source.cancel };
};

