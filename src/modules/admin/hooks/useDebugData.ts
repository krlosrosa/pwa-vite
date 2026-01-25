import { useState, useEffect, useCallback } from 'react';
import { db, type ChecklistRecord, type ConferenceRecord, type AnomalyRecord, type DemandRecord } from '@/_shared/db/database';
import { useProdutoStore } from '@/_shared/stores/produtoStore';
import { useChecklistStore } from '@/_shared/stores/checklistStore';
import { useDemandStore } from '@/_shared/stores/demandStore';

/**
 * Hook for managing debug page data
 * Provides real-time updates using Dexie table observation
 */
export function useDebugData() {
  const [checklists, setChecklists] = useState<ChecklistRecord[]>([]);
  const [conferences, setConferences] = useState<ConferenceRecord[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyRecord[]>([]);
  const [demands, setDemands] = useState<DemandRecord[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const { getAllProdutos } = useProdutoStore();
  const produtos = getAllProdutos();

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Real-time data loading using polling (Dexie doesn't have reactive hooks)
  useEffect(() => {
    // Load initial data
    const loadData = async () => {
      const [checklistsData, conferencesData, anomaliesData, demandsData] = await Promise.all([
        db.checklists.toArray(),
        db.conferences.toArray(),
        db.anomalies.toArray(),
        db.demands.toArray(),
      ]);

      setDemands(demandsData);
      setChecklists(checklistsData);
      setConferences(conferencesData);
      setAnomalies(anomaliesData);
    };

    loadData();

    // Poll for updates every 1 second for real-time feel
    const interval = setInterval(loadData, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  /**
   * Delete a checklist record
   */
  const deleteChecklist = useCallback(async (id: number) => {
    await db.checklists.delete(id);
    setChecklists((prev) => prev.filter((c) => c.id !== id));
  }, []);

  /**
   * Delete a conference record
   */
  const deleteConference = useCallback(async (id: number) => {
    await db.conferences.delete(id);
    setConferences((prev) => prev.filter((c) => c.id !== id));
  }, []);

  /**
   * Delete an anomaly record
   */
  const deleteAnomaly = useCallback(async (id: number) => {
    await db.anomalies.delete(id);
    setAnomalies((prev) => prev.filter((a) => a.id !== id));
  }, []);

  /**
   * Delete a demand record
   */
  const deleteDemand = useCallback(async (id: number) => {
    await db.demands.delete(id);
    setDemands((prev) => prev.filter((d) => d.id !== id));
  }, []);

  /**
   * Clear all local data
   */
  const clearAllData = useCallback(async () => {
    if (!confirm('Tem certeza que deseja limpar TODOS os dados locais? Esta ação não pode ser desfeita.')) {
      return;
    }

    await Promise.all([
      db.checklists.clear(),
      db.conferences.clear(),
      db.anomalies.clear(),
      db.demands.clear(),
    ]);

    // Clear Zustand stores
    useChecklistStore.getState().clearCurrentChecklist();
    useDemandStore.getState().clearCache();
    useProdutoStore.getState().clear();

    // Reload data
    setChecklists([]);
    setConferences([]);
    setAnomalies([]);
    setDemands([]);

    alert('Todos os dados locais foram limpos.');
  }, []);

  /**
   * Export database as JSON
   */
  const exportDatabase = useCallback(async () => {
    const data = {
      checklists: await db.checklists.toArray(),
      conferences: await db.conferences.toArray(),
      anomalies: await db.anomalies.toArray(),
      demands: await db.demands.toArray(),
      produtos: produtos,
      timestamp: new Date().toISOString(),
    };

    console.log('=== DATABASE EXPORT ===');
    console.log(JSON.stringify(data, null, 2));
    console.log('=======================');

    // Also copy to clipboard if possible
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      alert('Dados exportados para o console e copiados para a área de transferência!');
    } catch {
      alert('Dados exportados para o console!');
    }
  }, [produtos]);

  return {
    checklists,
    conferences,
    anomalies,
    demands,
    produtos,
    isOnline,
    deleteChecklist,
    deleteConference,
    deleteAnomaly,
    deleteDemand,
    clearAllData,
    exportDatabase,
  };
}
