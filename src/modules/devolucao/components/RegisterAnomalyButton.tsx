import { AlertTriangle } from 'lucide-react';
import { Button } from '@/_shared/components/ui/button';
import type { ConferenceRecord } from '@/_shared/db/database';

/**
 * Button component for navigating to anomaly registration page
 * Only enabled after item conference is confirmed
 */
export function RegisterAnomalyButton({
  conference,
  onNavigate,
}: {
  conference: ConferenceRecord | null;
  onNavigate: () => void;
}) {
  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onNavigate}
        disabled={!conference?.isChecked}
      >
        <AlertTriangle className="h-4 w-4 mr-2" />
        Registrar Anomalia
      </Button>
      {!conference?.isChecked && (
        <p className="text-xs text-muted-foreground text-center">
          Confirme a conferência do item antes de registrar anomalias
        </p>
      )}
    </>
  );
}
