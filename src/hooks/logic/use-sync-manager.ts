import { useEffect, useCallback, useRef, useState } from 'react';
import { useChecklistStore } from '@/_shared/stores/checklistStore';
import { useConferenceStore } from '@/_shared/stores/conferenceStore';
import { useDemandStore } from '@/_shared/stores/demandStore';
import { useAddCheckListDevolucaoMobile, useAddContagemCega } from '@/_services/api/service/devolucao-mobile/devolucao-mobile';
import { prepareDemandSyncPayload } from './use-sync-demand-helpers';
import type { ChecklistRecord } from '@/_shared/db/database';

interface SyncStatus {
  lastSyncTime: number | null;
  error: string | null;
}

// Singleton flag OUTSIDE the hook to survive re-renders and Strict Mode mounting
let isSyncingGlobal = false;

/**
 * Hook that manages automatic synchronization of all offline data with the backend.
 * Handles checklists, conferences, and anomalies.
 */
export function useSyncManager() {
  const [isSyncing, setIsSyncing] = useState(false);
  const syncStatusRef = useRef<SyncStatus>({
    lastSyncTime: null,
    error: null,
  });

  const {
    getUnsyncedChecklists,
    markAsSynced,
  } = useChecklistStore();

  const {
    getUnsyncedConferences,
    getUnsyncedAnomalies,
    markConferenceAsSynced,
    markAnomalyAsSynced,
  } = useConferenceStore();

  const {
    getUnsyncedDemands,
    markDemandAsSynced,
    loadDemand,
  } = useDemandStore();

  const checklistMutation = useAddCheckListDevolucaoMobile();
  const conferenceMutation = useAddContagemCega();

  /**
   * Syncs a single checklist
   */
  const syncChecklist = useCallback(async (checklist: ChecklistRecord): Promise<boolean> => {
    if (!checklist.id) return false;

    try {
      await checklistMutation.mutateAsync({
        demandaId: checklist.demandaId,
        data: {
          demandaId: checklist.demandaId,
          fotoBauAberto: checklist.fotoBauAberto,
          fotoBauFechado: checklist.fotoBauFechado,
          temperaturaBau: checklist.temperaturaBau,
          temperaturaProduto: checklist.temperaturaProduto,
          anomalias: checklist.anomalias,
        },
      });

      await markAsSynced(checklist.id);
      return true;
    } catch (error) {
      console.error(`Error syncing checklist ${checklist.id}:`, error);
      return false;
    }
  }, [checklistMutation, markAsSynced]);

  /**
   * Syncs all conferences and anomalies for a specific demand
   */
  const syncDemandConferences = useCallback(async (demandaId: string): Promise<boolean> => {
    try {
      const unsyncedConferences = await getUnsyncedConferences();
      const unsyncedAnomalies = await getUnsyncedAnomalies();

      // Diagnostic: Log available demandaIds in Dexie
      console.log(`[SYNC-MANAGER] Checking Demand: ${demandaId} (type: ${typeof demandaId})`);
      console.log(`[SYNC-MANAGER] Available in Dexie (conferences):`, unsyncedConferences.map(c => ({ id: c.demandaId, type: typeof c.demandaId })));
      console.log(`[SYNC-MANAGER] Available in Dexie (anomalies):`, unsyncedAnomalies.map(a => ({ id: a.demandaId, type: typeof a.demandaId })));

      // Filter by demand (type-agnostic comparison)
      const demandConferences = unsyncedConferences.filter(c => String(c.demandaId) === String(demandaId));
      const demandAnomalies = unsyncedAnomalies.filter(a => String(a.demandaId) === String(demandaId));

      console.log(`[SYNC-MANAGER] Filtered results: ${demandConferences.length} conferences, ${demandAnomalies.length} anomalies for demand ${demandaId}`);

      if (demandConferences.length === 0 && demandAnomalies.length === 0) {
        return true; // Nothing to sync
      }

      // Prepare payload
      const syncPayload = prepareDemandSyncPayload(
        demandaId,
        unsyncedConferences,
        unsyncedAnomalies,
        undefined // Checklist is synced separately
      );

      if (syncPayload.conferences.length > 0) {
        await conferenceMutation.mutateAsync({
          demandaId,
          data: syncPayload.conferences,
        });

        // Mark conferences as synced
        for (const id of syncPayload.conferenceIds) {
          await markConferenceAsSynced(id);
        }

        // Mark anomalies as synced
        for (const id of syncPayload.anomalyIds) {
          await markAnomalyAsSynced(id);
        }
      }

      return true;
    } catch (error) {
      console.error(`Error syncing conferences for demand ${demandaId}:`, error);
      return false;
    }
  }, [
    getUnsyncedConferences,
    getUnsyncedAnomalies,
    conferenceMutation,
    markConferenceAsSynced,
    markAnomalyAsSynced,
  ]);

  /**
   * Syncs all unsynced data
   */
  const syncAll = useCallback(async (): Promise<void> => {
    // Singleton check: Use global flag to prevent concurrent calls across re-renders
    if (isSyncingGlobal || !navigator.onLine) {
      if (isSyncingGlobal) {
        console.log('[SYNC-MANAGER] Sync already in progress (global flag), skipping...');
      } else {
        console.log('[SYNC-MANAGER] Device is offline, skipping sync...');
      }
      return;
    }

    // Set global flag immediately (synchronous)
    isSyncingGlobal = true;

    // Also check state for UI reactivity
    if (isSyncing) {
      console.log('[SYNC-MANAGER] Sync already in progress (state), skipping...');
      isSyncingGlobal = false;
      return;
    }

    console.log('[SYNC-MANAGER] Starting syncAll...');
    setIsSyncing(true);
    syncStatusRef.current.error = null;

    try {
      // Get all unsynced data
      const unsyncedChecklists = await getUnsyncedChecklists();
      const unsyncedConferences = await getUnsyncedConferences();
      const unsyncedAnomalies = await getUnsyncedAnomalies();

      const unsyncedDemands = await getUnsyncedDemands();
      const totalUnsynced = unsyncedChecklists.length + unsyncedConferences.length + unsyncedAnomalies.length + unsyncedDemands.length;
      
      console.log(`[SYNC-MANAGER] Found unsynced: ${unsyncedChecklists.length} checklists, ${unsyncedConferences.length} conferences, ${unsyncedAnomalies.length} anomalies, ${unsyncedDemands.length} demands`);
      
      if (totalUnsynced === 0) {
        console.log('[SYNC-MANAGER] No unsynced data found, sync complete');
        syncStatusRef.current.lastSyncTime = Date.now();
        setIsSyncing(false);
        isSyncingGlobal = false; // Reset global flag
        return;
      }

      console.log(`Starting sync: ${unsyncedChecklists.length} checklists, ${unsyncedConferences.length} conferences, ${unsyncedAnomalies.length} anomalies, ${unsyncedDemands.length} demands`);

      // Group conferences by demand
      const demandIds = new Set<string>();
      unsyncedConferences.forEach(c => demandIds.add(c.demandaId));
      unsyncedAnomalies.forEach(a => demandIds.add(a.demandaId));
      unsyncedChecklists.forEach(cl => demandIds.add(cl.demandaId));
      unsyncedDemands.forEach(d => demandIds.add(d.demandaId));

      // Sync checklists first
      let syncedChecklists = 0;
      for (const checklist of unsyncedChecklists) {
        const success = await syncChecklist(checklist);
        if (success) {
          syncedChecklists++;
        } else {
          syncStatusRef.current.error = `Failed to sync checklist for demand ${checklist.demandaId}`;
        }
      }

      // Sync conferences and anomalies by demand
      let syncedDemands = 0;
      const syncedDemandIds = new Set<string>();
      
      for (const demandaId of demandIds) {
        const success = await syncDemandConferences(demandaId);
        if (success) {
          syncedDemands++;
          syncedDemandIds.add(demandaId);
        } else {
          syncStatusRef.current.error = `Failed to sync conferences for demand ${demandaId}`;
        }
      }

      // After syncing all data, mark demands as synced if all their related data is synced
      // Reload unsynced data to get current state after sync
      const remainingUnsyncedChecklists = await getUnsyncedChecklists();
      const remainingUnsyncedConferences = await getUnsyncedConferences();
      const remainingUnsyncedAnomalies = await getUnsyncedAnomalies();
      
      let syncedStandaloneDemands = 0;
      for (const demandaId of syncedDemandIds) {
        const demandRecord = await loadDemand(demandaId);
        if (demandRecord && demandRecord.id && !demandRecord.synced) {
          // Check if there's any remaining unsynced data for this demand
          const hasUnsyncedChecklist = remainingUnsyncedChecklists.some(c => String(c.demandaId) === String(demandaId));
          const hasUnsyncedConferences = remainingUnsyncedConferences.some(c => String(c.demandaId) === String(demandaId));
          const hasUnsyncedAnomalies = remainingUnsyncedAnomalies.some(a => String(a.demandaId) === String(demandaId));
          
          // Only mark as synced if all related data is synced
          if (!hasUnsyncedChecklist && !hasUnsyncedConferences && !hasUnsyncedAnomalies) {
            await markDemandAsSynced(demandRecord.id);
            syncedStandaloneDemands++;
          }
        }
      }

      // Handle standalone unsynced demands (demands without related checklist/conferences)
      // These are demands that were saved locally but don't have related data to sync
      for (const demand of unsyncedDemands) {
        if (!syncedDemandIds.has(demand.demandaId)) {
          // Check if this demand has any unsynced related data
          const hasUnsyncedChecklist = remainingUnsyncedChecklists.some(c => String(c.demandaId) === String(demand.demandaId));
          const hasUnsyncedConferences = remainingUnsyncedConferences.some(c => String(c.demandaId) === String(demand.demandaId));
          const hasUnsyncedAnomalies = remainingUnsyncedAnomalies.some(a => String(a.demandaId) === String(demand.demandaId));
          
          // If no related data exists or all related data is synced, mark demand as synced
          // Note: Demand data itself (like finalizeIntention) doesn't need API sync,
          // it's just metadata that gets synced when related data is synced
          if (!hasUnsyncedChecklist && !hasUnsyncedConferences && !hasUnsyncedAnomalies) {
            if (demand.id) {
              await markDemandAsSynced(demand.id);
              syncedStandaloneDemands++;
            }
          }
        }
      }

      syncStatusRef.current.lastSyncTime = Date.now();
      console.log(`[SYNC-MANAGER] Sync completed: ${syncedChecklists}/${unsyncedChecklists.length} checklists, ${syncedDemands}/${demandIds.size} demands, ${syncedStandaloneDemands} standalone demands`);
    } catch (error) {
      console.error('[SYNC-MANAGER] Error during sync:', error);
      syncStatusRef.current.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      // Always reset both flags
      setIsSyncing(false);
      isSyncingGlobal = false;
    }
  }, [
    isSyncing,
    getUnsyncedChecklists,
    getUnsyncedConferences,
    getUnsyncedAnomalies,
    getUnsyncedDemands,
    loadDemand,
    markDemandAsSynced,
    syncChecklist,
    syncDemandConferences,
  ]);

  /**
   * Syncs data for a specific demand
   */
  const syncDemand = useCallback(async (demandaId: string): Promise<void> => {
    if (!navigator.onLine) {
      console.log('Device is offline, cannot sync demand');
      return;
    }

    try {
      // Sync checklist for this demand
      const unsyncedChecklists = await getUnsyncedChecklists();
      const checklist = unsyncedChecklists.find(c => String(c.demandaId) === String(demandaId));
      if (checklist) {
        await syncChecklist(checklist);
      }

      // Sync conferences and anomalies
      await syncDemandConferences(demandaId);

      // Mark demand as synced if all related data is synced
      const demandRecord = await loadDemand(demandaId);
      if (demandRecord && demandRecord.id && !demandRecord.synced) {
        // Check if there's any remaining unsynced data for this demand
        const remainingUnsyncedChecklists = await getUnsyncedChecklists();
        const remainingUnsyncedConferences = await getUnsyncedConferences();
        const remainingUnsyncedAnomalies = await getUnsyncedAnomalies();
        
          const hasUnsyncedChecklist = remainingUnsyncedChecklists.some(c => String(c.demandaId) === String(demandaId));
          const hasUnsyncedConferences = remainingUnsyncedConferences.some(c => String(c.demandaId) === String(demandaId));
          const hasUnsyncedAnomalies = remainingUnsyncedAnomalies.some(a => String(a.demandaId) === String(demandaId));
        
        // Only mark as synced if all related data is synced
        if (!hasUnsyncedChecklist && !hasUnsyncedConferences && !hasUnsyncedAnomalies) {
          await markDemandAsSynced(demandRecord.id);
        }
      }
    } catch (error) {
      console.error(`Error syncing demand ${demandaId}:`, error);
      throw error;
    }
  }, [
    getUnsyncedChecklists,
    getUnsyncedConferences,
    getUnsyncedAnomalies,
    loadDemand,
    markDemandAsSynced,
    syncChecklist,
    syncDemandConferences,
  ]);

  /**
   * Sets up automatic sync on online event and periodic sync
   */
  useEffect(() => {
    // Debounce timer ref (outside component scope would be better, but useRef works)
    let debounceTimer: NodeJS.Timeout | null = null;

    // Debounced sync function
    const debouncedSync = () => {
      // Clear any existing timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        console.log('[SYNC-MANAGER] Debounce: Cleared previous sync timer');
      }

      // Set new timer (2000ms debounce)
      debounceTimer = setTimeout(() => {
        if (!isSyncingGlobal && navigator.onLine) {
          console.log('[SYNC-MANAGER] Debounced sync executing...');
          syncAll().catch(err => {
            console.error('[SYNC-MANAGER] Error in debounced sync:', err);
          });
        } else {
          console.log('[SYNC-MANAGER] Debounced sync skipped (already syncing or offline)');
        }
        debounceTimer = null;
      }, 2000); // 2000ms debounce
    };

    // Guard: Don't sync if already syncing
    if (isSyncingGlobal || isSyncing) {
      console.log('[SYNC-MANAGER] Skipping initial auto-sync: already syncing');
    } else if (navigator.onLine) {
      // Initial sync with debounce
      console.log('[SYNC-MANAGER] Device is online, scheduling initial sync (debounced)...');
      debouncedSync();
    }

    // Listen for online event (with debounce)
    const handleOnline = () => {
      console.log('[SYNC-MANAGER] Device came online, scheduling debounced sync...');
      debouncedSync();
    };

    // Listen for offline event
    const handleOffline = () => {
      console.log('[SYNC-MANAGER] Device went offline');
      // Clear debounce timer if device goes offline
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
        console.log('[SYNC-MANAGER] Cleared debounce timer due to offline');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic sync every 30 seconds (only when online and not already syncing)
    const syncInterval = setInterval(() => {
      if (navigator.onLine && !isSyncingGlobal && !isSyncing) {
        console.log('[SYNC-MANAGER] Periodic sync triggered');
        syncAll().catch(err => {
          console.error('[SYNC-MANAGER] Error in periodic sync:', err);
        });
      }
    }, 30000); // 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
      // Clear debounce timer on cleanup
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
    };
  }, [syncAll, isSyncing]);

  return {
    syncAll,
    syncDemand,
    isSyncing,
    lastSyncTime: syncStatusRef.current.lastSyncTime,
    error: syncStatusRef.current.error,
  };
}
