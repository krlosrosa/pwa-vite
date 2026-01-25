import type { ReactNode } from 'react';
import { cn } from '@/_shared/lib/utils';

interface BottomActionBarProps {
  children: ReactNode;
  className?: string;
}

export function BottomActionBar({ children, className }: BottomActionBarProps) {
  return (
    <div 
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'border-t border-border bg-card',
        'px-4 py-4 safe-area-inset-bottom',
        'shadow-[0_-4px_20px_rgba(0,0,0,0.08)]',
        className
      )}
    >
      <div className="flex gap-3 max-w-lg mx-auto">
        {children}
      </div>
    </div>
  );
}
