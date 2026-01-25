import { Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/_shared/components/ui/card';
import { PasswordInput } from './PasswordInput';

/**
 * Card component for password input step
 */
export function PasswordStepCard({
  password,
  onPasswordChange,
  error,
}: {
  password: string;
  onPasswordChange: (value: string) => void;
  error?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Senha da Demanda
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Informe a senha de 4 dígitos para continuar a conferência.
        </p>
        <PasswordInput
          value={password}
          onChange={onPasswordChange}
          error={error}
        />
      </CardContent>
    </Card>
  );
}
