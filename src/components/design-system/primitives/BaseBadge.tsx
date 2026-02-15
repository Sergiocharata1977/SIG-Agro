import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type BaseBadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success';

interface BaseBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BaseBadgeVariant;
}

export function BaseBadge({ variant = 'default', className, ...props }: BaseBadgeProps) {
  return <Badge variant={variant} className={cn('font-medium', className)} {...props} />;
}
