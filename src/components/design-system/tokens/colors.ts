export const colors = {
  primary: {
    bg: 'bg-primary',
    text: 'text-primary',
    foreground: 'text-primary-foreground',
    border: 'border-primary',
  },
  neutral: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    foreground: 'text-slate-900',
    border: 'border-slate-200',
  },
  success: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    foreground: 'text-emerald-900',
    border: 'border-emerald-200',
  },
  warning: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    foreground: 'text-amber-900',
    border: 'border-amber-200',
  },
  danger: {
    bg: 'bg-rose-100',
    text: 'text-rose-700',
    foreground: 'text-rose-900',
    border: 'border-rose-200',
  },
} as const;

export type ColorVariant = keyof typeof colors;
