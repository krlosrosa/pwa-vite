import { create } from 'zustand';
import { db, type DemandRecord, type ConferenceRecord, type AnomalyRecord, type ChecklistRecord } from '../db/database';

interface DemandState {
  // Cache de demandas carregadas
  demands: Map<string, DemandRecord>;
  
  // Métodos
  saveDemand: (demandaId: string, data: Record<string, unknown>) => Promise<number>;
  loadDemand: (demandaId: string) => Promise<DemandRecord | undefined>;
  updateDemand: (demandaId: string, updates: Partial<DemandRecord['data']>) => Promise<void>;
  deleteDemand: (id: number) => Promise<void>;
  getAllDemands: () => Promise<DemandRecord[]>;
  getUnsyncedDemands: () => Promise<DemandRecord[]>;
  markDemandAsSynced: (id: number) => Promise<void>;
  markDemandAsSyncedByDemandaId: (demandaId: string) => Promise<void>;
  markChecklistAsSyncedByDemandaId: (demandaId: string) => Promise<void>;
  markConferencesAsSyncedByDemandaId: (demandaId: string) => Promise<void>;
  markAnomaliesAsSyncedByDemandaId: (demandaId: string) => Promise<void>;
  markAllProcessesAsSyncedByDemandaId: (demandaId: string) => Promise<void>;
  markDemandAsFinalized: (demandaId: string) => Promise<void>;
  markDemandAsNotFinalized: (demandaId: string) => Promise<void>;
  getAllDemandsWithItems: () => Promise<Array<{
    id: number;
    demandaId: string;
    synced: boolean; // Status de sincronização da demanda (startDemandaDevolucaoMobile)
    finalizada: boolean; // Indica se a demanda foi finalizada
    data: Record<string, unknown>;
    conferences: ConferenceRecord[]; // Cada conference tem seu próprio synced
    anomalies: AnomalyRecord[]; // Cada anomaly tem seu próprio synced
    stats: { 
      total: number; 
      checked: number; 
      unchecked: number;
      syncedConferences: number; // Quantidade de conferências sincronizadas
      unsyncedConferences: number; // Quantidade de conferências não sincronizadas
      syncedAnomalies: number; // Quantidade de anomalias sincronizadas
      unsyncedAnomalies: number; // Quantidade de anomalias não sincronizadas
    };
    checklistSynced?: boolean; // Status de sincronização do checklist (se existir)
  }>>;
  
  // Métodos auxiliares
  clearCache: () => void;
  getDemandFromCache: (demandaId: string) => DemandRecord | undefined;
}

