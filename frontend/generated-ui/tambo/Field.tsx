'use client';

import type { ReactNode } from 'react';

export function Field({ label, help, error, children }: { label: string; help?: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="tambo-label">
        {label}
        <div style={{ marginTop: 6 }}>{children}</div>
      </label>
      {help ? <div className="tambo-help">{help}</div> : null}
      {error ? <div className="tambo-error">{error}</div> : null}
    </div>
  );
}
