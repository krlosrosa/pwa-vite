import { Thermometer } from 'lucide-react';
import { Input } from '@/_shared/components/ui/input';
import { Label } from '@/_shared/components/ui/label';
import { cn } from '@/_shared/lib/utils';

/**
 * Temperature input step component
 * Collects compartment and product temperatures (obrigatórios)
 */
export function TemperatureStep({
  compartmentTemperature,
  productTemperature,
  onCompartmentChange,
  onProductChange,
}: {
  compartmentTemperature: string;
  productTemperature: string;
  onCompartmentChange: (value: string) => void;
  onProductChange: (value: string) => void;
}) {
  const tempBauFilled = (compartmentTemperature ?? '').trim() !== '';
  const tempProdutoFilled = (productTemperature ?? '').trim() !== '';

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Preencha a temperatura do baú e do produto para continuar. Ambos são obrigatórios.
      </p>
      <div>
        <Label htmlFor="compartmentTemp" className="flex items-center gap-2">
          <Thermometer className="h-4 w-4" />
          Temperatura do Baú (°C) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="compartmentTemp"
          type="number"
          step="0.1"
          placeholder="Ex: -18"
          value={compartmentTemperature}
          onChange={(e) => onCompartmentChange(e.target.value)}
          className={cn(!tempBauFilled && 'border-destructive/50')}
        />
        {!tempBauFilled && (
          <p className="text-xs text-destructive mt-1">Obrigatório</p>
        )}
      </div>
      <div>
        <Label htmlFor="productTemp" className="flex items-center gap-2">
          <Thermometer className="h-4 w-4" />
          Temperatura do Produto (°C) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="productTemp"
          type="number"
          step="0.1"
          placeholder="Ex: -15"
          value={productTemperature}
          onChange={(e) => onProductChange(e.target.value)}
          className={cn(!tempProdutoFilled && 'border-destructive/50')}
        />
        {!tempProdutoFilled && (
          <p className="text-xs text-destructive mt-1">Obrigatório</p>
        )}
      </div>
    </div>
  );
}
