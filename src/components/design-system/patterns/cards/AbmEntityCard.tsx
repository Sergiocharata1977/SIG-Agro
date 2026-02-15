import { BaseBadge } from '@/components/design-system/primitives/BaseBadge';
import { BaseButton } from '@/components/design-system/primitives/BaseButton';
import { BaseCard } from '@/components/design-system/primitives/BaseCard';

interface AbmEntityCardProps {
  title: string;
  subtitle?: string;
  status?: 'activo' | 'inactivo' | 'pendiente';
  onEdit?: () => void;
  onDelete?: () => void;
  children?: React.ReactNode;
}

export function AbmEntityCard({
  title,
  subtitle,
  status = 'activo',
  onEdit,
  onDelete,
  children,
}: AbmEntityCardProps) {
  const statusVariant = status === 'activo' ? 'success' : status === 'pendiente' ? 'secondary' : 'outline';

  return (
    <BaseCard
      title={title}
      description={subtitle}
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <BaseBadge variant={statusVariant}>{status}</BaseBadge>
          <div className="flex items-center gap-2">
            {onEdit && (
              <BaseButton variant="outline" size="sm" onClick={onEdit}>
                Editar
              </BaseButton>
            )}
            {onDelete && (
              <BaseButton variant="destructive" size="sm" onClick={onDelete}>
                Borrar
              </BaseButton>
            )}
          </div>
        </div>
      }
    >
      {children}
    </BaseCard>
  );
}
