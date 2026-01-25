import { QueryClient } from '@tanstack/react-query';

/**
 * Central QueryClient configuration with offline-first approach
 * 
 * Configuration:
 * - staleTime: 5 minutes - Data is considered fresh for 5 minutes
 * - gcTime: 24 hours - Cached data is kept for 24 hours
 * - networkMode: 'offlineFirst' - Shows cached data when offline
 * - Global error handler for mutations
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours (formerly cacheTime)
      networkMode: 'offlineFirst', // Show cached data when offline
      retry: 3, // Retry failed requests 3 times
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: true, // Refetch when connection is restored
    },
    mutations: {
      retry: 3,
      networkMode: 'offlineFirst',
      onError: (error) => {
        // Global error handler for mutations
        console.error('Mutation error:', error);
        // You can add toast notifications, error tracking, etc. here
      },
    },
  },
});
