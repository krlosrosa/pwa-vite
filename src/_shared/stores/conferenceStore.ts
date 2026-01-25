import { create } from 'zustand';
import { db, type ConferenceRecord, type AnomalyRecord } from '../db/database';

/**
 * Helper function to update demand when conference changes
 * Marks demand as not finalized and not synced
 */
async function updateDemandOnConferenceChange(demandaId: string): Promise<void> {
  try {
    const demand = await db.demands
      .where('demandaId')
      .equals(demandaId)
      .first();
    
    if (demand && demand.id) {
      const now = Date.now();
      await db.demands.update(demand.id, {
        finalizada: false,
        synced: false,
        updatedAt: now,
      });
    }
  } catch (error) {
    // Log error but don't throw - conference operation should succeed even if demand update fails
    console.warn(`[conferenceStore] Failed to update demand ${demandaId} on conference change:`, error);
  }
}

interface ConferenceState {
  // Métodos para conferência de itens
  saveConference: (data: {
    itemId: string;
    demandaId: string;
    sku: string;
    description: string;
    expectedQuantity: number; // quantidadeUnidades esperada
    checkedQuantity: number; // quantidadeUnidades conferida
    expectedBoxQuantity?: number; // quantidadeCaixas esperada
    boxQuantity?: number; // quantidadeCaixas conferida
    lote?: string; // lote
    isChecked: boolean;
    isExtra?: boolean; // Indica se é um item extra (não estava na demanda contábil)
  }) => Promise<number>;
  
  loadConference: (itemId: string) => Promise<ConferenceRecord | undefined>;
  loadConferencesByDemand: (demandaId: string) => Promise<ConferenceRecord[]>;
  deleteConference: (id: number) => Promise<void>;
  getAllConferences: () => Promise<ConferenceRecord[]>;
  getUnsyncedConferences: () => Promise<ConferenceRecord[]>;
  markConferenceAsSynced: (id: number) => Promise<void>;
  
  // Métodos para anomalias
  saveAnomaly: (data: {
    itemId: string;
    demandaId: string;
    sku: string;
    lote?: string; // Lote da conferência (copiado automaticamente)
    quantity: number; // Mantido para compatibilidade
    quantityBox?: number; // Quantidade em caixas (opcional)
    quantityUnit?: number; // Quantidade em unidades (opcional)
    description: string;
    photos: string[];
  }) => Promise<number>;
  
  loadAnomaliesByItem: (itemId: string) => Promise<AnomalyRecord[]>;
  loadAnomaliesByDemand: (demandaId: string) => Promise<AnomalyRecord[]>;
  deleteAnomaly: (id: number) => Promise<void>;
  getAllAnomalies: () => Promise<AnomalyRecord[]>;
  getUnsyncedAnomalies: () => Promise<AnomalyRecord[]>;
  markAnomalyAsSynced: (id: number) => Promise<void>;
  
  // Métodos auxiliares
  getConferenceStats: (demandaId: string) => Promise<{
    total: number;
    checked: number;
    unchecked: number;
    hasDivergences: boolean;
  }>;
}

