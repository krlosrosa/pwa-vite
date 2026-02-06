import { useFinalizarDemandaDevolucaoMobile } from '@/_services/api/service/devolucao/devolucao';
import { useDemandStore } from '@/_shared/stores/demandStore';
import { useSyncFinishPhotos } from './use-sync-finish-photos';

/**
 * Hook for syncing a full demand with backend using Orval mutation.
 * Inclui a sincronização das fotos de término antes de finalizar a demanda.
 */
export function useSyncDemand() {
  const { mutateAsync } = useFinalizarDemandaDevolucaoMobile();
  const { getAllDemands, markDemandAsSynced } = useDemandStore();
  const { syncFinishPhotos } = useSyncFinishPhotos();

  async function syncDemands() {
    // Primeiro sincroniza fotos de término (upload + addImagemFimDevolucao)
    await syncFinishPhotos();

    const demands = (await getAllDemands()).filter(
      (d) => d.synced === false && d.finalizada === true
    );
    for (const demand of demands) {
      await mutateAsync({
        demandaId: demand.demandaId,
      }).then(() => {
        markDemandAsSynced(demand.id!);
      });
    }
  }

  return {
    syncDemands,
  };
}