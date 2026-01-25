
import { useFinalizarDemandaDevolucaoMobile } from '@/_services/api/service/devolucao-mobile/devolucao-mobile';
import { useDemandStore } from '@/_shared/stores/demandStore';
/**
 * Hook for syncing a full demand with backend using Orval mutation
 * Handles conferences, anomalies, checklist, and demand status
 */
export function useSyncDemand() {

  const { mutateAsync } = useFinalizarDemandaDevolucaoMobile();

  const { getAllDemands, markDemandAsSynced } = useDemandStore()

  async function syncDemands() {
    const demands = (await getAllDemands()).filter(d => d.synced === false);
    for (const demand of demands) {
        // Load demand data to get doca and placa
        await mutateAsync({
            demandaId: demand.demandaId,
        }).then(() => {
          markDemandAsSynced(demand.id!);
        })
      }
  }

  return {
    syncDemands,
  }
}