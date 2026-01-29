import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useConferenceStore } from '@/_shared/stores/conferenceStore';
import type { ConferenceRecord } from '@/_shared/db/database';
import { db } from '@/_shared/db/database';
import type { ItensContabilDto } from '@/_services/api/model';
import { useAddContagemCega, useGetItensContabilDevolucaoMobile } from '@/_services/api/service/devolucao/devolucao';

/**
 * Interface for UI item (derived from ConferenceRecord)
 */
export interface ItemData {
  id: string; // itemId
  sku: string;
  description: string;
  expectedQuantity: number; // unidades esperadas
  checkedQuantity: number; // unidades conferidas
  expectedBoxQuantity?: number; // caixas esperadas
  boxQuantity?: number; // caixas conferidas
  lote?: string; // lote
  isChecked: boolean;
  hasDivergence: boolean;
  hasAnomaly?: boolean; // Indica se o item tem anomalias registradas
  isExtra?: boolean; // Indica se é um item extra
}

/**
 * Conference statistics
 */
export interface ConferenceStats {
  total: number;
  checked: number;
  unchecked: number;
  hasDivergences: boolean;
}

/**
 * Filter state
 */
export interface FilterState {
  searchTerm: string;
  showOnlyChecked: boolean;
  showOnlyAnomalies: boolean;
}

/**
 * Hook return type for demand items page
 */
export interface UseDemandItemsReturn {
  /** List of items for display */
  items: ItemData[];
  /** Filtered items based on current filters */
  displayItems: ItemData[];
  /** Conference statistics */
  stats: ConferenceStats;
  /** Filter state */
  filters: FilterState;
  /** API loading state */
  isLoadingApi: boolean;
  /** API error state */
  isApiError: boolean;
  /** Whether local data exists */
  hasLocalData: boolean;
  /** Sync mutation pending state */
  isSyncing: boolean;
  /** Toggle filter for showing only checked items */
  toggleFilter: (showOnlyChecked: boolean) => void;
  /** Toggle filter for showing only items with anomalies */
  toggleAnomaliesFilter: (showOnlyAnomalies: boolean) => void;
  /** Update search filter */
  setSearchFilter: (searchTerm: string) => void;
  /** Navigate to item conference page */
  navigateToConference: (itemId: string) => void;
  /** Navigate to add extra item page */
  navigateToAddExtra: () => void;
  /** Handle finish conference action */
  handleFinishConference: () => Promise<void>;
  /** Refresh API data */
  refetchApiItems: () => void;
}

/**
 * Helper function to generate consistent itemId
 */
const generateItemId = (demandaId: string, sku: string): string => {
  return `${demandaId}-${sku}`;
};

/**
 * Helper function to map API item to ConferenceRecord data
 */
const mapApiItemToConference = (apiItem: ItensContabilDto, demandaId: string) => {
  const itemId = generateItemId(demandaId, apiItem.sku);
  return {
    itemId,
    demandaId: demandaId.toString(),
    sku: apiItem.sku,
    description: apiItem.descricao,
    expectedQuantity: apiItem.quantidadeUnidades,
    checkedQuantity: 0,
    expectedBoxQuantity: apiItem.quantidadeCaixas,
    boxQuantity: undefined,
    isChecked: false,
  };
};

/**
 * Hook for managing demand items page logic.
 * Handles hydration of Dexie from API, local filtering, and item management.
 * 
 * @param demandaId - The demand ID
 * @returns UseDemandItemsReturn object with items data and handlers
 */
