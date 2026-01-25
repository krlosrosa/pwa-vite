// axios-instance.ts
import axios from 'axios';
import type { AxiosRequestConfig, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { keycloak } from '../../auth/keycloak-config';
import { getToken as getStoredToken, hasValidToken } from '../../auth/token-storage';

export const AXIOS_INSTANCE = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/*export const AXIOS_INSTANCE = axios.create({
  baseURL: '/api/proxy/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});*/

// Axios interceptor to automatically inject Bearer token from Keycloak
AXIOS_INSTANCE.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // DEBUG: Log request details for info-me endpoint
    if (config.url?.includes('/api/user/info-me')) {
      console.log('[DEBUG-AXIOS-REQUEST] ========================================');
      console.log('[DEBUG-AXIOS-REQUEST] URL:', config.url);
      console.log('[DEBUG-AXIOS-REQUEST] Full URL:', `${config.baseURL}${config.url}`);
      console.log('[DEBUG-AXIOS-REQUEST] Method:', config.method);
      console.log('[DEBUG-AXIOS-REQUEST] Headers:', JSON.stringify(config.headers, null, 2));
      console.log('[DEBUG-AXIOS-REQUEST] Keycloak authenticated:', keycloak.authenticated);
      console.log('[DEBUG-AXIOS-REQUEST] Keycloak has token:', !!keycloak.token);
    }
    
    let token: string | null = null;

    // Try to get token from Keycloak first
    if (keycloak.authenticated || keycloak.token) {
      try {
        // Check if token needs refresh (expires within 30 seconds)
        if (keycloak.isTokenExpired(30)) {
          await keycloak.updateToken(30);
        }
        
        if (keycloak.token) {
          token = keycloak.token;
          if (config.url?.includes('/api/user/info-me')) {
            console.log('[DEBUG-AXIOS-REQUEST] Token from Keycloak (first 20 chars):', token.substring(0, 20) + '...');
          }
        }
      } catch (error) {
        console.error('[axios] Failed to refresh token:', error);
        // Token refresh failed, but continue with request (it might still be valid)
        if (keycloak.token) {
          token = keycloak.token;
        }
      }
    }

    // Fallback: Try to get token from localStorage (offline-first approach)
    if (!token && hasValidToken()) {
      const storedToken = getStoredToken();
      if (storedToken) {
        token = storedToken;
        if (config.url?.includes('/api/user/info-me')) {
          console.log('[DEBUG-AXIOS-REQUEST] Token from localStorage (first 20 chars):', token.substring(0, 20) + '...');
        }
      }
    }

    // Add Bearer token to Authorization header if available
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.url?.includes('/api/user/info-me')) {
      console.warn('[DEBUG-AXIOS-REQUEST] ⚠️ NO TOKEN FOUND! Request will likely fail.');
    }
    
    // Only set Content-Type if not already set and if it's a POST/PUT/PATCH request
    // GET requests don't need Content-Type, and multipart/form-data should be set explicitly
    if (!config.headers['Content-Type'] && config.method && ['post', 'put', 'patch'].includes(config.method.toLowerCase())) {
      // Check if it's FormData
      if (config.data instanceof FormData) {
        // Don't set Content-Type for FormData - browser will set it with boundary
        delete config.headers['Content-Type'];
      } else {
        config.headers['Content-Type'] = 'application/json';
      }
    }
    
    if (config.url?.includes('/api/user/info-me')) {
      console.log('[DEBUG-AXIOS-REQUEST] Final config headers:', JSON.stringify(config.headers, null, 2));
      console.log('[DEBUG-AXIOS-REQUEST] ========================================');
    }
    
    return config;
  },
  (error) => {
    console.error('[DEBUG-AXIOS-REQUEST] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for debug
AXIOS_INSTANCE.interceptors.response.use(
  (response) => {
    // DEBUG: Log response details for info-me endpoint
    if (response.config.url?.includes('/api/user/info-me')) {
      console.log('[DEBUG-AXIOS-RESPONSE] ========================================');
      console.log('[DEBUG-AXIOS-RESPONSE] URL:', response.config.url);
      console.log('[DEBUG-AXIOS-RESPONSE] Status:', response.status);
      console.log('[DEBUG-AXIOS-RESPONSE] Status Text:', response.statusText);
      console.log('[DEBUG-AXIOS-RESPONSE] Headers:', JSON.stringify(response.headers, null, 2));
      console.log('[DEBUG-AXIOS-RESPONSE] Response Type:', response.config.responseType);
      console.log('[DEBUG-AXIOS-RESPONSE] Response Data Type:', typeof response.data);
      console.log('[DEBUG-AXIOS-RESPONSE] Response Data:', response.data);
      console.log('[DEBUG-AXIOS-RESPONSE] Response Data (stringified):', JSON.stringify(response.data, null, 2));
      console.log('[DEBUG-AXIOS-RESPONSE] Response Data Keys:', Object.keys(response.data || {}));
      
      // Deep inspection of roles field
      if (response.data) {
        console.log('[DEBUG-AXIOS-RESPONSE] Has roles property:', 'roles' in response.data);
        console.log('[DEBUG-AXIOS-RESPONSE] Roles value:', response.data.roles);
        console.log('[DEBUG-AXIOS-RESPONSE] Roles type:', typeof response.data.roles);
        console.log('[DEBUG-AXIOS-RESPONSE] Roles is array:', Array.isArray(response.data.roles));
        console.log('[DEBUG-AXIOS-RESPONSE] Roles is null:', response.data.roles === null);
        console.log('[DEBUG-AXIOS-RESPONSE] Roles is undefined:', response.data.roles === undefined);
        
        // Check all properties
        console.log('[DEBUG-AXIOS-RESPONSE] All properties:', Object.keys(response.data));
        console.log('[DEBUG-AXIOS-RESPONSE] Full object structure:', JSON.stringify(response.data, null, 2));
      }
      
      console.log('[DEBUG-AXIOS-RESPONSE] ========================================');
    }
    
    return response;
  },
  (error) => {
    // DEBUG: Log error details for info-me endpoint
    if (error.config?.url?.includes('/api/user/info-me')) {
      console.error('[DEBUG-AXIOS-RESPONSE-ERROR] ========================================');
      console.error('[DEBUG-AXIOS-RESPONSE-ERROR] URL:', error.config?.url);
      console.error('[DEBUG-AXIOS-RESPONSE-ERROR] Error:', error);
      console.error('[DEBUG-AXIOS-RESPONSE-ERROR] Error Message:', error.message);
      console.error('[DEBUG-AXIOS-RESPONSE-ERROR] Error Response Status:', error.response?.status);
      console.error('[DEBUG-AXIOS-RESPONSE-ERROR] Error Response Data:', error.response?.data);
      console.error('[DEBUG-AXIOS-RESPONSE-ERROR] Error Response Headers:', error.response?.headers);
      console.error('[DEBUG-AXIOS-RESPONSE-ERROR] ========================================');
    }
    return Promise.reject(error);
  }
);

// cliente compatível com a assinatura do customInstance
export const axiosFetcher = async <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const source = axios.CancelToken.source();

  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
    headers: {
      ...config.headers,
      ...options?.headers,
      // Token is now automatically injected by the interceptor
    },
    cancelToken: source.token,
  }).then(({ data }) => data as T);

  // permite cancelar (igual ao customInstance)
  // @ts-ignore
  promise.cancel = () => {
    source.cancel('Query was cancelled');
  };

  return promise;
};

// Tipos extras para compatibilidade
export type ErrorType<Error> = AxiosError<Error>;
export type BodyType<BodyData> = BodyData;
