import imageCompression from 'browser-image-compression';
import { useAddCheckListDevolucaoMobile, useGetPresignedUrlCheckListDevolucao } from '@/_services/api/service/devolucao/devolucao';
import { uploadImageMinio } from '@/_services/http/minio.http';
import { useChecklistStore } from '@/_shared/stores';

/**
 * Helper function to convert base64 string to File (for multipart/form-data)
 */
/*function base64ToFile(base64: string, filename: string = 'image.jpg', mimeType: string = 'image/jpeg'): File {
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
} */

/**
 * Hook for syncing checklist with backend using Orval mutation
 * Handles multipart/form-data format with Blob files
 */
export function useSyncCheckList() {
  const { mutateAsync } = useAddCheckListDevolucaoMobile();
  const { getAllChecklists, markAsSynced } = useChecklistStore();
  const { mutateAsync: getPresignedUrlCheckListDevolucao } = useGetPresignedUrlCheckListDevolucao();

  async function compressAndConvertToWebP(base64: string, filename: string): Promise<File> {
    // 1. Converte Base64 para um objeto File inicial (seu método original ou via fetch)
    const response = await fetch(base64);
    const blob = await response.blob();
    const originalFile = new File([blob], filename, { type: blob.type });

    // 2. Configurações de compressão
    const options = {
      maxSizeMB: 0.8,           // Alvo de 800KB (ajuste conforme necessário)
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/webp' as string, // Força a saída para WebP
    };

    // 3. Executa a compressão
    const compressedBlob = await imageCompression(originalFile, options);
    
    // 4. Retorna como um File com a extensão correta
    const newFilename = filename.replace(/\.[^/.]+$/, "") + ".webp";
    return new File([compressedBlob], newFilename, { type: 'image/webp' });
  }


  async function syncCheckLists() {
    const unsyncedChecklists = (await getAllChecklists()).filter(d => d.synced === false);
    
    for (const checklist of unsyncedChecklists) {
      try {
        // Validate that we have at least one photo
        if (!checklist.fotoBauAberto && !checklist.fotoBauFechado) {
          console.warn(`[useSyncCheckList] Skipping checklist ${checklist.id} - no photos found`);
          continue;
        }

        // Convert base64 strings to File for multipart/form-data
        const fileBauAberto = checklist.fotoBauAberto 
        ? await compressAndConvertToWebP(checklist.fotoBauAberto, `bau-aberto-${checklist.demandaId}.jpg`)
        : null;

      const fileBauFechado = checklist.fotoBauFechado 
        ? await compressAndConvertToWebP(checklist.fotoBauFechado, `bau-fechado-${checklist.demandaId}.jpg`)
        : null;

        const bauAbertoPresignedUrl = fileBauAberto 
        ? await getPresignedUrlCheckListDevolucao({ filename: fileBauAberto.name }) // backend deve inferir webp pelo nome ou tipo
        : null;

      const bauFechadoPresignedUrl = fileBauFechado 
        ? await getPresignedUrlCheckListDevolucao({ filename: fileBauFechado.name }) 
        : null;

        if (bauAbertoPresignedUrl && fileBauAberto) {
          await uploadImageMinio(bauAbertoPresignedUrl, fileBauAberto);
        }

        if (bauFechadoPresignedUrl && fileBauFechado) {
          await uploadImageMinio(bauFechadoPresignedUrl, fileBauFechado);
        }

        await mutateAsync({
          demandaId: checklist.demandaId,
          data: {
            demandaId: checklist.demandaId,
            temperaturaBau: checklist.temperaturaBau || '',
            temperaturaProduto: checklist.temperaturaProduto || '',
            anomalias: checklist.anomalias || undefined,
            fotoBauAberto: fileBauAberto?.name || '',
            fotoBauFechado: fileBauFechado?.name || '',
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