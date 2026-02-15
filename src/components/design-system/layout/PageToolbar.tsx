import { BaseInput as Input } from '@/components/design-system';
import { cn } from '@/lib/utils';

interface PageToolbarProps {
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageToolbar({
  searchValue = '',
  searchPlaceholder = 'Buscar...',
  onSearchChange,
  filters,
  actions,
  className,
}: PageToolbarProps) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white p-3 md:p-4', className)}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          {onSearchChange && (
            <Input
              value={searchValue}
              onChange={e => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="md:w-72"
            />
          )}
          {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
