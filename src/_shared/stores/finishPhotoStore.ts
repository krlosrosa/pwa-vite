import { create } from 'zustand';
import { db, type FinishPhotoRecord } from '../db/database';

interface FinishPhotoState {
  saveFinishPhotos: (demandaId: string, photos: string[]) => Promise<number>;
  /** Retorna as fotos já salvas (não sincronizadas) para a demanda, para exibir ao voltar na página */
  getFinishPhotosByDemand: (demandaId: string) => Promise<string[]>;
  getUnsyncedFinishPhotos: () => Promise<FinishPhotoRecord[]>;
  markFinishPhotoAsSynced: (id: number) => Promise<void>;
}

export const useFinishPhotoStore = create<FinishPhotoState>(() => ({
  saveFinishPhotos: async (demandaId: string, photos: string[]) => {
    const now = Date.now();
    const existing = await db.finishPhotos
      .where('demandaId')
      .equals(demandaId)
      .filter((r) => r.synced === false)
      .first();
    if (photos.length === 0) {
      if (existing?.id != null) {
        await db.finishPhotos.delete(existing.id);
      }
      return 0;
    }
    if (existing?.id != null) {
      await db.finishPhotos.update(existing.id, {
        photos,
        updatedAt: now,
      });
      return existing.id;
    }
    const id = await db.finishPhotos.add({
      demandaId,
      photos,
      createdAt: now,
      updatedAt: now,
      synced: false,
    });
    return id;
  },

  getFinishPhotosByDemand: async (demandaId: string) => {
    const record = await db.finishPhotos
      .where('demandaId')
      .equals(demandaId)
      .filter((r) => r.synced === false)
      .first();
    return record?.photos ?? [];
  },

  getUnsyncedFinishPhotos: async () => {
    const all = await db.finishPhotos.toArray();
    return all.filter((r) => r.synced === false);
  },

  markFinishPhotoAsSynced: async (id: number) => {
    await db.finishPhotos.update(id, { synced: true });
  },
}));
