import type { ReactNode } from 'react';
import { cn } from '@/_shared/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  hasBottomBar?: boolean;
}

export function PageContainer({ 
  children, 
  className,
  hasBottomBar = false 
}: PageContainerProps) {
  return (
    <main 
      className={cn(
        'min-h-screen bg-background',
        hasBottomBar && 'pb-24',
        className
      )}
    >
      {children}
    </main>
  );
}
