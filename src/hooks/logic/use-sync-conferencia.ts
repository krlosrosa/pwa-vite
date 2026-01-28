
import type { AddConferenciaCegaDto } from '@/_services/api/model';
import { useAddContagemCega, useFinalizarDemandaDevolucaoMobile } from '@/_services/api/service/devolucao/devolucao';
import { useDemandStore } from '@/_shared/stores';
/**
 * Hook for syncing a full demand with backend using Orval mutation
 * Handles conferences, anomalies, checklist, and demand status
 */
export function useSyncConferencia() {

  const { mutateAsync } = useAddContagemCega();
  const { mutateAsync: finalizarDemanda } = useFinalizarDemandaDevolucaoMobile();

  const { getAllDemandsWithItems, markConferencesAsSyncedByDemandaId, markDemandAsFinalized, markDemandAsSyncedByDemandaId } = useDemandStore()

  async function syncConferences() {
    const demands = (await getAllDemandsWithItems()).filter(
      d => d.stats.syncedConferences === 0 && d.finalizada === true);
    for (const demand of demands) {
      const conferences: AddConferenciaCegaDto[] = demand.conferences.map(item => ({
        descricao: item.description,
        sku: item.sku,
        quantidadeCaixas: item.boxQuantity,
        quantidadeUnidades: item.checkedQuantity,
        lote: item.lote || '',
      }));
      await mutateAsync({
        demandaId: demand.demandaId,
        data: conferences,
      })
        .then(() => {
          markConferencesAsSyncedByDemandaId(demand.demandaId);
        })

      await finalizarDemanda({
        demandaId: demand.demandaId,
      })
        .then(() => {
          markDemandAsSyncedByDemandaId(demand.demandaId);
          markDemandAsFinalized(demand.demandaId);
        })
    }
  }

  return {
    syncConferences,
  }
}