export const useDemandStore = create<DemandState>((set, get) => ({
  demands: new Map(),

  saveDemand: async (demandaId: string, data: Record<string, unknown>) => {
    const now = Date.now();
    
    // Verifica se já existe uma demanda com este ID
    const existing = await db.demands
      .where('demandaId')
      .equals(demandaId)
      .first();

    if (existing) {
      // Atualiza existente
      const mergedData = { ...existing.data, ...data };
      // Garante que finalizada existe (para compatibilidade com registros antigos)
      const finalizada = existing.finalizada !== undefined ? existing.finalizada : false;
      
      await db.demands.update(existing.id!, {
        data: mergedData,
        finalizada,
        updatedAt: now,
        synced: false,
      } as Partial<DemandRecord>);
      
      const updated: DemandRecord = {
        ...existing,
        data: { ...existing.data, ...data },
        finalizada,
        updatedAt: now,
        synced: false,
      };
      
      // Atualiza cache
      set((state) => {
        const newDemands = new Map(state.demands);
        newDemands.set(demandaId, updated);
        return { demands: newDemands };
      });
      
      return existing.id!;
    } else {
      // Cria novo
      const newRecord: DemandRecord = {
        demandaId,
        data,
        finalizada: false, // Inicia como não finalizada
        createdAt: now,
        updatedAt: now,
        synced: false,
      };
      
      const id = await db.demands.add(newRecord);
      
      // Atualiza cache
      set((state) => {
        const newDemands = new Map(state.demands);
        newDemands.set(demandaId, { ...newRecord, id });
        return { demands: newDemands };
      });
      
      return id;
    }
  },

  loadDemand: async (demandaId: string) => {
    // Verifica cache primeiro
    const cached = get().getDemandFromCache(demandaId);
    if (cached) {
      // Garante que finalizada existe (para compatibilidade com registros antigos)
      if (cached.finalizada === undefined) {
        cached.finalizada = false;
      }
      return cached;
    }

    // Busca no banco
    const record = await db.demands
      .where('demandaId')
      .equals(demandaId)
      .first();

    // Se o registro não tem finalizada, inicializa como false e atualiza no banco
    if (record && record.finalizada === undefined) {
      const now = Date.now();
      await db.demands.update(record.id!, { 
        finalizada: false,
        updatedAt: now,
      });
      record.finalizada = false;
      record.updatedAt = now;
    }

    // Atualiza cache se encontrado
    if (record) {
      set((state) => {
        const newDemands = new Map(state.demands);
        newDemands.set(demandaId, record);
        return { demands: newDemands };
      });
    }

    return record;
  },

  updateDemand: async (demandaId: string, updates: Partial<DemandRecord['data']>) => {
    const existing = await get().loadDemand(demandaId);
    
    if (!existing || !existing.id) {
      throw new Error(`Demanda ${demandaId} não encontrada`);
    }

    const now = Date.now();
    // Garante que finalizada existe (para compatibilidade com registros antigos)
    const finalizada = existing.finalizada !== undefined ? existing.finalizada : false;
    
    await db.demands.update(existing.id, {
      data: { ...existing.data, ...updates },
      finalizada,
      updatedAt: now,
      synced: false,
    });
    
    const updated: DemandRecord = {
      ...existing,
      data: { ...existing.data, ...updates },
      finalizada,
      updatedAt: now,
      synced: false,
    };

    // Atualiza cache
    set((state) => {
      const newDemands = new Map(state.demands);
      newDemands.set(demandaId, updated);
      return { demands: newDemands };
    });
  },

  deleteDemand: async (id: number) => {
    const record = await db.demands.get(id);
    await db.demands.delete(id);
    
    // Remove do cache
    if (record) {
      set((state) => {
        const newDemands = new Map(state.demands);
        newDemands.delete(record.demandaId);
        return { demands: newDemands };
      });
    }
  },

  getAllDemands: async () => {
    return await db.demands.toArray();
  },

  getUnsyncedDemands: async () => {
    return await db.demands
      .where('synced')
      .equals(0)
      .toArray();
  },

  markDemandAsSynced: async (id: number) => {
    await db.demands.update(id, { synced: true });
    
    // Atualiza cache
    const record = await db.demands.get(id);
    if (record) {
      set((state) => {
        const newDemands = new Map(state.demands);
        newDemands.set(record.demandaId, record);
        return { demands: newDemands };
      });
    }
  },

  markDemandAsSyncedByDemandaId: async (demandaId: string) => {
    const record = await db.demands
      .where('demandaId')
      .equals(demandaId)
      .first();
    
    if (!record || !record.id) {
      throw new Error(`Demanda ${demandaId} não encontrada`);
    }

    await db.demands.update(record.id, { synced: true });
    
    // Atualiza cache
    const updatedRecord = await db.demands.get(record.id);
    if (updatedRecord) {
      set((state) => {
        const newDemands = new Map(state.demands);
        newDemands.set(demandaId, updatedRecord);
        return { demands: newDemands };
      });
    }
  },

  /**
   * Marca o checklist de uma demanda como sincronizado.
   * Busca o checklist pelo demandaId e atualiza seu status synced para true.
   */
  markChecklistAsSyncedByDemandaId: async (demandaId: string) => {
    const checklist = await db.checklists
      .where('demandaId')
      .equals(demandaId)
      .first();
    
    if (!checklist || !checklist.id) {
      throw new Error(`Checklist para demanda ${demandaId} não encontrado`);
    }

    await db.checklists.update(checklist.id, { synced: true });
  },

  /**
   * Marca todas as conferências de uma demanda como sincronizadas.
   * Busca todas as conferências pelo demandaId e atualiza o status synced para true.
   */
  markConferencesAsSyncedByDemandaId: async (demandaId: string) => {
    const conferences = await db.conferences
      .where('demandaId')
      .equals(demandaId)
      .toArray();
    
    if (conferences.length === 0) {
      return; // Não há conferências para marcar, não é um erro
    }

    // Atualiza todas as conferências em uma única transação
    await db.transaction('rw', db.conferences, async () => {
      for (const conference of conferences) {
        if (conference.id) {
          await db.conferences.update(conference.id, { synced: true });
        }
      }
    });
  },

  /**
   * Marca todas as anomalias de uma demanda como sincronizadas.
   * Busca todas as anomalias pelo demandaId e atualiza o status synced para true.
   */
  markAnomaliesAsSyncedByDemandaId: async (demandaId: string) => {
    const anomalies = await db.anomalies
      .where('demandaId')
      .equals(demandaId)
      .toArray();
    
    if (anomalies.length === 0) {
      return; // Não há anomalias para marcar, não é um erro
    }

    // Atualiza todas as anomalias em uma única transação
    await db.transaction('rw', db.anomalies, async () => {
      for (const anomaly of anomalies) {
        if (anomaly.id) {
          await db.anomalies.update(anomaly.id, { synced: true });
        }
      }
    });
  },

  /**
   * Marca todos os processos de uma demanda como sincronizados.
   * Inclui: demanda, checklist, conferências e anomalias.
   * Útil para sincronização completa de uma demanda.
   */
  markAllProcessesAsSyncedByDemandaId: async (demandaId: string) => {
    // Executa todas as marcações em paralelo
    await Promise.all([
      get().markDemandAsSyncedByDemandaId(demandaId).catch(() => {
        // Ignora erro se demanda não existir
      }),
      get().markChecklistAsSyncedByDemandaId(demandaId).catch(() => {
        // Ignora erro se checklist não existir
      }),
      get().markConferencesAsSyncedByDemandaId(demandaId),
      get().markAnomaliesAsSyncedByDemandaId(demandaId),
    ]);
  },

  /**
   * Marca uma demanda como finalizada.
   * Busca a demanda pelo demandaId e atualiza o campo finalizada para true.
   */
  markDemandAsFinalized: async (demandaId: string) => {
    const record = await db.demands
      .where('demandaId')
      .equals(demandaId)
      .first();
    
    if (!record || !record.id) {
      throw new Error(`Demanda ${demandaId} não encontrada`);
    }

    const now = Date.now();
    await db.demands.update(record.id, { 
      finalizada: true,
      updatedAt: now,
    });
    
    // Atualiza cache
    const updatedRecord = await db.demands.get(record.id);
    if (updatedRecord) {
      set((state) => {
        const newDemands = new Map(state.demands);
        newDemands.set(demandaId, updatedRecord);
        return { demands: newDemands };
      });
    }
  },

  /**
   * Marca uma demanda como não finalizada.
   * Busca a demanda pelo demandaId e atualiza o campo finalizada para false.
   */
  markDemandAsNotFinalized: async (demandaId: string) => {
    const record = await db.demands
      .where('demandaId')
      .equals(demandaId)
      .first();
    
    if (!record || !record.id) {
      throw new Error(`Demanda ${demandaId} não encontrada`);
    }

    const now = Date.now();
    await db.demands.update(record.id, { 
      finalizada: false,
      updatedAt: now,
    });
    
    // Atualiza cache
    const updatedRecord = await db.demands.get(record.id);
    if (updatedRecord) {
      set((state) => {
        const newDemands = new Map(state.demands);
        newDemands.set(demandaId, updatedRecord);
        return { demands: newDemands };
      });
    }
  },

  /**
   * Returns all demands with their associated conferences and anomalies grouped together.
   * This provides a complete view of all demands and their items in a single call.
   * Each process (demand, checklist, conference, anomaly) has its own independent synced status.
   */
  getAllDemandsWithItems: async () => {
    // Fetch all demands, conferences, anomalies, and checklists in parallel
    const [allDemands, allConferences, allAnomalies, allChecklists] = await Promise.all([
      db.demands.toArray(),
      db.conferences.toArray(),
      db.anomalies.toArray(),
      db.checklists.toArray(),
    ]);

    // Group conferences, anomalies, and checklists by demandaId for efficient lookup
    const conferencesByDemand = new Map<string, ConferenceRecord[]>();
    const anomaliesByDemand = new Map<string, AnomalyRecord[]>();
    const checklistsByDemand = new Map<string, ChecklistRecord>();

    // Group conferences
    for (const conference of allConferences) {
      const demandaId = String(conference.demandaId);
      if (!conferencesByDemand.has(demandaId)) {
        conferencesByDemand.set(demandaId, []);
      }
      conferencesByDemand.get(demandaId)!.push(conference);
    }

    // Group anomalies
    for (const anomaly of allAnomalies) {
      const demandaId = String(anomaly.demandaId);
      if (!anomaliesByDemand.has(demandaId)) {
        anomaliesByDemand.set(demandaId, []);
      }
      anomaliesByDemand.get(demandaId)!.push(anomaly);
    }

    // Group checklists
    for (const checklist of allChecklists) {
      const demandaId = String(checklist.demandaId);
      if (!checklistsByDemand.has(demandaId)) {
        checklistsByDemand.set(demandaId, checklist);
      }
    }

    // Map each demand with its conferences, anomalies, checklist, and stats
    return allDemands.map((demand) => {
      const demandaId = String(demand.demandaId);
      const conferences = conferencesByDemand.get(demandaId) || [];
      const anomalies = anomaliesByDemand.get(demandaId) || [];
      const checklist = checklistsByDemand.get(demandaId);
      
      // Calculate stats
      const total = conferences.length;
      const checked = conferences.filter(c => c.isChecked).length;
      const unchecked = total - checked;
      
      // Calculate sync stats for conferences
      const syncedConferences = conferences.filter(c => c.synced).length;
      const unsyncedConferences = conferences.filter(c => !c.synced).length;
      
      // Calculate sync stats for anomalies
      const syncedAnomalies = anomalies.filter(a => a.synced).length;
      const unsyncedAnomalies = anomalies.filter(a => !a.synced).length;

      return {
        id: demand.id!,
        demandaId: demand.demandaId,
        synced: demand.synced, // Status de sincronização da demanda (startDemandaDevolucaoMobile)
        finalizada: demand.finalizada ?? false, // Indica se a demanda foi finalizada (compatibilidade com registros antigos)
        data: demand.data,
        conferences, // Cada conference tem seu próprio campo synced
        anomalies, // Cada anomaly tem seu próprio campo synced
        checklistSynced: checklist?.synced, // Status de sincronização do checklist (se existir)
        stats: {
          total,
          checked,
          unchecked,
          syncedConferences,
          unsyncedConferences,
          syncedAnomalies,
          unsyncedAnomalies,
        },
      };
    });
  },

  clearCache: () => {
    set({ demands: new Map() });
  },

  getDemandFromCache: (demandaId: string) => {
    return get().demands.get(demandaId);
  },
}));
