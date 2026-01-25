import type { StepType, ChecklistData } from '../hooks/useChecklist';
import { PhotoCapture } from './PhotoCapture';
import { TemperatureStep } from './TemperatureStep';
import { ObservationsStep } from './ObservationsStep';

/**
 * Renders the appropriate content for each checklist step
 */
export function ChecklistStepContent({
  step,
  data,
  updateField,
}: {
  step: StepType;
  data: ChecklistData;
  updateField: (field: keyof ChecklistData, value: string) => void;
}) {
  switch (step) {
    case 'truck_closed_photo':
      return (
        <PhotoCapture
          label="Foto do caminhão fechado"
          value={data.truckClosedPhoto}
          onChange={(photo) => updateField('truckClosedPhoto', photo)}
        />
      );
    case 'truck_open_photo':
      return (
        <PhotoCapture
          label="Foto do caminhão aberto"
          value={data.truckOpenPhoto}
          onChange={(photo) => updateField('truckOpenPhoto', photo)}
        />
      );
    case 'temperature':
      return (
        <TemperatureStep
          compartmentTemperature={data.compartmentTemperature}
          productTemperature={data.productTemperature}
          onCompartmentChange={(value) => updateField('compartmentTemperature', value)}
          onProductChange={(value) => updateField('productTemperature', value)}
        />
      );
    case 'observations':
      return (
        <ObservationsStep
          observations={data.observations}
          onChange={(value) => updateField('observations', value)}
        />
      );
  }
}
