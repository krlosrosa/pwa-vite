import { findAllProdutos } from '@/_services/api/service/produto/produto';
import { useProdutoStore } from '@/_shared/stores/produtoStore';

/**
 * Hook for syncing products catalog with backend
 * Fetches all products from API and updates the local store
 */
export function useSyncProdutos() {
  const { setProdutos } = useProdutoStore();

  /**
   * Syncs products from API to local store
   * Fetches all products and updates the Zustand store (which persists to IndexedDB)
   */
  async function syncProdutos() {
    try {
      console.log('[useSyncProdutos] Starting products sync...');
      
      // Fetch products from API
      const produtosData = await findAllProdutos();
      
      if (produtosData && Array.isArray(produtosData)) {
        console.log(`[useSyncProdutos] Fetched ${produtosData.length} products from API`);
        
        // Update the store (this will persist to IndexedDB automatically)
        setProdutos(produtosData);
        
        console.log('[useSyncProdutos] Products sync completed successfully');
        return { success: true, count: produtosData.length };
      } else {
        console.warn('[useSyncProdutos] No products data returned from API');
        throw new Error('Nenhum dado retornado da API de produtos');
      }
    } catch (error) {
      console.error('[useSyncProdutos] Error syncing products:', error);
      throw error;
    }
  }

  return {
    syncProdutos,
  };
}