import { Input, type InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface BaseInputProps extends InputProps {
  compact?: boolean;
}

export function BaseInput({ compact = false, className, ...props }: BaseInputProps) {
  return <Input className={cn(compact && 'h-9', className)} {...props} />;
}
