// axios-instance.ts
import axios from 'axios';
import type { AxiosRequestConfig, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { keycloak } from '../../auth/keycloak-config';
import { getToken as getStoredToken, hasValidToken } from '../../auth/token-storage';

export const AXIOS_INSTANCE = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

/*export const AXIOS_INSTANCE = axios.create({
  baseURL: '/api/proxy/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});*/

// Axios interceptor to automatically inject Bearer token from Keycloak and selected center
AXIOS_INSTANCE.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
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
        }
      } catch (error) {
        console.error('Failed to refresh token:', error);
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
      }
    }

    // Add Bearer token to Authorization header if available
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add selected center to headers if available
    // This allows the backend to filter data by center
    try {
      const selectedCenter = localStorage.getItem('selectedCenter');
      if (selectedCenter) {
        config.headers['X-Center'] = selectedCenter;
      }
    } catch (error) {
      // Silent fail - center header is optional
      console.warn('Failed to add center header:', error);
    }

    return config;
  },
  (error) => {
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
