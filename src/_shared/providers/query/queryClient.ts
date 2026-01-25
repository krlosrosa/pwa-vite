// src/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 3, // número de tentativas em caso de erro
      refetchOnWindowFocus: false, // não refaz a query ao focar a janela
    },
    mutations: {
      retry: 3,
    },
  },
});