export function useDemandItems(demandaId: string): UseDemandItemsReturn {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('');
  const [showOnlyChecked, setShowOnlyChecked] = useState(false);
  const [showOnlyAnomalies, setShowOnlyAnomalies] = useState(false);
  const [conferences, setConferences] = useState<ConferenceRecord[]>([]);
  const [anomalies, setAnomalies] = useState<Map<string, boolean>>(new Map()); // Map<itemId, hasAnomaly>
  const [stats, setStats] = useState<ConferenceStats>({ 
    total: 0, 
    checked: 0, 
    unchecked: 0, 
    hasDivergences: false 
  });
  const hydrationRef = useRef(false);

  // Orval hook to fetch accounting items from API
  const { 
    data: apiItems, 
    isLoading: isLoadingApi, 
    isError: isApiError,
    refetch: refetchApiItems 
  } = useGetItensContabilDevolucaoMobile(
    demandaId,
    {
      query: {
        enabled: !!demandaId,
        staleTime: Infinity,
      },
    }
  );

  // Sync mutation
  const syncMutation = useAddContagemCega();

  const { 
    loadConferencesByDemand, 
    getConferenceStats,
    getUnsyncedConferences,
    markConferenceAsSynced,
    loadAnomaliesByDemand
  } = useConferenceStore();

  /**
   * Reactive function to load conferences, anomalies and stats
   */
  const refreshConferences = useCallback(async () => {
    if (!demandaId) return;
    
    const storedConferences = await loadConferencesByDemand(demandaId);
    setConferences(storedConferences);
    
    // Load anomalies for this demand
    const demandAnomalies = await loadAnomaliesByDemand(demandaId);
    const anomaliesMap = new Map<string, boolean>();
    demandAnomalies.forEach(anomaly => {
      anomaliesMap.set(anomaly.itemId, true);
    });
    setAnomalies(anomaliesMap);
    
    const conferenceStats = await getConferenceStats(demandaId);
    setStats(conferenceStats);
  }, [demandaId, loadConferencesByDemand, getConferenceStats, loadAnomaliesByDemand]);

  // Load conferences from Dexie store on mount and when demandaId changes
  useEffect(() => {
    refreshConferences();
  }, [refreshConferences]);

  // Refresh when page gains focus or becomes visible (user returns from conference/anomaly page)
  useEffect(() => {
    const handleFocus = () => {
      refreshConferences();
    };
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshConferences();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshConferences]);

  /**
   * Optimized hydration: Single transaction to check and add missing items
   */
  useEffect(() => {
    const hydrateStore = async () => {
      if (!apiItems || !demandaId || hydrationRef.current) return;
      
      hydrationRef.current = true;

      try {
        // Use Dexie transaction for atomic operations
        await db.transaction('rw', db.conferences, async () => {
          const existingConferences = await loadConferencesByDemand(demandaId);
          const existingItemIds = new Set(existingConferences.map(c => c.itemId));
          
          const itemsToAdd: Array<{
            itemId: string;
            demandaId: string;
            sku: string;
            description: string;
            expectedQuantity: number;
            checkedQuantity: number;
            expectedBoxQuantity?: number;
            boxQuantity?: number;
            isChecked: boolean;
          }> = [];

          for (const apiItem of apiItems) {
            const itemId = generateItemId(demandaId, apiItem.sku);
            
            // Only add if it doesn't exist (preserve user's offline progress)
            if (!existingItemIds.has(itemId)) {
              itemsToAdd.push(mapApiItemToConference(apiItem, demandaId));
            }
          }

          // Batch add all missing items
          if (itemsToAdd.length > 0) {
            const now = Date.now();
            await db.conferences.bulkAdd(
              itemsToAdd.map(item => ({
                ...item,
                createdAt: now,
                updatedAt: now,
                synced: false,
              }))
            );
          }
        });

        // Refresh conferences after hydration
        await refreshConferences();
      } catch (error) {
        console.error('Error hydrating store:', error);
      } finally {
        hydrationRef.current = false;
      }
    };

    hydrateStore();
  }, [apiItems, demandaId, loadConferencesByDemand, refreshConferences]);

  /**
   * Convert ConferenceRecord to ItemData for UI
   */
  const items: ItemData[] = useMemo(() => {
    return conferences.map((conference) => {
      const hasAnomaly = anomalies.get(conference.itemId) ?? false;
      
      if (!conference.isChecked) {
        return {
          id: conference.itemId,
          sku: conference.sku,
          description: conference.description,
          expectedQuantity: conference.expectedQuantity,
          checkedQuantity: conference.checkedQuantity,
          expectedBoxQuantity: conference.expectedBoxQuantity,
          boxQuantity: conference.boxQuantity,
          lote: conference.lote,
          isChecked: conference.isChecked,
          hasDivergence: false,
          hasAnomaly,
          isExtra: conference.isExtra ?? false,
        };
      }
      
      // Divergence: item is checked AND (unidades OR caixas differ from expected)
      const expectedUnidades = isNaN(Number(conference.expectedQuantity)) ? 0 : Number(conference.expectedQuantity);
      const checkedUnidades = isNaN(Number(conference.checkedQuantity)) ? 0 : Number(conference.checkedQuantity);
      const unidadesDivergence = expectedUnidades !== checkedUnidades;
      
      let caixasDivergence = false;
      if (conference.expectedBoxQuantity !== undefined && conference.expectedBoxQuantity !== null) {
        const expectedBox = isNaN(Number(conference.expectedBoxQuantity)) ? 0 : Number(conference.expectedBoxQuantity);
        const checkedBox = isNaN(Number(conference.boxQuantity ?? 0)) ? 0 : Number(conference.boxQuantity ?? 0);
        caixasDivergence = expectedBox !== checkedBox;
      }
      
      return {
        id: conference.itemId,
        sku: conference.sku,
        description: conference.description,
        expectedQuantity: conference.expectedQuantity,
        checkedQuantity: conference.checkedQuantity,
        expectedBoxQuantity: conference.expectedBoxQuantity,
        boxQuantity: conference.boxQuantity,
        lote: conference.lote,
        isChecked: conference.isChecked,
        hasDivergence: unidadesDivergence || caixasDivergence,
        hasAnomaly,
        isExtra: conference.isExtra ?? false,
      };
    });
  }, [conferences, anomalies]);

  /**
   * Filters applied with useMemo for optimization
   */
  const displayItems = useMemo(() => {
    let filtered = items;

    // Filter by "apenas conferidos"
    if (showOnlyChecked) {
      filtered = filtered.filter(item => item.isChecked);
    }

    // Filter by "apenas com anomalias"
    if (showOnlyAnomalies) {
      filtered = filtered.filter(item => item.hasAnomaly === true);
    }

    // Filter by search (SKU or description)
    if (filter.trim()) {
      const searchTerm = filter.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.sku.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }, [items, filter, showOnlyChecked, showOnlyAnomalies]);

  /**
   * Toggle filter for showing only checked items
   */
  const toggleFilter = useCallback((checked: boolean) => {
    setShowOnlyChecked(checked);
  }, []);

  /**
   * Toggle filter for showing only items with anomalies
   */
  const toggleAnomaliesFilter = useCallback((checked: boolean) => {
    setShowOnlyAnomalies(checked);
  }, []);

  /**
   * Update search filter
   */
  const setSearchFilter = useCallback((searchTerm: string) => {
    setFilter(searchTerm);
  }, []);

  /**
   * Navigate to item conference page
   */
  const navigateToConference = useCallback((itemId: string) => {
    navigate({ 
      to: '/demands/$id/items/$itemId/conference', 
      params: { id: demandaId, itemId } 
    });
  }, [navigate, demandaId]);

  /**
   * Navigate to add extra item page
   */
  const navigateToAddExtra = useCallback(() => {
    navigate({ 
      to: '/demands/$id/items/add-extra', 
      params: { id: demandaId } 
    });
  }, [navigate, demandaId]);

  /**
   * Handle finish conference action
   */
  const handleFinishConference = useCallback(async () => {
    if (stats.hasDivergences) {
      // Redirect to divergence review page
      navigate({ 
        to: '/demands/$id/finish', 
        params: { id: demandaId } 
      });
    } else {
      // Sync all unsynced conferences to backend
      try {
        const unsyncedConferences = await getUnsyncedConferences();
        const demandaConferences = unsyncedConferences.filter(c => c.demandaId === demandaId);
        
        if (demandaConferences.length === 0) {
          // Already synced, navigate to finish page
          navigate({ 
            to: '/demands/$id/finish', 
            params: { id: demandaId } 
          });
          return;
        }

        // Map ConferenceRecord to AddConferenciaCegaDto
        const syncData = demandaConferences.map(conf => ({
          sku: conf.sku,
          descricao: conf.description,
          quantidadeUnidades: conf.checkedQuantity,
          quantidadeCaixas: conf.boxQuantity ?? 0,
          lote: conf.lote ?? '',
        }));

        await syncMutation.mutateAsync({
          demandaId,
          data: syncData,
        });

        // Mark conferences as synced
        for (const conf of demandaConferences) {
          if (conf.id) {
            await markConferenceAsSynced(conf.id);
          }
        }

        // Navigate to finish page after successful sync
        navigate({ 
          to: '/demands/$id/finish', 
          params: { id: demandaId } 
        });
      } catch (error) {
        console.error('Error syncing conferences:', error);
        alert('Erro ao sincronizar conferências. Tente novamente.');
      }
    }
  }, [stats.hasDivergences, demandaId, getUnsyncedConferences, syncMutation, markConferenceAsSynced, navigate]);

  const hasLocalData = conferences.length > 0;

  return {
    items,
    displayItems,
    stats,
    filters: {
      searchTerm: filter,
      showOnlyChecked,
      showOnlyAnomalies,
    },
    isLoadingApi,
    isApiError,
    hasLocalData,
    isSyncing: syncMutation.isPending,
    toggleFilter,
    toggleAnomaliesFilter,
    setSearchFilter,
    navigateToConference,
    navigateToAddExtra,
    handleFinishConference,
    refetchApiItems,
  };
}
