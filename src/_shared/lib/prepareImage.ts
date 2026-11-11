import imageCompression from 'browser-image-compression';
import { convertFileToBase64 } from './convertBase64';

const LIMITE_SEM_COMPRESSAO = 5 * 1024 * 1024; // 5MB

/**
 * Converte a imagem para base64, comprimindo antes apenas se passar de 5MB
 * (ex.: câmeras de coletores que geram arquivos grandes).
 */
export async function prepareImageBase64(file: File): Promise<string> {
  let final: File = file;
  if (file.size > LIMITE_SEM_COMPRESSAO) {
    final = await imageCompression(file, {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/jpeg',
    });
  }
  return convertFileToBase64(final);
}
