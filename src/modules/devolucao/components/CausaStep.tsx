import { Card, CardContent } from '@/_shared/components/ui/card';
import { Label } from '@/_shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/_shared/components/ui/select';
import { getCausasByNatureza } from '../consts/causas-check-list';

/**
 * Step component for selecting damage cause
 */
export function CausaStep({
  natureza,
  causaAvaria,
  onCausaChange,
}: {
  natureza: string | null;
  causaAvaria: string | null;
  onCausaChange: (value: string) => void;
}) {
  const filteredCausas = natureza ? getCausasByNatureza(natureza as any) : [];

  return (
    <Card className="p-0">
      <CardContent className="p-4 space-y-4">
        <div>
          <Label>Causa da Avaria</Label>
          {filteredCausas.length === 0 ? (
            <div className="mt-2 p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                Não há causas cadastradas para a natureza selecionada.
              </p>
            </div>
          ) : (
            <Select
              value={causaAvaria ?? ''}
              onValueChange={onCausaChange}
            >
              <SelectTrigger className="mt-1.5 w-full">
                <SelectValue placeholder="Selecione a causa" />
              </SelectTrigger>
              <SelectContent>
                {filteredCausas.map((causa) => (
                  <SelectItem key={causa.causaAvaria} value={causa.causaAvaria}>
                    {causa.causaAvaria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
