import { cn } from '@/lib/utils';

interface ListGridProps<T> {
  data: T[];
  keyExtractor: (item: T) => string | number;
  renderItem: (item: T) => React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  emptyState?: React.ReactNode;
  className?: string;
}

const columnsMap: Record<NonNullable<ListGridProps<unknown>['columns']>, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
};

export function ListGrid<T>({
  data,
  keyExtractor,
  renderItem,
  columns = 3,
  emptyState,
  className,
}: ListGridProps<T>) {
  if (data.length === 0) {
    return (
      <>
        {emptyState ?? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
            No hay datos para mostrar.
          </div>
        )}
      </>
    );
  }

  return <div className={cn('grid gap-4', columnsMap[columns], className)}>{data.map(item => <div key={keyExtractor(item)}>{renderItem(item)}</div>)}</div>;
}
