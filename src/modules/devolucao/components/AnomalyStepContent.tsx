import type { AnomalyStep, AnomalyFormData } from '../hooks/useAnomalyRegistration';
import { NaturezaStep } from './NaturezaStep';
import { TipoStep } from './TipoStep';
import { CausaStep } from './CausaStep';
import { AnomalyPhotosStep } from './AnomalyPhotosStep';
import { AnomalyObservationStep } from './AnomalyObservationStep';
import type { NaturezaAnomalia, TipoNaoConformidade } from '../consts/causas-check-list';

/**
 * Renders the appropriate content for each anomaly registration step
 */
export function AnomalyStepContent({
  step,
  sku,
  description,
  formData,
  onNaturezaChange,
  onTipoChange,
  onCausaChange,
  onPhotoAdd,
  onPhotoRemove,
  onObservationChange,
  onQuantityBoxChange,
  onQuantityUnitChange,
}: {
  step: AnomalyStep;
  sku: string;
  description: string;
  formData: AnomalyFormData;
  onNaturezaChange: (value: NaturezaAnomalia) => void;
  onTipoChange: (value: TipoNaoConformidade) => void;
  onCausaChange: (value: string) => void;
  onPhotoAdd: (base64: string) => void;
  onPhotoRemove: (index: number) => void;
  onObservationChange: (value: string) => void;
  onQuantityBoxChange?: (value: string) => void;
  onQuantityUnitChange?: (value: string) => void;
}) {
  switch (step) {
    case 'natureza':
      return (
        <NaturezaStep
          sku={sku}
          description={description}
          natureza={formData.natureza}
          onNaturezaChange={onNaturezaChange}
        />
      );
    case 'tipo':
      return (
        <TipoStep
          tipoNaoConformidade={formData.tipoNaoConformidade}
          onTipoChange={onTipoChange}
        />
      );
    case 'causa':
      return (
        <CausaStep
          natureza={formData.natureza}
          causaAvaria={formData.causaAvaria}
          onCausaChange={onCausaChange}
        />
      );
    case 'fotos':
      return (
        <AnomalyPhotosStep
          photos={formData.photos}
          onPhotoAdd={onPhotoAdd}
          onPhotoRemove={onPhotoRemove}
        />
      );
    case 'observacao':
      return (
        <AnomalyObservationStep
          sku={sku}
          formData={formData}
          onObservationChange={onObservationChange}
          onQuantityBoxChange={onQuantityBoxChange ?? (() => {})}
          onQuantityUnitChange={onQuantityUnitChange ?? (() => {})}
        />
      );
  }
}
