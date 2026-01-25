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
 * Extracts unique centers from roles.
 * Roles format: "admin:expedicao:pavuna" -> extracts "pavuna"
 */
function extractCentersFromRoles(roles: string[]): string[] {
// Se roles for null/undefined/não-array, retorna vazio imediatamente
if (!Array.isArray(roles)) return [];

const centers = new Set<string>();
for (const role of roles) {
  const parts = role.split(':');
  if (parts.length > 0) {
    const center = parts[parts.length - 1].trim();
    if (center) centers.add(center);
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
          
          // Extract centers from roles
          const centers = extractCentersFromRoles(userInfo.roles);
          
          // Get current selected center from storage
          const storedCenter = localStorage.getItem(STORAGE_KEY_SELECTED_CENTER);
          
          // Auto-select if only one center available
          let selectedCenter = storedCenter;
          if (centers.length === 1) {
            selectedCenter = centers[0];
            localStorage.setItem(STORAGE_KEY_SELECTED_CENTER, selectedCenter);
          }
          
          set({
            user: userInfo,
            availableCenters: centers,
            selectedCenter,
            isLoading: false,
            error: null,
          });
        } catch (error) {
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
    }
  )
);
