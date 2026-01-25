import { Card, CardContent } from '@/_shared/components/ui/card';
import { Label } from '@/_shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/_shared/components/ui/select';
import { naturezaAnomaliaOptions, type NaturezaAnomalia } from '../consts/causas-check-list';

/**
 * Step component for selecting anomaly nature
 */
export function NaturezaStep({
  sku,
  description,
  natureza,
  onNaturezaChange,
}: {
  sku: string;
  description: string;
  natureza: NaturezaAnomalia | null;
  onNaturezaChange: (value: NaturezaAnomalia) => void;
}) {
  return (
    <Card className="p-0">
      <CardContent className="p-4 space-y-4">
        <div className="p-3 bg-muted rounded-lg">
          <Label className="text-muted-foreground text-xs">SKU do Item</Label>
          <p className="font-mono font-medium">{sku}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div>
          <Label>Natureza da Anomalia</Label>
          <Select
            value={natureza ?? ''}
            onValueChange={(value) => onNaturezaChange(value as NaturezaAnomalia)}
          >
            <SelectTrigger className="mt-1.5 w-full">
              <SelectValue placeholder="Selecione a natureza" />
            </SelectTrigger>
            <SelectContent>
              {naturezaAnomaliaOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
