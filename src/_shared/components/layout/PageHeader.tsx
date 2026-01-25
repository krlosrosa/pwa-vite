import { ArrowLeft } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/_shared/components/ui/button';
import { cn } from '@/_shared/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backTo?: string | { to: string; params?: Record<string, string> };
  rightContent?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  showBack = false,
  backTo,
  rightContent,
  className,
}: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      if (typeof backTo === 'string') {
        navigate({ to: backTo });
      } else {
        navigate(backTo);
      }
    } else {
      navigate({ to: '/demands' });
    }
  };

  return (
    <header 
      className={cn(
        'sticky top-0 z-40 border-b border-border bg-card px-4 py-3',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              aria-label="Voltar"
              className="shrink-0 -ml-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-foreground truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {rightContent && (
          <div className="shrink-0">
            {rightContent}
          </div>
        )}
      </div>
    </header>
  );
}
