import type { DemandDto } from '@/_services/api/model';
import { DemandCard } from '@/_shared/components/demandaCard';
import { PageContainer } from '@/_shared/components/layout/PageContainer';
import { PageHeader } from '@/_shared/components/layout/PageHeader';
import { useDemandList } from '../hooks/useDemandList';
import { DemandListSkeleton, DemandListEmptyState, DemandListError } from '../components';
import { SyncButton } from '../components/SyncButton';

export default function DemandListPage() {
  const {
    demands,
    isLoading,
    isError,
    draftChecklists,
    demandStoreDataMap,
    refreshList,
    handleSelectDemand,
  } = useDemandList();

  if (isError) {
    return (
      <PageContainer>
        <PageHeader title="Gestão de Demandas" subtitle="Erro" showBack />
        <DemandListError />
      </PageContainer>
    );
  }

  if (isLoading) {
    return <DemandListSkeleton />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Gestão de Demandas"
        subtitle={`${demands?.length ?? 0} demanda(s) ativa(s)`}
        rightContent={
          <SyncButton
            onClick={refreshList}
            disabled={false}
            isLoading={false}
          />
        }
      />

      <div className="p-4 space-y-3">
        {demands?.length === 0 ? (
          <DemandListEmptyState onRefresh={refreshList} />
        ) : (
          demands?.sort((a, b) => a.id - b.id).map((demand: DemandDto) => (
            <DemandCard
              key={demand.id}
              demand={demand}
              hasDraft={draftChecklists.has(demand.id.toString())}
              demandStoreData={demandStoreDataMap.get(demand.id.toString())}
              onClick={() => handleSelectDemand(demand.id.toString())}
            />
          ))
        )}
      </div>
    </PageContainer>
  );
}
