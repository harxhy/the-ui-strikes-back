'use client';

import type { ReactNode } from 'react';

export function Callout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card" style={{ borderStyle: 'dashed' }}>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>{title}</div>
      <div className="muted" style={{ lineHeight: 1.5 }}>
        {children}
      </div>
    </div>
  );
}
