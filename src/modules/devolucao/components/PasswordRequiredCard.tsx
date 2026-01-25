import { Lock } from 'lucide-react';
import { Card, CardContent } from '@/_shared/components/ui/card';

/**
 * Warning card displayed when password is required to continue
 */
export function PasswordRequiredCard() {
  return (
    <Card className="border-warning/50 bg-warning/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Demanda em andamento</p>
            <p className="text-sm text-muted-foreground mt-1">
              Esta demanda já foi iniciada. Será necessário informar a senha de 4 dígitos para continuar.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
