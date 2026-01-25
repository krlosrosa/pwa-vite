import { Search } from 'lucide-react';
import { Input } from '@/_shared/components/ui/input';

/**
 * Component for filtering/searching items by SKU or description
 */
export function FilterInput({ 
  placeholder,
  value,
  onChange
}: { 
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        className="pl-9"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
