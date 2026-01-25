import { Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/_shared/components/ui/card';
import { Input } from '@/_shared/components/ui/input';
import { Label } from '@/_shared/components/ui/label';

/**
 * Card component for vehicle information input
 */
export function VehicleInfoCard({
  licensePlate,
  onLicensePlateChange,
}: {
  licensePlate: string;
  onLicensePlateChange: (value: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Truck className="h-4 w-4" />
          Dados do Veículo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <Label htmlFor="licensePlate">Placa do Caminhão</Label>
          <Input
            id="licensePlate"
            placeholder="Ex: ABC-1234"
            value={licensePlate}
            onChange={(e) => onLicensePlateChange(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
