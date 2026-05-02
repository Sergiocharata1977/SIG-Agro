'use client';

import type { ReactNode } from 'react';

export function PageShell({
  title,
  subtitle,
  rightSlot,
  children,
}: {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <header className="overflow-hidden rounded-[32px] border border-[rgba(193,200,194,0.9)] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(229,238,255,0.92))] px-6 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:px-8 md:py-7">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c1ecd4] bg-[#eff7f1] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#446900]">
          Don Juan GIS
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-tight text-[#0b1c30] md:text-4xl">{title}</h1>
            {subtitle ? <p className="mt-2 text-sm leading-6 text-slate-500 md:text-base">{subtitle}</p> : null}
          </div>
          {rightSlot ? <div className="flex flex-wrap gap-3">{rightSlot}</div> : null}
        </div>
      </header>

      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}
