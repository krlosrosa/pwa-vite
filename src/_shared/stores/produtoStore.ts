import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import type { CreateProdutoDto } from '@/_services/api/model';

// Tipo para item de produto no store (indexado por SKU)
export type ProdutoItem = CreateProdutoDto;

// Estado do store
interface ProdutoState {
  // Map de produtos indexado por SKU para O(1) lookup
  produtos: Record<string, ProdutoItem>;
  // Timestamp da última atualização
  lastUpdated: number | null;
  
  // Métodos
  setProdutos: (produtos: ProdutoItem[]) => void;
  getProdutoBySku: (sku: string) => ProdutoItem | undefined;
  getAllProdutos: () => ProdutoItem[];
  clear: () => void;
}

// Storage customizado usando idb-keyval para IndexedDB
// O idb-keyval já serializa/deserializa automaticamente, mas o Zustand espera strings
const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      console.log(`[produto-store] Buscando no IndexedDB: ${name}`);
      const value = await get(name);
      // Se o valor já for uma string (JSON), retorna diretamente
      // Se for um objeto, serializa
      if (value === null || value === undefined) {
        console.log(`[produto-store] Nenhum valor encontrado para: ${name}`);
        return null;
      }
      const result = typeof value === 'string' ? value : JSON.stringify(value);
      console.log(`[produto-store] Valor encontrado para: ${name}, tamanho: ${result.length} bytes`);
      return result;
    } catch (error) {
      console.error('Error getting item from IndexedDB:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      // O Zustand já passa o valor como string JSON, então salvamos diretamente
      // O idb-keyval pode armazenar strings diretamente
      console.log(`[produto-store] Salvando no IndexedDB: ${name}, tamanho: ${value.length} bytes`);
      await set(name, value);
      console.log(`[produto-store] Salvo com sucesso no IndexedDB: ${name}`);
    } catch (error) {
      console.error('Error setting item in IndexedDB:', error);
      throw error;
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await del(name);
    } catch (error) {
      console.error('Error removing item from IndexedDB:', error);
      throw error;
    }
  },
};

export const useProdutoStore = create<ProdutoState>()(
  persist(
    (set, get) => ({
      produtos: {},
      lastUpdated: null,

      // Define todos os produtos, criando um Record indexado por SKU
      setProdutos: (produtos: ProdutoItem[]) => {
        const produtosMap: Record<string, ProdutoItem> = {};
        
        for (const produto of produtos) {
          if (produto.sku) {
            produtosMap[produto.sku] = produto;
          }
        }

        console.log(`setProdutos: salvando ${Object.keys(produtosMap).length} produtos no store`);
        set({
          produtos: produtosMap,
          lastUpdated: Date.now(),
        });
        console.log('setProdutos: produtos salvos com sucesso');
      },

      // Busca produto por SKU (O(1) lookup)
      getProdutoBySku: (sku: string) => {
        const { produtos } = get();
        return produtos[sku];
      },

      // Retorna todos os produtos como array
      getAllProdutos: () => {
        const { produtos } = get();
        return Object.values(produtos);
      },

      // Limpa o cache de produtos
      clear: () => {
        set({
          produtos: {},
          lastUpdated: null,
        });
      },
    }),
    {
      name: 'produto-store', // Nome da chave no IndexedDB
      storage: createJSONStorage(() => idbStorage),
    }
  )
);
