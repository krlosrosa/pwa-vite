import { Database, Package, AlertTriangle, FileText, ClipboardList } from 'lucide-react';
import { PageContainer } from '@/_shared/components/layout/PageContainer';
import { PageHeader } from '@/_shared/components/layout/PageHeader';
import { Card, CardContent } from '@/_shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/_shared/components/ui/tabs';
import { useDebugData } from '../hooks/useDebugData';
import { DebugTable } from '../components/DebugTable';
import { DangerZone } from '../components/DangerZone';
import type { ChecklistRecord, ConferenceRecord, AnomalyRecord, DemandRecord } from '@/_shared/db/database';

/**
 * Debug/Diagnostic page for monitoring local data (Dexie) and state (Zustand)
 * Accessible via hidden button in UserMenu (production-ready)
 */
export default function DebugPage() {
  const {
    checklists,
    conferences,
    anomalies,
    demands,
    produtos,
    isOnline,
    imagesTotalSize,
    imagesTotalSizeFormatted,
    deleteChecklist,
    deleteConference,
    deleteAnomaly,
    deleteDemand,
    clearAllData,
    exportDatabase,
  } = useDebugData();

  return (
    <PageContainer>
      <PageHeader
        title="Debug & Diagnóstico"
        subtitle="Monitoramento de dados locais"
        showBack
      />

      <div className="p-2 sm:p-4 space-y-3 sm:space-y-4">
        {/* Images Size Info Card */}
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Tamanho Total das Imagens</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Tamanho total de todas as imagens armazenadas (checklists e anomalias)
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-600">
                  {imagesTotalSizeFormatted || '0 Bytes'}
                </p>
                <p className="text-xs text-muted-foreground">
                  ({imagesTotalSize?.toLocaleString() || '0'} bytes)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <DangerZone
          isOnline={isOnline}
          onClearAll={clearAllData}
          onExportDatabase={exportDatabase}
        />
        <Tabs defaultValue="checklists" className="w-full">
          <div className="overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0">
            <TabsList className="inline-flex w-auto min-w-full sm:grid sm:grid-cols-5 h-auto">
              <TabsTrigger value="checklists" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden sm:inline">Checklists</span>
                <span className="sm:hidden">Check</span>
                <span className="ml-1">({checklists.length})</span>
              </TabsTrigger>
              <TabsTrigger value="conferences" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">
                <Database className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden sm:inline">Conferências</span>
                <span className="sm:hidden">Conf</span>
                <span className="ml-1">({conferences.length})</span>
              </TabsTrigger>
              <TabsTrigger value="anomalies" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">
                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden sm:inline">Anomalias</span>
                <span className="sm:hidden">Anom</span>
                <span className="ml-1">({anomalies.length})</span>
              </TabsTrigger>
              <TabsTrigger value="demands" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">
                <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden sm:inline">Demandas</span>
                <span className="sm:hidden">Dem</span>
                <span className="ml-1">({demands.length})</span>
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">
                <Package className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden sm:inline">Produtos</span>
                <span className="sm:hidden">Prod</span>
                <span className="ml-1">({produtos.length})</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="checklists" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <DebugTable<ChecklistRecord>
                  data={checklists}
                  columns={[
                    { key: 'id', label: 'ID' },
                    { key: 'demandaId', label: 'Demanda ID' },
                    {
                      key: 'temperaturaBau',
                      label: 'Temp. Baú',
                      render: (value) => (value ? String(value) : '-'),
                    },
                    {
                      key: 'temperaturaProduto',
                      label: 'Temp. Produto',
                      render: (value) => (value ? String(value) : '-'),
                    },
                  ]}
                  onDelete={deleteChecklist}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conferences" className="mt-3 sm:mt-4">
            <Card>
              <CardContent className="p-2 sm:p-4">
                <DebugTable<ConferenceRecord>
                  data={conferences}
                  columns={[
                    { key: 'id', label: 'ID' },
                    { key: 'itemId', label: 'Item ID' },
                    { key: 'demandaId', label: 'Demanda ID' },
                    { key: 'sku', label: 'SKU' },
                    {
                      key: 'expectedQuantity',
                      label: 'Esperado',
                      render: (value) => String(value ?? 0),
                    },
                    {
                      key: 'checkedQuantity',
                      label: 'Conferido',
                      render: (value) => String(value ?? 0),
                    },
                    {
                      key: 'boxQuantity',
                      label: 'Caixas',
                      render: (value) => value ? String(value) : '-',
                    },
                    {
                      key: 'lote',
                      label: 'Lote',
                      render: (value) => (value ? String(value) : '-'),
                    },
                    {
                      key: 'isExtra',
                      label: 'Extra',
                      render: (value) => value ? 'Sim' : 'Não',
                    },
                  ]}
                  onDelete={deleteConference}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="anomalies" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <DebugTable<AnomalyRecord>
                  data={anomalies}
                  columns={[
                    { key: 'id', label: 'ID' },
                    { key: 'itemId', label: 'Item ID' },
                    { key: 'demandaId', label: 'Demanda ID' },
                    { key: 'sku', label: 'SKU' },
                    { key: 'quantity', label: 'Quantidade' },
                    {
                      key: 'description',
                      label: 'Descrição',
                      render: (value) => (
                        <span className="max-w-xs truncate block" title={String(value)}>
                          {String(value)}
                        </span>
                      ),
                    },
                    {
                      key: 'photos',
                      label: 'Fotos',
                      render: (value) => {
                        const photos = value as string[];
                        return photos ? `${photos.length} foto(s)` : '0';
                      },
                    },
                  ]}
                  onDelete={deleteAnomaly}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="demands" className="mt-3 sm:mt-4">
            <Card>
              <CardContent className="p-2 sm:p-4">
                <DebugTable<DemandRecord>
                  data={demands}
                  columns={[
                    { key: 'id', label: 'ID' },
                    { key: 'demandaId', label: 'Demanda ID' },
                    {
                      key: 'doca',
                      label: 'Doca',
                      render: (value) => (value ? String(value) : '-'),
                    },
                    {
                      key: 'placa',
                      label: 'Placa',
                      render: (value) => (value ? String(value) : '-'),
                    },
                    {
                      key: 'motorista',
                      label: 'Motorista',
                      render: (value) => (value ? String(value) : '-'),
                    },
                    {
                      key: 'status',
                      label: 'Status',
                      render: (value) => (value ? String(value) : '-'),
                    },
                    {
                      key: 'data',
                      label: 'Dados',
                      render: (value) => {
                        const data = value as Record<string, unknown>;
                        return data ? Object.keys(data).length + ' campo(s)' : '0';
                      },
                    },
                  ]}
                  onDelete={deleteDemand}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="mt-3 sm:mt-4">
            <Card>
              <CardContent className="p-2 sm:p-4">
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm min-w-[600px]">
                    <thead>
                      <tr className="border-b">
                        <th className="h-10 px-2 text-left font-medium">SKU</th>
                        <th className="h-10 px-2 text-left font-medium">Descrição</th>
                        <th className="h-10 px-2 text-left font-medium">Un/Caixa</th>
                        <th className="h-10 px-2 text-left font-medium">Segmento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {produtos.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center text-muted-foreground py-8">
                            Nenhum produto no catálogo
                          </td>
                        </tr>
                      ) : (
                        produtos.map((produto) => (
                          <tr key={produto.sku} className="border-b">
                            <td className="p-2 font-mono">{produto.sku}</td>
                            <td className="p-2">{produto.descricao}</td>
                            <td className="p-2">{produto.unPorCaixa}</td>
                            <td className="p-2">{produto.segmento}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
