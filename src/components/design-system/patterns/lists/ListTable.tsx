import { cn } from '@/lib/utils';

interface ListTableColumn<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface ListTableProps<T> {
  data: T[];
  columns: ListTableColumn<T>[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  emptyState?: React.ReactNode;
  className?: string;
}

export function ListTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  emptyState,
  className,
}: ListTableProps<T>) {
  if (!data.length) {
    return (
      <>
        {emptyState ?? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
            No hay registros.
          </div>
        )}
      </>
    );
  }

  return (
    <div className={cn('overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm', className)}>
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col, index) => (
              <th key={index} className={cn('px-4 py-3 text-left font-medium text-slate-600', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr
              key={keyExtractor(item)}
              className={cn(
                'border-t border-slate-100',
                onRowClick ? 'cursor-pointer hover:bg-slate-50 transition-colors' : ''
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col, index) => (
                <td key={index} className={cn('px-4 py-3 text-slate-700', col.className)}>
                  {col.cell ? col.cell(item) : col.accessorKey ? (item[col.accessorKey] as React.ReactNode) : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type { ListTableColumn };
