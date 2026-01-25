import { Progress } from '@/_shared/components/ui/progress';
import { cn } from '@/_shared/lib/utils';

/**
 * Progress indicator component for multi-step forms
 * Shows current step, progress percentage, and step labels
 */
export function ProgressIndicator({
  currentStep,
  totalSteps,
  labels,
}: {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Passo {currentStep + 1} de {totalSteps}</span>
        <span className="font-medium">{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} />
      {labels.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {labels.map((label, index) => (
            <div
              key={index}
              className={cn(
                'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                index <= currentStep
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
