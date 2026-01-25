import type { ConferenceRecord, AnomalyRecord, ChecklistRecord } from '@/_shared/db/database';
import type { AddConferenciaCegaDto, AddCheckListDto } from '@/_services/api/model';

/**
 * Maps ConferenceRecord to AddConferenciaCegaDto for API sync
 */
export function mapConferenceToApiDto(conference: ConferenceRecord): AddConferenciaCegaDto {
  return {
    sku: conference.sku,
    descricao: conference.description,
    quantidadeUnidades: conference.checkedQuantity,
    quantidadeCaixas: conference.boxQuantity ?? 0,
    lote: conference.lote ?? '',
  };
}

/**
 * Maps ChecklistRecord to AddCheckListDto for API sync
 */
export function mapChecklistToApiDto(checklist: ChecklistRecord, demandaId: string): AddCheckListDto {
  return {
    demandaId,
    fotoBauAberto: checklist.fotoBauAberto,
    fotoBauFechado: checklist.fotoBauFechado,
    temperaturaBau: checklist.temperaturaBau,
    temperaturaProduto: checklist.temperaturaProduto,
    anomalias: checklist.anomalias,
  };
}

/**
 * Filters unsynced records for a specific demand
 */
export function filterUnsyncedByDemand<T extends { demandaId: string; synced: boolean }>(
  records: T[],
  demandaId: string
): T[] {
  return records.filter(record => String(record.demandaId) === String(demandaId) && !record.synced);
}

/**
 * Prepares sync payload for a demand
 */
export interface DemandSyncPayload {
  conferences: AddConferenciaCegaDto[];
  checklist: AddCheckListDto | null;
  conferenceIds: number[];
  anomalyIds: number[];
  checklistId: number | null;
}

/**
 * Prepares sync payload for a demand
 * @param demandaId - The demand ID
 * @param conferences - All conferences for the demand (already filtered by demand)
 * @param anomalies - All anomalies for the demand (already filtered by demand)
 * @param checklist - Checklist for the demand (if exists)
 * @param includeOnlyUnsynced - If true, filters to only unsynced records. If false, includes all records.
 */
export function prepareDemandSyncPayload(
  demandaId: string,
  conferences: ConferenceRecord[],
  anomalies: AnomalyRecord[],
  checklist: ChecklistRecord | undefined,
  includeOnlyUnsynced: boolean = false
): DemandSyncPayload {
  // Filter by demand and optionally by sync status (type-agnostic comparison)
  let demandConferences = conferences.filter(c => String(c.demandaId) === String(demandaId));
  let demandAnomalies = anomalies.filter(a => String(a.demandaId) === String(demandaId));

  if (includeOnlyUnsynced) {
    demandConferences = demandConferences.filter(c => !c.synced);
    demandAnomalies = demandAnomalies.filter(a => !a.synced);
  }

  // Map to API DTOs
  const conferenceDtos = demandConferences.map(mapConferenceToApiDto);
  
  // Map anomalies to conference DTOs (anomalies are also sent as conferences)
  const anomalyDtos: AddConferenciaCegaDto[] = demandAnomalies.map(anomaly => ({
    sku: anomaly.sku,
    descricao: anomaly.description,
    quantidadeUnidades: anomaly.quantity,
    quantidadeCaixas: 0,
    lote: anomaly.lote ?? '',
  }));

  // Combine conferences and anomalies
  const allConferenceDtos = [...conferenceDtos, ...anomalyDtos];

  // Map checklist if exists
  const checklistDto = checklist 
    ? mapChecklistToApiDto(checklist, demandaId)
    : null;

  return {
    conferences: allConferenceDtos,
    checklist: checklistDto,
    conferenceIds: demandConferences.map(c => c.id!).filter((id): id is number => id !== undefined),
    anomalyIds: demandAnomalies.map(a => a.id!).filter((id): id is number => id !== undefined),
    checklistId: checklist?.id ?? null,
  };
}
