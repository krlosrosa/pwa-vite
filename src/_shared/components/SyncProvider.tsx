import { useSyncManager } from '@/hooks/logic/use-sync-manager';

/**
 * Component that initializes and manages automatic synchronization.
 * Should be placed at the root of the app.
 */
export function SyncProvider({ children }: { children: React.ReactNode }) {
  // Initialize sync manager - it will handle automatic syncing
  useSyncManager();

  return <>{children}</>;
}
