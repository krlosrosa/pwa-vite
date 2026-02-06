import { useState, useEffect, useCallback, useMemo } from 'react';
import { db, type ChecklistRecord, type ConferenceRecord, type AnomalyRecord, type DemandRecord, type FinishPhotoRecord } from '@/_shared/db/database';
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
  const [finishPhotos, setFinishPhotos] = useState<FinishPhotoRecord[]>([]);
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
      const [checklistsData, conferencesData, anomaliesData, demandsData, finishPhotosData] =
        await Promise.all([
          db.checklists.toArray(),
          db.conferences.toArray(),
          db.anomalies.toArray(),
          db.demands.toArray(),
          db.finishPhotos.toArray(),
        ]);

      setDemands(demandsData);
      setChecklists(checklistsData);
      setConferences(conferencesData);
      setAnomalies(anomaliesData);
      setFinishPhotos(finishPhotosData);
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

  const deleteFinishPhoto = useCallback(async (id: number) => {
    await db.finishPhotos.delete(id);
    setFinishPhotos((prev) => prev.filter((f) => f.id !== id));
  }, []);

  /**
   * Clear all local data (except produtos - they are preserved)
   */

  const clearAllData = useCallback(async () => {
    if (!confirm('Tem certeza que deseja limpar TODOS os dados locais? Esta ação não pode ser desfeita.\n\nNota: Os produtos não serão removidos.')) {
      return;
    }

    await Promise.all([
      db.checklists.clear(),
      db.conferences.clear(),
      db.anomalies.clear(),
      db.demands.clear(),
      db.finishPhotos.clear(),
    ]);

    // Clear Zustand stores (except produtos)
    useChecklistStore.getState().clearCurrentChecklist();
    useDemandStore.getState().clearCache();
    // useProdutoStore.getState().clear(); // PRODUTOS NÃO SÃO LIMPOS - PRESERVADOS

    // Reload data
    setChecklists([]);
    setConferences([]);
    setAnomalies([]);
    setDemands([]);
    setFinishPhotos([]);
  }, []);

  /**
   * Calculate total size of images (base64 strings)
   * Base64 strings are stored as text, so we use the string length in bytes
   */
  const imagesTotalSize = useMemo(() => {
    let totalBytes = 0;
    let checklistCount = 0;
    let anomalyPhotoCount = 0;

    // Calculate size from checklists (fotoBauAberto and fotoBauFechado)
    checklists.forEach((checklist) => {
      if (checklist.fotoBauAberto && typeof checklist.fotoBauAberto === 'string') {
        const size = checklist.fotoBauAberto.length;
        totalBytes += size;
        checklistCount++;
      }
      if (checklist.fotoBauFechado && typeof checklist.fotoBauFechado === 'string') {
        const size = checklist.fotoBauFechado.length;
        totalBytes += size;
        checklistCount++;
      }
    });

    // Calculate size from anomalies (photos array)
    anomalies.forEach((anomaly) => {
      if (anomaly.photos && Array.isArray(anomaly.photos)) {
        anomaly.photos.forEach((photo) => {
          if (photo && typeof photo === 'string') {
            const size = photo.length;
            totalBytes += size;
            anomalyPhotoCount++;
          }
        });
      }
    });

    // Calculate size from finish photos
    finishPhotos.forEach((record) => {
      if (record.photos && Array.isArray(record.photos)) {
        record.photos.forEach((photo) => {
          if (photo && typeof photo === 'string') {
            totalBytes += photo.length;
          }
        });
      }
    });

    return totalBytes;
  }, [checklists, anomalies, finishPhotos]);

  /**
   * Format bytes to human readable format
   */
  const imagesTotalSizeFormatted = useMemo(() => {
    if (imagesTotalSize === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(imagesTotalSize) / Math.log(k));
    return Math.round((imagesTotalSize / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }, [imagesTotalSize]);

  /**
   * Export database as JSON
   */
  const exportDatabase = useCallback(async () => {
    const data = {
      checklists: await db.checklists.toArray(),
      conferences: await db.conferences.toArray(),
      anomalies: await db.anomalies.toArray(),
      demands: await db.demands.toArray(),
      finishPhotos: await db.finishPhotos.toArray(),
      produtos: produtos,
      timestamp: new Date().toISOString(),
    };

    // Also copy to clipboard if possible
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    } catch {
    }
  }, [produtos]);

  return {
    checklists,
    conferences,
    anomalies,
    demands,
    finishPhotos,
    produtos,
    isOnline,
    imagesTotalSize,
    imagesTotalSizeFormatted,
    deleteChecklist,
    deleteConference,
    deleteAnomaly,
    deleteDemand,
    deleteFinishPhoto,
    clearAllData,
    exportDatabase,
  };
}
