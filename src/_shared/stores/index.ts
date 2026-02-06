// Exporta todos os stores e o banco de dados
export { db } from '../db/database';
export type { ChecklistRecord, ConferenceRecord, AnomalyRecord, DemandRecord, FinishPhotoRecord } from '../db/database';

export { useChecklistStore } from './checklistStore';
export { useConferenceStore } from './conferenceStore';
export { useDemandStore } from './demandStore';
export { useFinishPhotoStore } from './finishPhotoStore';
