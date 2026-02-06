import Dexie, { type Table } from 'dexie';

// Interfaces para as tabelas do banco
export interface ChecklistRecord {
  id?: number;
  demandaId: string;
  fotoBauAberto: string;
  fotoBauFechado: string;
  temperaturaBau: string;
  temperaturaProduto: string;
  anomalias?: string;
  createdAt: number;
  updatedAt: number;
  synced: boolean; // Indica se foi sincronizado com o servidor
}

export interface ConferenceRecord {
  id?: number;
  itemId: string;
  demandaId: string;
  sku: string;
  description: string;
  expectedQuantity: number; // quantidadeUnidades esperada
  checkedQuantity: number; // quantidadeUnidades conferida
  expectedBoxQuantity?: number; // quantidadeCaixas esperada
  boxQuantity?: number; // quantidadeCaixas conferida
  lote?: string; // lote (obrigatório na UI, opcional no schema para compatibilidade)
  isChecked: boolean;
  isExtra?: boolean; // Indica se é um item extra (não estava na demanda contábil)
  createdAt: number;
  updatedAt: number;
  synced: boolean;
}

export interface AnomalyRecord {
  id?: number;
  itemId: string;
  demandaId: string;
  sku: string;
  lote?: string; // Lote da conferência (copiado automaticamente)
  quantity: number; // Quantidade em unidades (mantido para compatibilidade)
  quantityBox?: number; // Quantidade em caixas (opcional)
  quantityUnit?: number; // Quantidade em unidades (opcional, pode usar quantity)
  description: string;
  photos: string[];
  /** Agrupa anomalias replicadas para upload único da imagem no sync */
  replicatedGroupId?: string;
  createdAt: number;
  updatedAt: number;
  synced: boolean;
}

export interface DemandRecord {
  id?: number;
  demandaId: string;
  placa?: string;
  motorista?: string;
  doca?: string;
  status?: string;
  senha?: string;
  data: Record<string, unknown>; // Dados completos da demanda
  finalizada: boolean; // Indica se a demanda foi finalizada
  createdAt: number;
  updatedAt: number;
  synced: boolean;
}

// Classe do banco de dados Dexie
export class AppDatabase extends Dexie {
  checklists!: Table<ChecklistRecord, number>;
  conferences!: Table<ConferenceRecord, number>;
  anomalies!: Table<AnomalyRecord, number>;
  demands!: Table<DemandRecord, number>;

  constructor() {
    super('DevolucaoPWA');
    
    this.version(1).stores({
      checklists: '++id, demandaId, synced, createdAt',
      conferences: '++id, itemId, demandaId, synced, createdAt',
      anomalies: '++id, itemId, demandaId, synced, createdAt',
      demands: '++id, demandaId, synced, createdAt',
    });
  }
}

// Instância única do banco de dados
export const db = new AppDatabase();
