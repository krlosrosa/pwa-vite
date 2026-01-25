import { Package, RefreshCw } from 'lucide-react';
import { EmptyState } from '@/_shared/components/ui/EmptyState';
import { Button } from '@/_shared/components/ui/button';

/**
 * Empty state component for demand list when no demands are available
 */
export function DemandListEmptyState({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <EmptyState
      icon={<Package className="h-8 w-8" />}
      title="Nenhuma demanda ativa"
      description="Não há demandas abertas ou em andamento no momento."
      action={
        onRefresh ? (
          <Button onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        ) : undefined
      }
    />
  );
}
