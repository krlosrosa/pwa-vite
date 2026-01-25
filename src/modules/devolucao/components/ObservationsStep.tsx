import { MessageSquare } from 'lucide-react';
import { Label } from '@/_shared/components/ui/label';
import { Textarea } from '@/_shared/components/ui/textarea';

/**
 * Observations input step component
 * Collects optional observations about the load
 */
export function ObservationsStep({
  observations,
  onChange,
}: {
  observations: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label htmlFor="observations" className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Observações
      </Label>
      <Textarea
        id="observations"
        placeholder="Adicione observações sobre a carga (opcional)"
        rows={4}
        value={observations || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
