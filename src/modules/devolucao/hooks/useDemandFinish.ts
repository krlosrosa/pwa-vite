import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useConferenceStore } from '@/_shared/stores/conferenceStore';

/**
 * Interface for divergent item
 */
export interface DivergentItem {
  id: string;
  sku: string;
  description: string;
  checkedQuantity: number; // unidades conferidas
  expectedQuantity: number; // unidades esperadas
  checkedBoxQuantity?: number; // caixas conferidas
  expectedBoxQuantity?: number; // caixas esperadas
  lote?: string;
}

/**
 * Conference summary statistics
 */
export interface ConferenceSummary {
  total: number;
  checked: number;
  unchecked: number;
  hasDivergences: boolean;
  anomaliesCount: number;
}

/**
 * Hook return type for demand finish page
 */
export interface UseDemandFinishReturn {
  /** Conference summary statistics */
  summary: ConferenceSummary;
  /** List of divergent items */
  divergentItems: DivergentItem[];
  /** Whether data is loading */
  isLoading: boolean;
  /** Whether success card should be shown */
  showSuccessCard: boolean;
  /** Whether finalization can proceed */
  canFinalize: boolean;
  /** Navigate to edit page */
  navigateToEdit: () => void;
}

/**
 * Hook for managing demand finish page logic.
 * Aggregates all local data (Checklist + Conferences + Anomalies) for final summary.
 * 
 * @param demandaId - The demand ID
 * @returns UseDemandFinishReturn object with summary data and handlers
 */
export function useDemandFinish(demandaId: string): UseDemandFinishReturn {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<ConferenceSummary>({
    total: 0,
    checked: 0,
    unchecked: 0,
    hasDivergences: false,
    anomaliesCount: 0,
  });
  const [divergentItems, setDivergentItems] = useState<DivergentItem[]>([]);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    getConferenceStats,
    loadConferencesByDemand,
    loadAnomaliesByDemand,
  } = useConferenceStore();

  /**
   * Load real data from stores
   */
  useEffect(() => {
    const loadData = async () => {
      if (!demandaId) return;

      setIsLoading(true);
      try {
        // Load stats
        const conferenceStats = await getConferenceStats(demandaId);
        
        // Load anomalies count
        const anomalies = await loadAnomaliesByDemand(demandaId);
        
        // Load divergent items (consider both unidades and caixas)
        const conferences = await loadConferencesByDemand(demandaId);
        const divergent = conferences
          .filter(c => {
            if (!c.isChecked) return false;
            
            // Divergence in unidades
            const expectedUnidades = isNaN(Number(c.expectedQuantity)) ? 0 : Number(c.expectedQuantity);
            const checkedUnidades = isNaN(Number(c.checkedQuantity)) ? 0 : Number(c.checkedQuantity);
            const unidadesDivergence = expectedUnidades !== checkedUnidades;
            
            // Caixas: only check divergence if expectedBoxQuantity is defined
            let caixasDivergence = false;
            if (c.expectedBoxQuantity !== undefined && c.expectedBoxQuantity !== null) {
              const expectedBox = isNaN(Number(c.expectedBoxQuantity)) ? 0 : Number(c.expectedBoxQuantity);
              const checkedBox = isNaN(Number(c.boxQuantity ?? 0)) ? 0 : Number(c.boxQuantity ?? 0);
              caixasDivergence = expectedBox !== checkedBox;
            }
            
            return unidadesDivergence || caixasDivergence;
          })
          .map(c => ({
            id: c.itemId,
            sku: c.sku,
            description: c.description,
            checkedQuantity: c.checkedQuantity,
            expectedQuantity: c.expectedQuantity,
            checkedBoxQuantity: c.boxQuantity,
            expectedBoxQuantity: c.expectedBoxQuantity,
            lote: c.lote,
          }));

        setSummary({
          ...conferenceStats,
          anomaliesCount: anomalies.length,
        });
        setDivergentItems(divergent);

        // Auto-show success card if all checked and no divergences
        if (conferenceStats.checked === conferenceStats.total && !conferenceStats.hasDivergences) {
          setShowSuccessCard(true);
        }
      } catch (error) {
        console.error('Error loading finish page data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [demandaId, getConferenceStats, loadConferencesByDemand, loadAnomaliesByDemand]);

  /**
   * Navigate to edit page
   */
  const navigateToEdit = useCallback(() => {
    navigate({ 
      to: '/demands/$id', 
      params: { id: demandaId } 
    });
  }, [navigate, demandaId]);

  const canFinalize = useMemo(() => {
    return summary.checked > 0;
  }, [summary.checked]);

  return {
    summary,
    divergentItems,
    isLoading,
    showSuccessCard,
    canFinalize,
    navigateToEdit,
  };
}
