import { useAddCheckListDevolucaoMobile, useGetPresignedUrlCheckListDevolucao } from '@/_services/api/service/devolucao/devolucao';
import { uploadImageMinio } from '@/_services/http/minio.http';
import { useChecklistStore } from '@/_shared/stores';

/**
 * Helper function to convert base64 string to File (for multipart/form-data)
 */
function base64ToFile(base64: string, filename: string = 'image.jpg', mimeType: string = 'image/jpeg'): File {
  // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  
  // Convert base64 to binary
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  
  // Convert Blob to File
  return new File([blob], filename, { type: mimeType });
}

/**
 * Hook for syncing checklist with backend using Orval mutation
 * Handles multipart/form-data format with Blob files
 */
export function useSyncCheckList() {
  const { mutateAsync } = useAddCheckListDevolucaoMobile();
  const { getAllChecklists, markAsSynced } = useChecklistStore();
  const { mutateAsync: getPresignedUrlCheckListDevolucao } = useGetPresignedUrlCheckListDevolucao();

  async function syncCheckLists() {
    const unsyncedChecklists = (await getAllChecklists()).filter(d => d.synced === false);
    
    for (const checklist of unsyncedChecklists) {
      try {
        // Validate that we have at least one photo
        if (!checklist.fotoBauAberto && !checklist.fotoBauFechado) {
          console.warn(`[useSyncCheckList] Skipping checklist ${checklist.id} - no photos found`);
          continue;
        }

        const filenameBauAberto = `bau-aberto-${checklist.demandaId}.jpg`;
        const filenameBauFechado = `bau-fechado-${checklist.demandaId}.jpg`;

        const bauAbertoPresignedUrl = await getPresignedUrlCheckListDevolucao({
          filename: filenameBauAberto,
        });

        const bauFechadoPresignedUrl = await getPresignedUrlCheckListDevolucao({
          filename: filenameBauFechado,
        });

        // Convert base64 strings to File for multipart/form-data
        const fotoBauAbertoFile = checklist.fotoBauAberto 
          ? base64ToFile(checklist.fotoBauAberto, filenameBauAberto)
          : new File([], filenameBauAberto, { type: 'image/jpeg' });
        
        const fotoBauFechadoFile = checklist.fotoBauFechado 
          ? base64ToFile(checklist.fotoBauFechado, filenameBauFechado)
          : new File([], filenameBauFechado, { type: 'image/jpeg' });

        await uploadImageMinio(bauAbertoPresignedUrl, fotoBauAbertoFile);
        await uploadImageMinio(bauFechadoPresignedUrl, fotoBauFechadoFile);

        await mutateAsync({
          demandaId: checklist.demandaId,
          data: {
            demandaId: checklist.demandaId,
            temperaturaBau: checklist.temperaturaBau || '',
            temperaturaProduto: checklist.temperaturaProduto || '',
            anomalias: checklist.anomalias || undefined,
            fotoBauAberto: filenameBauAberto,
            fotoBauFechado: filenameBauFechado,
          }
        });

        // Mark as synced after successful upload
        markAsSynced(checklist.id!);
        console.log(`[useSyncCheckList] Checklist ${checklist.id} synced successfully`);
      } catch (error) {
        console.error(`[useSyncCheckList] Error syncing checklist ${checklist.id}:`, error);
        throw error; // Re-throw to allow caller to handle
      }
    }
  }

  return {
    syncCheckLists,
  };
}