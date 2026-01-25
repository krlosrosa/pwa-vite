import { MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/_shared/components/ui/card';
import { Input } from '@/_shared/components/ui/input';
import { Label } from '@/_shared/components/ui/label';

/**
 * Card component for dock information input
 */
export function DockInfoCard({
  dock,
  onDockChange,
}: {
  dock: string;
  onDockChange: (value: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Informações da Doca
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="dock">Doca</Label>
          <Input
            id="dock"
            placeholder="Ex: Doca 01"
            value={dock}
            onChange={(e) => onDockChange(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
