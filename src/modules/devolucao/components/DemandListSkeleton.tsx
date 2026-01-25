import { Skeleton } from '@/_shared/components/ui/skeleton';

/**
 * Skeleton loading component for demand list
 */
export function DemandListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-lg" />
      ))}
    </div>
  );
}
