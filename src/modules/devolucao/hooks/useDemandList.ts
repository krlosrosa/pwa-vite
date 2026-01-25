import { useState, useEffect, useCallback } from 'react';
import type { ListarDemandasDto } from '@/_services/api/model';
import { useListarDemandasEmAbertoDevolucaoMobile } from '@/_services/api/service/devolucao-mobile/devolucao-mobile';
import { useDemandWorkflow } from '@/hooks/logic/use-demand-workflow';
import { useChecklistStore } from '@/_shared/stores/checklistStore';
import { useDemandStore } from '@/_shared/stores/demandStore';
import { useIdentityStore } from '@/_shared/stores/identityStore';
import { useSyncDemand } from '@/hooks/logic/use-sync-demand';
import { useSyncCheckList } from '@/hooks/logic/use-sync-check-list';
import { useSyncConferencia } from '@/hooks/logic/use-sync-conferencia';
import { useSyncAnomalia } from '@/hooks/logic/use-sync-anomalia';

/**
 * Interface for demand list metadata
 */
export interface DemandMetadata {
  finalizeIntention?: boolean;
  finalizeAttemptedAt?: number;
}

/**
 * Hook return type for demand list page
 */
export interface UseDemandListReturn {
  /** List of demands from API */
  demands: ListarDemandasDto[] | undefined;
  /** Loading state from API */
  isLoading: boolean;
  /** Error state from API */
  isError: boolean;
  /** Set of demand IDs that have draft checklists */
  draftChecklists: Set<string>;
  /** Map of demand IDs to their store metadata */
  demandStoreDataMap: Map<string, DemandMetadata>;
  /** Handler for demand selection/navigation */
  handleSelectDemand: (demandId: string) => void;
  /** Refresh the demands list */
  refreshList: () => Promise<void>;
}

/**
 * Hook for managing demand list page logic.
 * Handles API fetching, filtering, sorting, and synchronization.
 * 
 * @param centerId - The center ID for fetching demands (defaults to selectedCenter from identityStore)
 * @returns UseDemandListReturn object with demands data and handlers
 */
export function useDemandList(centerId?: string): UseDemandListReturn {
  const { selectedCenter } = useIdentityStore();
  const effectiveCenterId = centerId || selectedCenter || 'teste_1';
  
  const { data: demands, isLoading, isError, refetch } = useListarDemandasEmAbertoDevolucaoMobile(effectiveCenterId);
  const { handleDemandSelection } = useDemandWorkflow();
  const { syncDemands } = useSyncDemand();
  const { syncCheckLists } = useSyncCheckList();
  const { loadChecklist } = useChecklistStore();
  const { syncAnomalias } = useSyncAnomalia();
  const { syncConferences } = useSyncConferencia();
  const { loadDemand, saveDemand } = useDemandStore();

  const [draftChecklists, setDraftChecklists] = useState<Set<string>>(new Set());
  const [demandStoreDataMap, setDemandStoreDataMap] = useState<Map<string, DemandMetadata>>(new Map());

  /**
   * Force refresh when component mounts, but only if online.
   * This ensures fresh data is always fetched from the server when entering the page.
   * If offline, uses cached data.
   */
  useEffect(() => {
    // Only refetch if online
    if (navigator.onLine) {
      // Refetch fresh data from server, ignoring cache
      refetch().catch((error) => {
        console.warn('[useDemandList] Failed to refetch on mount:', error);
      });
    }
  }, [effectiveCenterId, refetch]); // Re-run if center changes

  /**
   * Loads draft checklists and demand store data for all demands.
   * Checks if checklists are incomplete and loads demand metadata.
   */
  useEffect(() => {
    const loadDraftChecklistsAndStoreData = async () => {
      if (!demands || demands.length === 0) return;

      const draftSet = new Set<string>();
      const storeDataMap = new Map<string, DemandMetadata>();
      
      await Promise.all(
        demands.map(async (demand) => {
          const demandaId = demand.id.toString();
          
          // Load checklist
          const checklist = await loadChecklist(demandaId);
          if (checklist) {
            // Check if checklist is incomplete (draft)
            const isComplete = !!(
              checklist.fotoBauAberto &&
              checklist.fotoBauFechado &&
              checklist.temperaturaBau &&
              checklist.temperaturaProduto
            );
            if (!isComplete) {
              draftSet.add(demandaId);
            }
          }

          // Load demand store data
          const demandRecord = await loadDemand(demandaId);
          if (demandRecord?.data) {
            storeDataMap.set(demandaId, {
              finalizeIntention: demandRecord.data.finalizeIntention as boolean | undefined,
              finalizeAttemptedAt: demandRecord.data.finalizeAttemptedAt as number | undefined,
            });
          }
        })
      );
      
      setDraftChecklists(draftSet);
      setDemandStoreDataMap(storeDataMap);
    };

    loadDraftChecklistsAndStoreData();
  }, [demands, loadChecklist, loadDemand]);

  /**
   * Handles demand selection and navigation.
   * Uses the demand workflow hook to determine the correct route.
   * Pre-emptively saves the demand to local storage before navigation.
   * 
   * @param demandId - The ID of the demand to select
   */
  const handleSelectDemand = useCallback(async (demandId: string) => {
    // Find the demand in the list to get its status
    const demand = demands?.find(d => d.id.toString() === demandId);
    
    // Pre-emptively register the demand in local database before navigation
    // This ensures the record exists when the validation page mounts
    if (demand) {
      try {
        await saveDemand(demandId, {
          status: demand.status,
        });
        console.log('[DEMAND-LIST] Demand pre-registered in local storage:', demandId, 'Status:', demand.status);
      } catch (error) {
        console.warn('[DEMAND-LIST] Could not pre-register demand:', error);
        // Continue navigation even if pre-registration fails
      }
    }
    
    handleDemandSelection(demandId, demand?.status);
  }, [handleDemandSelection, demands, saveDemand]);

  /**
   * Refreshes the demands list from the API.
   */
  const refreshList = useCallback(async () => {
    await syncAnomalias();
    //await syncConferences();    
    //await syncCheckLists();
    //await syncDemands();

    await refetch();
  }, [refetch, syncAnomalias]);

  return {
    demands,
    isLoading,
    isError,
    draftChecklists,
    demandStoreDataMap,
    handleSelectDemand,
    refreshList,
  };
}
