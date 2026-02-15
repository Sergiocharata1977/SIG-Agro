import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BaseButtonProps extends ButtonProps {
  fullWidth?: boolean;
}

export function BaseButton({ fullWidth = false, className, ...props }: BaseButtonProps) {
  return <Button className={cn(fullWidth && 'w-full', className)} {...props} />;
}
