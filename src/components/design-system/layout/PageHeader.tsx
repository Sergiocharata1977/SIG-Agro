import { cn } from '@/lib/utils';
import { spacing, typography } from '../tokens';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-4 md:flex-row md:items-center md:justify-between', className)}>
      <div className={spacing.stackSm}>
        <h1 className={typography.h2}>{title}</h1>
        {subtitle && <p className={typography.lead}>{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
