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

    // Agrupar por replicatedGroupId (anomalias replicadas compartilham o mesmo upload)
    const groupIds = new Map<string, typeof unsyncedAnomalies>();
    const standalone: typeof unsyncedAnomalies = [];
    for (const a of unsyncedAnomalies) {
      if (a.replicatedGroupId) {
        const list = groupIds.get(a.replicatedGroupId) ?? [];
        list.push(a);
        groupIds.set(a.replicatedGroupId, list);
      } else {
        standalone.push(a);
      }
    }

    // Processar grupos: um upload de todas as fotos por grupo, depois uma chamada API por anomalia do grupo
    for (const [, group] of groupIds) {
      if (group.length === 0) continue;
      // Usar todas as fotos da primeira anomalia do grupo que tiver fotos
      const photosFromGroup = group.find((a) => a.photos?.length)?.photos ?? [];
      if (photosFromGroup.length === 0) continue;
      const firstAnomaly = group[0];
      try {
        const imageFiles = await Promise.all(
          photosFromGroup.map((photo, index) =>
            compressBase64ToWebP(
              photo,
              `anomalia-replicada-${firstAnomaly.demandaId}-${firstAnomaly.replicatedGroupId}-${index + 1}.jpg`
            )
          )
        );
        const urlsPresigned = await Promise.all(
          imageFiles.map((file) => getPresignedUrlAnomaliaDevolucao({ filename: file.name }))
        );
        await Promise.all(
          urlsPresigned.map((url, index) => uploadImageMinio(url, imageFiles[index]))
        );
        const filenames = imageFiles.map((f) => f.name);

        for (const anomaly of group) {
          const [natureza, tipo, causa] = anomaly.description.split(' | ');
          if (!natureza || !tipo || !causa) continue;
          await mutateAsync({
            data: {
              causa,
              descricao: anomaly.description,
              sku: anomaly.sku,
              quantidadeCaixas: anomaly.quantityBox ?? 0,
              quantidadeUnidades: anomaly.quantityUnit ?? 0,
              lote: anomaly.lote ?? '',
              natureza,
              tipo,
              imagens: filenames,
              demandaId: Number(anomaly.demandaId),
              tratado: false,
            },
          });
          markAnomalyAsSynced(anomaly.id!);
        }
      } catch (error) {
        console.error(`[useSyncAnomalia] Error syncing replicated group:`, error);
        throw error;
      }
    }

    // Processar anomalias sem grupo (fluxo atual: um upload por anomalia)
    for (const anomaly of standalone) {
      try {
        const [natureza, tipo, causa] = anomaly.description.split(' | ');
        if (!natureza || !tipo || !causa) continue;

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

        const urlsPresigned = await Promise.all(
          imageFiles.map((file) =>
            getPresignedUrlAnomaliaDevolucao({ filename: file.name })
          )
        );
        await Promise.all(
          urlsPresigned.map((url, index) => uploadImageMinio(url, imageFiles[index]))
        );
        const filenames = imageFiles.map((f) => f.name);

        await mutateAsync({
          data: {
            causa,
            descricao: anomaly.description,
            sku: anomaly.sku,
            quantidadeCaixas: anomaly.quantityBox ?? 0,
            quantidadeUnidades: anomaly.quantityUnit ?? 0,
            lote: anomaly.lote ?? '',
            natureza,
            tipo,
            imagens: filenames,
            demandaId: Number(anomaly.demandaId),
            tratado: false,
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