import { useFindAllProdutos, findAllProdutos } from '@/_services/api/service/produto/produto';
import { useProdutoStore, type ProdutoItem } from '@/_shared/stores/produtoStore';

/**
 * Hook para sincronizar o catálogo de produtos local com a API
 * 
 * Lógica:
 * 1. Busca todos os produtos da API usando useFindAllProdutos
 * 2. Ao obter sucesso, atualiza o store local com setProdutos
 * 3. Evita sincronizações redundantes verificando lastUpdated (opcional)
 * 
 * Uso recomendado:
 * - Chamar no início da aplicação ou quando necessário atualizar o catálogo
 * - O store persiste automaticamente no IndexedDB via Zustand persist middleware
 */
export function useProdutoSync() {
  const { setProdutos, lastUpdated } = useProdutoStore();
  
  // Query desabilitada por padrão - só sincroniza manualmente
  const {
    data: produtos,
    isFetching,
    isError,
    error,
    refetch,
  } = useFindAllProdutos({
    query: {
      enabled: false, // Não sincroniza automaticamente
      staleTime: 24 * 60 * 60 * 1000, // Cache por 24 horas
    },
  });

  // Função manual para forçar sincronização
  const syncNow = async () => {
    try {
      // Tenta usar refetch primeiro, se não funcionar, chama diretamente a API
      let produtosData: ProdutoItem[] | undefined;
      
      try {
        const result = await refetch();
        produtosData = result.data;
        
        if (result.error) {
          console.warn('refetch() retornou erro, tentando chamada direta:', result.error);
          // Se refetch falhar, tenta chamada direta
          produtosData = await findAllProdutos();
        }
      } catch (refetchError) {
        console.warn('refetch() falhou, tentando chamada direta:', refetchError);
        // Se refetch falhar completamente, tenta chamada direta
        produtosData = await findAllProdutos();
      }
      
      if (produtosData && Array.isArray(produtosData)) {
        console.log(`Sincronizando ${produtosData.length} produtos...`);
        setProdutos(produtosData);
        console.log('Produtos sincronizados com sucesso!');
        return { data: produtosData, error: null };
      } else {
        console.warn('Nenhum dado retornado da API de produtos');
        throw new Error('Nenhum dado retornado da API de produtos');
      }
    } catch (error) {
      console.error('Error in syncNow:', error);
      throw error;
    }
  };

  return {
    produtos,
    isLoading: isFetching, // Usa isFetching para detectar quando refetch() está em execução
    isError,
    error,
    syncNow,
    lastUpdated,
  };
}
