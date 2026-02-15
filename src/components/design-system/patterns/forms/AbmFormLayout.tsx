import { BaseButton } from '@/components/design-system/primitives/BaseButton';
import { BaseInput as Input } from '@/components/design-system/primitives/BaseInput';
import { Label } from '@/components/ui/label';

interface AbmFormLayoutProps {
  title: string;
  description?: string;
  submitLabel?: string;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  children?: React.ReactNode;
}

export function AbmFormLayout({
  title,
  description,
  submitLabel = 'Guardar',
  onSubmit,
  children,
}: AbmFormLayoutProps) {
  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-slate-200 bg-white p-4 md:p-6 space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {description && <p className="text-sm text-slate-600">{description}</p>}
      </div>

      {children ?? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" placeholder="Nombre" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="codigo">Codigo</Label>
            <Input id="codigo" placeholder="Codigo" />
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <BaseButton type="submit">{submitLabel}</BaseButton>
      </div>
    </form>
  );
}
