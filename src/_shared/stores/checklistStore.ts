import { create } from 'zustand';
import { db, type ChecklistRecord } from '../db/database';

interface ChecklistState {
  // Estado atual do checklist sendo preenchido
  currentChecklist: {
    demandaId: string;
    fotoBauAberto: string;
    fotoBauFechado: string;
    temperaturaBau: string;
    temperaturaProduto: string;
    anomalias?: string;
  } | null;

  // Métodos
  initializeChecklist: (demandaId: string) => Promise<void>;
  updateField: (field: keyof ChecklistState['currentChecklist'], value: string) => void;
  saveChecklist: () => Promise<number>;
  loadChecklist: (demandaId: string) => Promise<ChecklistRecord | undefined>;
  deleteChecklist: (id: number) => Promise<void>;
  getAllChecklists: () => Promise<ChecklistRecord[]>;
  getUnsyncedChecklists: () => Promise<ChecklistRecord[]>;
  markAsSynced: (id: number) => Promise<void>;
  clearCurrentChecklist: () => void;
}

export const useChecklistStore = create<ChecklistState>((set, get) => ({
  currentChecklist: null,

  initializeChecklist: async (demandaId: string) => {
    // Tenta carregar checklist existente
    const existing = await get().loadChecklist(demandaId);
    
    if (existing) {
      set({
        currentChecklist: {
          demandaId: existing.demandaId,
          fotoBauAberto: existing.fotoBauAberto,
          fotoBauFechado: existing.fotoBauFechado,
          temperaturaBau: existing.temperaturaBau,
          temperaturaProduto: existing.temperaturaProduto,
          anomalias: existing.anomalias,
        },
      });
    } else {
      // Cria novo checklist vazio
      set({
        currentChecklist: {
          demandaId,
          fotoBauAberto: '',
          fotoBauFechado: '',
          temperaturaBau: '',
          temperaturaProduto: '',
          anomalias: undefined,
        },
      });
    }
  },

  updateField: (field, value) => {
    const { currentChecklist } = get();
    if (!currentChecklist) return;

    set({
      currentChecklist: {
        ...currentChecklist,
        [field]: value,
      },
    });
  },

  saveChecklist: async () => {
    const { currentChecklist } = get();
    if (!currentChecklist) {
      throw new Error('Nenhum checklist para salvar');
    }

    const now = Date.now();
    
    // Verifica se já existe um checklist para esta demanda
    const existing = await db.checklists
      .where('demandaId')
      .equals(currentChecklist.demandaId)
      .first();

    if (existing) {
      // Atualiza existente
      await db.checklists.update(existing.id!, {
        ...currentChecklist,
        updatedAt: now,
        synced: false, // Marca como não sincronizado após atualização
      });
      return existing.id!;
    } else {
      // Cria novo
      const id = await db.checklists.add({
        ...currentChecklist,
        createdAt: now,
        updatedAt: now,
        synced: false,
      });
      return id;
    }
  },

  loadChecklist: async (demandaId: string) => {
    return await db.checklists
      .where('demandaId')
      .equals(demandaId)
      .first();
  },

  deleteChecklist: async (id: number) => {
    await db.checklists.delete(id);
    
    // Limpa o checklist atual se for o deletado
    const { currentChecklist } = get();
    const deleted = await db.checklists.get(id);
    if (deleted && currentChecklist?.demandaId === deleted.demandaId) {
      set({ currentChecklist: null });
    }
  },

  getAllChecklists: async () => {
    return await db.checklists.toArray();
  },

  getUnsyncedChecklists: async () => {
    return await db.checklists
      .where('synced')
      .equals(0) // Dexie usa 0 para false
      .toArray();
  },

  markAsSynced: async (id: number) => {
    await db.checklists.update(id, { synced: true });
  },

  clearCurrentChecklist: () => {
    set({ currentChecklist: null });
  },
}));
