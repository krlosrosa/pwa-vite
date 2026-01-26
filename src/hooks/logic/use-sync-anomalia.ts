import { useAddAnomaliaDevolucao } from '@/_services/api/service/devolucao-mobile/devolucao-mobile';
import { useConferenceStore } from '@/_shared/stores';

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
 * Hook for syncing anomalies with backend using Orval mutation
 * Handles multipart/form-data format with File objects
 */
export function useSyncAnomalia() {
  const { mutateAsync } = useAddAnomaliaDevolucao();
  const { getAllAnomalies, markAnomalyAsSynced } = useConferenceStore();

  async function syncAnomalias() {
    const unsyncedAnomalies = (await getAllAnomalies()).filter(d => d.synced === false);
    
    for (const anomaly of unsyncedAnomalies) {
      try {
        const [natureza, tipo, causa] = anomaly.description.split(' | ');
        
        if (!natureza || !tipo || !causa) {
          console.warn(`[useSyncAnomalia] Skipping anomaly ${anomaly.id} - invalid description format`);
          continue;
        }

        // Convert base64 photo strings to File objects for multipart/form-data
        const imageFiles: File[] = [];
        if (anomaly.photos && Array.isArray(anomaly.photos)) {
          anomaly.photos.forEach((photo, index) => {
            if (photo && typeof photo === 'string') {
              const filename = `anomalia-${anomaly.id}-${index + 1}.jpg`;
              imageFiles.push(base64ToFile(photo, filename));
            }
          });
        }

        // Validate that we have at least one image
        if (imageFiles.length === 0) {
          console.warn(`[useSyncAnomalia] Skipping anomaly ${anomaly.id} - no photos found`);
          continue;
        }

        await mutateAsync({
          data: {
            causa: causa,
            descricao: anomaly.description,
            sku: anomaly.sku,
            quantidadeCaixas: anomaly.quantityBox || 0,
            quantidadeUnidades: anomaly.quantityUnit || 0,
            lote: anomaly.lote || '',
            natureza: natureza,
            tipo: tipo,
            // Type assertion: API expects File[] for multipart/form-data, but type definition says string[]
            imagens: imageFiles as unknown as string[],
            demandaId: Number(anomaly.demandaId),
            tratado: false
          },
        });

        // Mark as synced after successful upload
        markAnomalyAsSynced(anomaly.id!);
        console.log(`[useSyncAnomalia] Anomaly ${anomaly.id} synced successfully`);
      } catch (error) {
        console.error(`[useSyncAnomalia] Error syncing anomaly ${anomaly.id}:`, error);
        throw error; // Re-throw to allow caller to handle
      }
    }
  }

  return {
    syncAnomalias,
  };
}