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
        set({ isLoading: true, error: null });
        
        try {
          // Call info-me endpoint
          // Note: If Orval hook becomes available, replace this with:
          // const { data } = await useInfoMe();
          const response = await AXIOS_INSTANCE.get<InfoMeDtoOutput>('/api/user/info-me');
          const userInfo = response.data;
          
          // Debug logs to understand API response in production
          console.log('[identityStore] API Response received:', {
            hasData: !!userInfo,
            userId: userInfo?.id,
            userName: userInfo?.name,
            empresa: userInfo?.empresa,
            rolesType: typeof userInfo?.roles,
            rolesValue: userInfo?.roles,
            rolesIsArray: Array.isArray(userInfo?.roles),
            fullResponse: JSON.stringify(userInfo, null, 2),
          });
          
          // Validate userInfo structure
          if (!userInfo) {
            throw new Error('API returned empty user info');
          }
          
          // Extract centers from roles with defensive handling
          // If roles is missing, try to extract from other fields or use empty array
          let centers: string[] = [];
          
          if (userInfo.roles !== null && userInfo.roles !== undefined) {
            centers = extractCentersFromRoles(userInfo.roles);
          } else {
            console.warn('[identityStore] Roles field is null/undefined in API response. Checking for alternative fields...');
            // Try to extract from other possible fields if roles is missing
            // Some APIs might return roles in a different structure
            if (userInfo && typeof userInfo === 'object') {
              // Use type-safe property access
              const userInfoAny: unknown = userInfo;
              if (userInfoAny && typeof userInfoAny === 'object') {
                const obj = userInfoAny as Record<string, unknown>;
                // Check for common alternative field names
                if (obj.role && Array.isArray(obj.role)) {
                  centers = extractCentersFromRoles(obj.role);
                } else if (obj.authorities && Array.isArray(obj.authorities)) {
                  centers = extractCentersFromRoles(obj.authorities);
                }
              }
            }
          }
          
          console.log('[identityStore] Extracted centers:', centers);
          
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
