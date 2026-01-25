import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/_shared/components/ui/card';

/**
 * Error state component for demand list when API fails
 */
export function DemandListError({ message = 'Erro ao carregar demandas' }: { message?: string }) {
  return (
    <div className="p-4">
      <Card className="border-destructive/50">
        <CardContent className="p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}
