import { AlertTriangle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardTitle } from '@/_shared/components/ui/card';
import { Button } from '@/_shared/components/ui/button';
import type { AnomalyRecord } from '@/_shared/db/database';

/**
 * Card component displaying list of registered anomalies for an item
 */
export function AnomaliesList({ 
  anomalies, 
  onDelete 
}: { 
  anomalies: AnomalyRecord[];
  onDelete?: (id: number) => void;
}) {
  if (anomalies.length === 0) {
    return null;
  }

  return (
    <Card className="border-warning/50 p-2">
      <CardContent className="space-y-2 p-1">
        <CardTitle className="text-base text-warning flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Anomalias Registradas ({anomalies.length})
        </CardTitle>
        {anomalies.map((anomaly) => (
          <div key={anomaly.id} className="text-sm p-2 bg-muted rounded-md flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="font-medium">Caixas: {anomaly?.quantityBox || 0} | Unidades: {anomaly?.quantityUnit || 0}</p>
              <p className="text-muted-foreground">{anomaly.description}</p>
            </div>
            {onDelete && anomaly.id && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(anomaly.id!)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                aria-label="Excluir anomalia"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
