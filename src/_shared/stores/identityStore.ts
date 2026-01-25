import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { InfoMeDtoOutput } from '@/_services/api/model';
import { AXIOS_INSTANCE } from '@/_services/http/axios.http';

const STORAGE_KEY_SELECTED_CENTER = 'selectedCenter';

interface IdentityState {
  // User info from info-me endpoint
  user: InfoMeDtoOutput | null;
  
  // Available centers extracted from roles
  availableCenters: string[];
  
  // Currently selected center
  selectedCenter: string | null;
  
  // Loading state
  isLoading: boolean;
  
  // Error state
  error: Error | null;
  
  // Actions
  fetchUserInfo: () => Promise<void>;
  setSelectedCenter: (center: string) => void;
  clearIdentity: () => void;
}

/**
 * Normalizes roles to always be an array.
 * Handles cases where roles might be null, undefined, string, or already an array.
 */
function normalizeRoles(roles: unknown): string[] {
  if (!roles) {
    console.warn('[identityStore] Roles is null/undefined, returning empty array');
    return [];
  }
  
  if (Array.isArray(roles)) {
    return roles.filter((r): r is string => typeof r === 'string');
  }
  
  if (typeof roles === 'string') {
    return [roles];
  }
  
  console.warn('[identityStore] Roles is not an array or string, type:', typeof roles, 'value:', roles);
  return [];
}

/**
 * Extracts unique centers from roles.
 * Roles format: "admin:expedicao:pavuna" -> extracts "pavuna"
 */
function extractCentersFromRoles(roles: unknown): string[] {
  // Normalize roles to array first
  const rolesArray = normalizeRoles(roles);
  
  if (rolesArray.length === 0) {
    console.warn('[identityStore] No valid roles found after normalization');
    return [];
  }
  
  const centers = new Set<string>();
  
  for (const role of rolesArray) {
    if (typeof role !== 'string') {
      console.warn('[identityStore] Invalid role type:', typeof role, role);
      continue;
    }
    
    const parts = role.split(':');
    if (parts.length > 0) {
      // Extract the LAST element (the center)
      const center = parts[parts.length - 1].trim();
      if (center) {
        centers.add(center);
      }
    }
  }
  
  return Array.from(centers).sort();
}

