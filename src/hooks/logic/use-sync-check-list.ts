
import { useAddCheckListDevolucaoMobile } from '@/_services/api/service/devolucao-mobile/devolucao-mobile';
import { useChecklistStore } from '@/_shared/stores';
/**
 * Hook for syncing a full demand with backend using Orval mutation
 * Handles conferences, anomalies, checklist, and demand status
 */
export function useSyncCheckList() {

  const { mutateAsync } = useAddCheckListDevolucaoMobile();
  
  const { getAllChecklists, markAsSynced } = useChecklistStore()

  async function syncCheckLists() {
    const demands = (await getAllChecklists()).filter(d => d.synced === false);
    for (const demand of demands) {
      if (demand.synced === false) {
        await mutateAsync({
          demandaId: demand.demandaId,
          data: {
            fotoBauAberto: demand.fotoBauAberto || '',
            fotoBauFechado: demand.fotoBauFechado || '',
            temperaturaBau: demand.temperaturaBau || '',
            temperaturaProduto: demand.temperaturaProduto || '',
            anomalias: demand.anomalias || '',
            demandaId: demand.demandaId,
          }
        }).then(() => {
          markAsSynced(demand.id!);
        })
      }
    }
  }

  return {
    syncCheckLists,
  }
}