import { useMemo } from 'react';
import { useListarDemandasEmAbertoDevolucaoMobile } from '@/_services/api/service/devolucao-mobile/devolucao-mobile';
import type { ListarDemandasDto } from '@/_services/api/model';
import { ListarDemandasDtoStatus } from '@/_services/api/model';

/**
 * Business hook for fetching demands list with offline-first support
 * 
 * Features:
 * - Filters demands (NOT_STARTED and IN_PROGRESS first)
 * - Provides isLoading state
 * - Detects offline status
 * - Exposes refetch function for manual refresh
 * 
 * @param centerId - The center ID to fetch demands for
 * @returns Object with demands, isLoading, isOffline, and refetch function
 */
export function useDemandsQuery(centerId: string) {
  const {
    data: rawDemands,
    isLoading,
    isPlaceholderData,
    refetch,
    isFetching,
  } = useListarDemandasEmAbertoDevolucaoMobile(centerId, {
    query: {
      // Enable query only if centerId is provided
      enabled: !!centerId,
    },
  });

  // Filter and sort demands: prioritize active/awaiting statuses first
  // Priority order:
  // 1. AGUARDANDO_LIBERACAO (waiting for release - not started)
  // 2. AGUARDANDO_CONFERENCIA (waiting for conference - ready to start)
  // 3. EM_CONFERENCIA (in conference - in progress)
  // Then other statuses (CONFERENCIA_FINALIZADA, FINALIZADO, CANCELADO)
  const demands = useMemo(() => {
    if (!rawDemands) return [];

    const priorityDemands: ListarDemandasDto[] = [];
    const otherDemands: ListarDemandasDto[] = [];

    rawDemands.forEach((demand) => {
      const status = demand.status;
      if (
        status === ListarDemandasDtoStatus.AGUARDANDO_LIBERACAO ||
        status === ListarDemandasDtoStatus.AGUARDANDO_CONFERENCIA ||
        status === ListarDemandasDtoStatus.EM_CONFERENCIA
      ) {
        priorityDemands.push(demand);
      } else {
        otherDemands.push(demand);
      }
    });

    // Return priority demands first, then others
    return [...priorityDemands, ...otherDemands];
  }, [rawDemands]);

  // Detect offline status
  // isPlaceholderData indicates we're showing cached data
  const isOffline = useMemo(() => {
    return isPlaceholderData || (!navigator.onLine && rawDemands !== undefined);
  }, [isPlaceholderData, rawDemands]);

  return {
    demands,
    isLoading: isLoading && !rawDemands, // Only show loading if we don't have cached data
    isOffline,
    refetch,
    isFetching, // Indicates if a fetch is in progress (useful for pull-to-refresh)
  };
}
