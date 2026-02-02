import imageCompression from 'browser-image-compression';
import { useAddAnomaliaDevolucao, useGetPresignedUrlAnomaliaDevolucao } from '@/_services/api/service/devolucao/devolucao';
import { uploadImageMinio } from '@/_services/http/minio.http';
import { useConferenceStore } from '@/_shared/stores';

// Função auxiliar para comprimir e converter Base64 -> WebP
async function compressBase64ToWebP(base64: string, filename: string): Promise<File> {
  
  const base64WithPrefix = base64.startsWith('data:') 
    ? base64 
    : `data:image/jpeg;base64,${base64}`;

    const response = await fetch(base64WithPrefix);
    const blob = await response.blob();
    const originalFile = new File([blob], filename, { type: 'image/jpeg' });

  // Converte base64 para Blob inicial
  
  const options = {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/webp' as string,
  };

  const compressedBlob = await imageCompression(originalFile, options);
  
  // Troca a extensão original para .webp
  const newFilename = filename.replace(/\.[^/.]+$/, "") + ".webp";
  return new File([compressedBlob], newFilename, { type: 'image/webp' });
}

export function useSyncAnomalia() {
  const { mutateAsync } = useAddAnomaliaDevolucao();
  const { mutateAsync: getPresignedUrlAnomaliaDevolucao } = useGetPresignedUrlAnomaliaDevolucao();
  const { getAllAnomalies, markAnomalyAsSynced } = useConferenceStore();

  async function syncAnomalias() {
    const unsyncedAnomalies = (await getAllAnomalies()).filter(d => d.synced === false);
    
    for (const anomaly of unsyncedAnomalies) {
      try {
        const [natureza, tipo, causa] = anomaly.description.split(' | ');
        
        if (!natureza || !tipo || !causa) continue;

        // 1. COMPRESSÃO: Processa todas as fotos em paralelo
        let imageFiles: File[] = [];
        if (anomaly.photos && Array.isArray(anomaly.photos)) {
          imageFiles = await Promise.all(
            anomaly.photos.map((photo, index) => 
              compressBase64ToWebP(
                photo, 
                `anomalia-${anomaly.demandaId}-${anomaly.sku}-${index + 1}.jpg`
              )
            )
          );
        }

        if (imageFiles.length === 0) continue;

        // 2. PRESIGNED URLS: Pede uma URL para cada arquivo WebP já comprimido
        const urlsPresigned = await Promise.all(imageFiles.map(async (file) => {
          return await getPresignedUrlAnomaliaDevolucao({
            filename: file.name, // O nome já termina em .webp
          });
        }));

        // 3. UPLOAD: Envia cada arquivo para sua respectiva URL
        await Promise.all(urlsPresigned.map((url, index) => {
          return uploadImageMinio(url, imageFiles[index]);
        }));

        // 4. PERSISTÊNCIA: Envia os nomes dos arquivos (.webp) para o banco
        const filenames = imageFiles.map((f) => f.name);

        await mutateAsync({
          data: {
            causa,
            descricao: anomaly.description,
            sku: anomaly.sku,
            quantidadeCaixas: anomaly.quantityBox || 0,
            quantidadeUnidades: anomaly.quantityUnit || 0,
            lote: anomaly.lote || '',
            natureza,
            tipo,
            imagens: filenames, 
            demandaId: Number(anomaly.demandaId),
            tratado: false
          },
        });

        markAnomalyAsSynced(anomaly.id!);
      } catch (error) {
        console.error(`[useSyncAnomalia] Error syncing anomaly ${anomaly.id}:`, error);
        throw error;
      }
    }
  }

  return { syncAnomalias };
}