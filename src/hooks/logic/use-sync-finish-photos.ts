import imageCompression from 'browser-image-compression';
import {
  useGetPresignedUrlFimDevolucao,
  useAddImagemFimDevolucao,
} from '@/_services/api/service/devolucao/devolucao';
import { uploadImageMinio } from '@/_services/http/minio.http';
import { useFinishPhotoStore } from '@/_shared/stores';

async function compressBase64ToWebP(base64: string, filename: string): Promise<File> {
  const base64WithPrefix = base64.startsWith('data:')
    ? base64
    : `data:image/jpeg;base64,${base64}`;

  const response = await fetch(base64WithPrefix);
  const blob = await response.blob();
  const originalFile = new File([blob], filename, { type: 'image/jpeg' });

  const options = {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/webp' as string,
  };

  const compressedBlob = await imageCompression(originalFile, options);
  const newFilename = filename.replace(/\.[^/.]+$/, '') + '.webp';
  return new File([compressedBlob], newFilename, { type: 'image/webp' });
}

export function useSyncFinishPhotos() {
  const { mutateAsync: addImagemFimDevolucao } = useAddImagemFimDevolucao();
  const { mutateAsync: getPresignedUrlFimDevolucao } = useGetPresignedUrlFimDevolucao();
  const { getUnsyncedFinishPhotos, markFinishPhotoAsSynced } = useFinishPhotoStore();

  async function syncFinishPhotos() {
    const unsynced = await getUnsyncedFinishPhotos();

    for (const record of unsynced) {
      const photos = record.photos ?? [];
      if (photos.length === 0) continue;

      try {
        const imageFiles = await Promise.all(
          photos.map((photo, index) =>
            compressBase64ToWebP(
              photo,
              `fim-devolucao-${record.demandaId}-${record.id}-${index + 1}.jpg`
            )
          )
        );

        const urlsPresigned = await Promise.all(
          imageFiles.map((file) => getPresignedUrlFimDevolucao({ filename: file.name }))
        );
        await Promise.all(
          urlsPresigned.map((url, index) => uploadImageMinio(url, imageFiles[index]))
        );
        const filenames = imageFiles.map((f) => f.name);

        await addImagemFimDevolucao({
          demandaId: record.demandaId,
          data: filenames,
        });

        await markFinishPhotoAsSynced(record.id!);
      } catch (error) {
        console.error(`[useSyncFinishPhotos] Error syncing finish photos ${record.id}:`, error);
        throw error;
      }
    }
  }

  return { syncFinishPhotos };
}
