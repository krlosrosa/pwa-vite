import { useAddAnomaliaDevolucao } from '@/_services/api/service/devolucao-mobile/devolucao-mobile';
import { useConferenceStore } from '@/_shared/stores';
/**
 * Hook for syncing a full demand with backend using Orval mutation
 * Handles conferences, anomalies, checklist, and demand status
 */
export function useSyncAnomalia() {

  const { mutateAsync } = useAddAnomaliaDevolucao();
  
  const { getAllAnomalies, markAnomalyAsSynced } = useConferenceStore()

  async function syncAnomalias() {
    alert('syncAnomalias');
    const demands = (await getAllAnomalies()).filter(d => d.synced === false);
    for (const demand of demands) {
      const [natureza, tipo, causa] = demand.description.split(' | ');
      if (natureza && tipo && causa) {
          await mutateAsync({
            data: {
              causa: causa,
              descricao: demand.description,
              sku: demand.sku,
              quantidadeCaixas: demand.quantityBox || 0,
              quantidadeUnidades: demand.quantityUnit || 0,
              lote: demand.lote || '',
              natureza: natureza,
              tipo: tipo,
              imagens: demand.photos,
              demandaId: Number(demand.demandaId),
              tratado: false
            },
          })
          .then(() => {
            markAnomalyAsSynced(demand.id!);
          })
      }
    }
  }

  return {
    syncAnomalias,
  }
}