export const useConferenceStore = create<ConferenceState>(() => ({
  // Conferências
  saveConference: async (data) => {
    const now = Date.now();
    
    // Verifica se já existe uma conferência para este item
    const existing = await db.conferences
      .where('itemId')
      .equals(data.itemId)
      .first();

    if (existing) {
      // Atualiza existente
      await db.conferences.update(existing.id!, {
        ...data,
        updatedAt: now,
        synced: false,
      });
      
      // Atualiza demanda: marca como não finalizada e não sincronizada
      await updateDemandOnConferenceChange(data.demandaId);
      
      return existing.id!;
    } else {
      // Cria novo
      const id = await db.conferences.add({
        ...data,
        createdAt: now,
        updatedAt: now,
        synced: false,
      });
      
      // Atualiza demanda: marca como não finalizada e não sincronizada
      await updateDemandOnConferenceChange(data.demandaId);
      
      return id;
    }
  },

  loadConference: async (itemId: string) => {
    return await db.conferences
      .where('itemId')
      .equals(itemId)
      .first();
  },

  loadConferencesByDemand: async (demandaId: string) => {
    return await db.conferences
      .where('demandaId')
      .equals(demandaId)
      .toArray();
  },

  deleteConference: async (id: number) => {
    // Busca a conferência antes de deletar para obter o demandaId
    const conference = await db.conferences.get(id);
    
    if (conference) {
      const demandaId = conference.demandaId;
      
      // Deleta a conferência
      await db.conferences.delete(id);
      
      // Atualiza demanda: marca como não finalizada e não sincronizada
      await updateDemandOnConferenceChange(demandaId);
    } else {
      // Se não encontrou, apenas deleta (caso raro)
      await db.conferences.delete(id);
    }
  },

  getAllConferences: async () => {
    return await db.conferences.toArray();
  },

  getUnsyncedConferences: async () => {
    return await db.conferences
      .where('synced')
      .equals(0)
      .toArray();
  },

  markConferenceAsSynced: async (id: number) => {
    await db.conferences.update(id, { synced: true });
  },

  // Anomalias
  saveAnomaly: async (data) => {
    const now = Date.now();
    const id = await db.anomalies.add({
      ...data,
      createdAt: now,
      updatedAt: now,
      synced: false,
    });
    return id;
  },

  loadAnomaliesByItem: async (itemId: string) => {
    return await db.anomalies
      .where('itemId')
      .equals(itemId)
      .toArray();
  },

  loadAnomaliesByDemand: async (demandaId: string) => {
    return await db.anomalies
      .where('demandaId')
      .equals(demandaId)
      .toArray();
  },

  deleteAnomaly: async (id: number) => {
    await db.anomalies.delete(id);
  },

  getAllAnomalies: async () => {
    return await db.anomalies.toArray();
  },

  getUnsyncedAnomalies: async () => {
    return await db.anomalies
      .where('synced')
      .equals(0)
      .toArray();
  },

  markAnomalyAsSynced: async (id: number) => {
    await db.anomalies.update(id, { synced: true });
  },

  // Estatísticas
  getConferenceStats: async (demandaId: string) => {
    const conferences = await db.conferences
      .where('demandaId')
      .equals(demandaId)
      .toArray();

    const total = conferences.length;
    const checked = conferences.filter(c => c.isChecked).length;
    const unchecked = total - checked;
    
    // Verifica se há divergências (quantidade conferida diferente da esperada)
    // Considera tanto unidades quanto caixas
    // Só verifica divergência se o item estiver marcado como conferido
    const hasDivergences = conferences.some(c => {
      if (!c.isChecked) return false;
      
      // Divergência em unidades: converte para número de forma segura
      const expectedUnidades = isNaN(Number(c.expectedQuantity)) ? 0 : Number(c.expectedQuantity);
      const checkedUnidades = isNaN(Number(c.checkedQuantity)) ? 0 : Number(c.checkedQuantity);
      const unidadesDivergence = expectedUnidades !== checkedUnidades;
      
      // Caixas: só verifica divergência se expectedBoxQuantity estiver definido
      // Se não há expectativa de caixas, não devemos comparar
      let caixasDivergence = false;
      if (c.expectedBoxQuantity !== undefined && c.expectedBoxQuantity !== null) {
        const expectedBox = isNaN(Number(c.expectedBoxQuantity)) ? 0 : Number(c.expectedBoxQuantity);
        const checkedBox = isNaN(Number(c.boxQuantity ?? 0)) ? 0 : Number(c.boxQuantity ?? 0);
        caixasDivergence = expectedBox !== checkedBox;
      }
      
      return unidadesDivergence || caixasDivergence;
    });

    return {
      total,
      checked,
      unchecked,
      hasDivergences,
    };
  },
}));
