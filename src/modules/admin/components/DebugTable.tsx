import { Trash2 } from 'lucide-react';
import { Badge } from '@/_shared/components/ui/badge';
import { Button } from '@/_shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/_shared/components/ui/table';
import { format } from 'date-fns';

/**
 * Generic table component for displaying debug data
 */
export function DebugTable<T extends { id?: number; synced: boolean; createdAt: number; updatedAt: number }>({
  data,
  columns,
  onDelete,
}: {
  data: T[];
  columns: Array<{
    key: keyof T | string;
    label: string;
    render?: (value: unknown, row: T) => React.ReactNode;
  }>;
  onDelete?: (id: number) => void;
}) {
  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), 'dd/MM/yyyy HH:mm:ss');
  };

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table className="min-w-[800px] sm:min-w-0">
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={String(col.key)} className="text-xs sm:text-sm">{col.label}</TableHead>
            ))}
            <TableHead className="w-[80px] sm:w-[100px] text-xs sm:text-sm">Status</TableHead>
            <TableHead className="w-[120px] sm:w-[150px] text-xs sm:text-sm">Criado em</TableHead>
            <TableHead className="w-[120px] sm:w-[150px] text-xs sm:text-sm">Atualizado em</TableHead>
            {onDelete && <TableHead className="w-[60px] sm:w-[80px] text-xs sm:text-sm">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + (onDelete ? 4 : 3)} className="text-center text-muted-foreground py-8">
                Nenhum registro encontrado
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow key={row.id}>
                {columns.map((col) => {
                  const value = row[col.key as keyof T];
                  return (
                    <TableCell key={String(col.key)} className="text-xs sm:text-sm">
                      {col.render ? col.render(value, row) : String(value ?? '-')}
                    </TableCell>
                  );
                })}
                <TableCell className="text-xs sm:text-sm">
                  <Badge variant={row.synced ? 'default' : 'secondary'} className={`text-[10px] sm:text-xs ${row.synced ? 'bg-green-500' : 'bg-yellow-500'}`}>
                    <span className="hidden sm:inline">{row.synced ? 'Sincronizado' : 'Pendente'}</span>
                    <span className="sm:hidden">{row.synced ? 'Sync' : 'Pend'}</span>
                  </Badge>
                </TableCell>
                <TableCell className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(row.createdAt)}
                </TableCell>
                <TableCell className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(row.updatedAt)}
                </TableCell>
                {onDelete && row.id && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja deletar este registro?')) {
                          onDelete(row.id!);
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
