import { MapPin, Truck, Package, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/_shared/components/ui/card';
import { Input } from '@/_shared/components/ui/input';
import { Label } from '@/_shared/components/ui/label';
import { Badge } from '@/_shared/components/ui/badge';

/**
 * Card component for validation information input
 * Combines dock, vehicle, and pallets information
 */
export function ValidationInfoCard({
  dock,
  licensePlate,
  paletesRecebidos,
  quantidadePaletesEsperada,
  isCargaSegregada,
  onDockChange,
  onLicensePlateChange,
  onPaletesRecebidosChange,
}: {
  dock: string;
  licensePlate: string;
  paletesRecebidos: string;
  quantidadePaletesEsperada: number | null;
  isCargaSegregada: boolean;
  onDockChange: (value: string) => void;
  onLicensePlateChange: (value: string) => void;
  onPaletesRecebidosChange: (value: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-4 w-4" />
          Informações de Validação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Doca */}
        <div className="space-y-2">
          <Label htmlFor="dock" className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Doca
          </Label>
          <Input
            id="dock"
            placeholder="Ex: Doca 01"
            value={dock}
            onChange={(e) => onDockChange(e.target.value)}
            className="text-lg"
          />
        </div>

        {/* Placa do Veículo */}
        <div className="space-y-2">
          <Label htmlFor="licensePlate" className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-muted-foreground" />
            Placa do Caminhão
          </Label>
          <Input
            id="licensePlate"
            placeholder="Ex: ABC-1234"
            value={licensePlate}
            onChange={(e) => onLicensePlateChange(e.target.value)}
            className="text-lg"
          />
        </div>

        {/* Informações da API */}
        {(quantidadePaletesEsperada !== null || isCargaSegregada) && (
          <div className="p-3 bg-muted/50 rounded-md space-y-2 border border-border">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Info className="h-4 w-4 text-primary" />
              Informações da Demanda
            </div>
            
            {quantidadePaletesEsperada !== null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Quantidade de Paletes Esperada:</span>
                <Badge variant="outline" className="font-semibold">
                  {quantidadePaletesEsperada} palete{quantidadePaletesEsperada !== 1 ? 's' : ''}
                </Badge>
              </div>
            )}
            
            {isCargaSegregada && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Carga Segregada:</span>
                <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">
                  Sim
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Quantidade de Paletes Recebidos */}
        <div className="space-y-2">
          <Label htmlFor="paletesRecebidos">
            Quantidade de Paletes Recebidos
          </Label>
          <Input
            id="paletesRecebidos"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="0"
            value={paletesRecebidos}
            onChange={(e) => {
              const value = e.target.value;
              // Allow empty string or valid number
              if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
                onPaletesRecebidosChange(value);
              }
            }}
            className="text-lg font-semibold"
          />
          {quantidadePaletesEsperada !== null && (
            <p className="text-xs text-muted-foreground">
              Esperado: {quantidadePaletesEsperada} palete{quantidadePaletesEsperada !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