export const useIdentityStore = create<IdentityState>()(
  persist(
    (set) => ({
      user: null,
      availableCenters: [],
      selectedCenter: null,
      isLoading: false,
      error: null,

      fetchUserInfo: async () => {
        console.log('[DEBUG-IDENTITY-STORE] ========================================');
        console.log('[DEBUG-IDENTITY-STORE] Starting fetchUserInfo...');
        console.log('[DEBUG-IDENTITY-STORE] Base URL:', import.meta.env.VITE_API_URL);
        console.log('[DEBUG-IDENTITY-STORE] Full endpoint:', `${import.meta.env.VITE_API_URL}/api/user/info-me`);
        
        set({ isLoading: true, error: null });
        
        try {
          // Call info-me endpoint
          // Note: If Orval hook becomes available, replace this with:
          // const { data } = await useInfoMe();
          console.log('[DEBUG-IDENTITY-STORE] Making request to /api/user/info-me...');
          
          const response = await AXIOS_INSTANCE.get<InfoMeDtoOutput>('/api/user/info-me');
          
          console.log('[DEBUG-IDENTITY-STORE] ========================================');
          console.log('[DEBUG-IDENTITY-STORE] Response received!');
          console.log('[DEBUG-IDENTITY-STORE] Response status:', response.status);
          console.log('[DEBUG-IDENTITY-STORE] Response headers:', JSON.stringify(response.headers, null, 2));
          console.log('[DEBUG-IDENTITY-STORE] Response data type:', typeof response.data);
          
          // Validação crítica: verificar se a resposta é HTML
          if (typeof response.data === 'string' && (
            response.data.trim().startsWith('<!DOCTYPE') ||
            response.data.trim().startsWith('<html')
          )) {
            console.error('[DEBUG-IDENTITY-STORE] ❌ ERRO: Resposta é HTML em vez de JSON!');
            console.error('[DEBUG-IDENTITY-STORE] BaseURL usada:', response.config.baseURL || AXIOS_INSTANCE.defaults.baseURL);
            console.error('[DEBUG-IDENTITY-STORE] URL completa:', `${response.config.baseURL || ''}${response.config.url || ''}`);
            console.error('[DEBUG-IDENTITY-STORE] Primeiros 200 caracteres da resposta HTML:', response.data.substring(0, 200));
            throw new Error('API retornou HTML em vez de JSON. A baseURL pode estar incorreta ou a requisição está sendo interceptada.');
          }
          
          // Validar se é um objeto válido
          if (!response.data || typeof response.data !== 'object') {
            console.error('[DEBUG-IDENTITY-STORE] ❌ ERRO: Resposta não é um objeto válido!');
            console.error('[DEBUG-IDENTITY-STORE] Tipo recebido:', typeof response.data);
            console.error('[DEBUG-IDENTITY-STORE] Valor recebido:', response.data);
            throw new Error('API retornou dados inválidos. Esperado objeto JSON.');
          }
          
          console.log('[DEBUG-IDENTITY-STORE] Response data:', response.data);
          console.log('[DEBUG-IDENTITY-STORE] Response data (raw):', JSON.stringify(response.data, null, 2));
          
          const userInfo = response.data;
          
          // Debug logs to understand API response in production
          console.log('[DEBUG-IDENTITY-STORE] ========================================');
          console.log('[DEBUG-IDENTITY-STORE] Processing userInfo...');
          console.log('[DEBUG-IDENTITY-STORE] Has data:', !!userInfo);
          console.log('[DEBUG-IDENTITY-STORE] User ID:', userInfo?.id);
          console.log('[DEBUG-IDENTITY-STORE] User Name:', userInfo?.name);
          console.log('[DEBUG-IDENTITY-STORE] Empresa:', userInfo?.empresa);
          console.log('[DEBUG-IDENTITY-STORE] ========================================');
          console.log('[DEBUG-IDENTITY-STORE] ROLES ANALYSIS:');
          console.log('[DEBUG-IDENTITY-STORE] - Has roles property:', 'roles' in (userInfo || {}));
          console.log('[DEBUG-IDENTITY-STORE] - Roles value:', userInfo?.roles);
          console.log('[DEBUG-IDENTITY-STORE] - Roles type:', typeof userInfo?.roles);
          console.log('[DEBUG-IDENTITY-STORE] - Roles is null:', userInfo?.roles === null);
          console.log('[DEBUG-IDENTITY-STORE] - Roles is undefined:', userInfo?.roles === undefined);
          console.log('[DEBUG-IDENTITY-STORE] - Roles is array:', Array.isArray(userInfo?.roles));
          console.log('[DEBUG-IDENTITY-STORE] - Roles length:', Array.isArray(userInfo?.roles) ? userInfo.roles.length : 'N/A');
          
          // Check all properties in userInfo
          if (userInfo && typeof userInfo === 'object') {
            console.log('[DEBUG-IDENTITY-STORE] All properties in userInfo:', Object.keys(userInfo));
            console.log('[DEBUG-IDENTITY-STORE] Full userInfo object:', JSON.stringify(userInfo, null, 2));
            
            // Check for roles in different possible locations
            const userInfoAny = userInfo as unknown as Record<string, unknown>;
            console.log('[DEBUG-IDENTITY-STORE] Checking alternative role fields:');
            console.log('[DEBUG-IDENTITY-STORE] - userInfo.role:', userInfoAny.role);
            console.log('[DEBUG-IDENTITY-STORE] - userInfo.authorities:', userInfoAny.authorities);
            console.log('[DEBUG-IDENTITY-STORE] - userInfo.permissions:', userInfoAny.permissions);
            console.log('[DEBUG-IDENTITY-STORE] - userInfo.groups:', userInfoAny.groups);
          }
          
          console.log('[DEBUG-IDENTITY-STORE] ========================================');
          
          // Validate userInfo structure
          if (!userInfo) {
            throw new Error('API returned empty user info');
          }
          
          // Extract centers from roles with defensive handling
          // If roles is missing, try to extract from other fields or use empty array
          console.log('[DEBUG-IDENTITY-STORE] ========================================');
          console.log('[DEBUG-IDENTITY-STORE] Starting center extraction...');
          
          let centers: string[] = [];
          
          if (userInfo.roles !== null && userInfo.roles !== undefined) {
            console.log('[DEBUG-IDENTITY-STORE] Roles field exists, extracting centers...');
            console.log('[DEBUG-IDENTITY-STORE] Roles before extraction:', userInfo.roles);
            centers = extractCentersFromRoles(userInfo.roles);
            console.log('[DEBUG-IDENTITY-STORE] Centers extracted from roles:', centers);
          } else {
            console.warn('[DEBUG-IDENTITY-STORE] ⚠️ Roles field is null/undefined!');
            console.warn('[DEBUG-IDENTITY-STORE] Checking for alternative fields...');
            
            // Try to extract from other possible fields if roles is missing
            // Some APIs might return roles in a different structure
            if (userInfo && typeof userInfo === 'object') {
              // Use type-safe property access
              const userInfoAny: unknown = userInfo;
              if (userInfoAny && typeof userInfoAny === 'object') {
                const obj = userInfoAny as Record<string, unknown>;
                console.log('[DEBUG-IDENTITY-STORE] Checking obj.role:', obj.role);
                console.log('[DEBUG-IDENTITY-STORE] Checking obj.authorities:', obj.authorities);
                
                // Check for common alternative field names
                if (obj.role && Array.isArray(obj.role)) {
                  console.log('[DEBUG-IDENTITY-STORE] Found roles in "role" field:', obj.role);
                  centers = extractCentersFromRoles(obj.role);
                } else if (obj.authorities && Array.isArray(obj.authorities)) {
                  console.log('[DEBUG-IDENTITY-STORE] Found roles in "authorities" field:', obj.authorities);
                  centers = extractCentersFromRoles(obj.authorities);
                } else {
                  console.warn('[DEBUG-IDENTITY-STORE] No alternative role fields found!');
                }
              }
            }
          }
          
          console.log('[DEBUG-IDENTITY-STORE] Final extracted centers:', centers);
          console.log('[DEBUG-IDENTITY-STORE] Centers count:', centers.length);
          console.log('[DEBUG-IDENTITY-STORE] ========================================');
          
          // Get current selected center from storage
          const storedCenter = localStorage.getItem(STORAGE_KEY_SELECTED_CENTER);
          
          // Auto-select if only one center available
          let selectedCenter = storedCenter;
          if (centers.length === 1) {
            selectedCenter = centers[0];
            localStorage.setItem(STORAGE_KEY_SELECTED_CENTER, selectedCenter);
            console.log('[identityStore] Auto-selected center:', selectedCenter);
          }
          
          // Ensure availableCenters is always an array
          const safeCenters = Array.isArray(centers) ? centers : [];
          
          set({
            user: userInfo,
            availableCenters: safeCenters,
            selectedCenter,
            isLoading: false,
            error: null,
          });
          
          console.log('[identityStore] State updated:', {
            hasUser: !!userInfo,
            centersCount: safeCenters.length,
            centers: safeCenters,
            selectedCenter,
          });
        } catch (error) {
          // Enhanced error logging
          console.error('[identityStore] Error fetching user info:', error);
          if (error && typeof error === 'object' && 'response' in error) {
            const axiosError = error as { response?: { data?: unknown; status?: number } };
            console.error('[identityStore] API Error details:', {
              status: axiosError.response?.status,
              data: axiosError.response?.data,
            });
          }
          
          const err = error instanceof Error ? error : new Error('Failed to fetch user info');
          set({
            isLoading: false,
            error: err,
          });
          throw err;
        }
      },

      setSelectedCenter: (center: string) => {
        localStorage.setItem(STORAGE_KEY_SELECTED_CENTER, center);
        set({ selectedCenter: center });
      },

      clearIdentity: () => {
        localStorage.removeItem(STORAGE_KEY_SELECTED_CENTER);
        set({
          user: null,
          availableCenters: [],
          selectedCenter: null,
          error: null,
        });
      },
    }),
    {
      name: 'identity-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedCenter: state.selectedCenter,
      }),
      // Ensure availableCenters is always an array when rehydrating from storage
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Ensure availableCenters is always an array
          if (!Array.isArray(state.availableCenters)) {
            console.warn('[identityStore] availableCenters was not an array, fixing...');
            state.availableCenters = [];
          }
        }
      },
    }
  )
);
