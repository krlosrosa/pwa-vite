import { Thermometer } from 'lucide-react';
import { Input } from '@/_shared/components/ui/input';
import { Label } from '@/_shared/components/ui/label';

/**
 * Temperature input step component
 * Collects compartment and product temperatures
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
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="compartmentTemp" className="flex items-center gap-2">
          <Thermometer className="h-4 w-4" />
          Temperatura do Baú (°C)
        </Label>
        <Input
          id="compartmentTemp"
          type="number"
          step="0.1"
          placeholder="Ex: -18"
          value={compartmentTemperature}
          onChange={(e) => onCompartmentChange(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="productTemp" className="flex items-center gap-2">
          <Thermometer className="h-4 w-4" />
          Temperatura do Produto (°C)
        </Label>
        <Input
          id="productTemp"
          type="number"
          step="0.1"
          placeholder="Ex: -15"
          value={productTemperature}
          onChange={(e) => onProductChange(e.target.value)}
        />
      </div>
    </div>
  );
}
