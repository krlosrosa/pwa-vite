import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/_shared/components/ui/input';
import { Button } from '@/_shared/components/ui/button';
import { cn } from '@/_shared/lib/utils';

/**
 * Password input component with show/hide toggle
 * Supports 4-digit password validation
 */
export function PasswordInput({
  value,
  onChange,
  error,
  placeholder = 'Digite a senha de 4 dígitos',
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={4}
          className={cn('pr-10', error && 'border-destructive')}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
