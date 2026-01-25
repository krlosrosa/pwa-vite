import { RefreshCw } from 'lucide-react';
import { Button } from '@/_shared/components/ui/button';
import { cn } from '@/_shared/lib/utils';

/**
 * Button component for triggering data synchronization
 */
export function SyncButton({
  onClick,
  disabled,
  isLoading,
  className,
}: {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Sincronizar dados"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={className}
    >
      <RefreshCw className={cn('h-5 w-5', isLoading && 'animate-spin')} />
    </Button>
  );
}
