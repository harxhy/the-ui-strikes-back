'use client';

import type { ReactNode } from 'react';

export function Table({ children }: { children: ReactNode }) {
  return <table className="tambo-table">{children}</table>;
}

export function THead({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function Tr({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  const cls = onClick ? 'tambo-rowClickable' : undefined;
  return (
    <tr className={cls} onClick={onClick} style={onClick ? { userSelect: 'none' } : undefined}>
      {children}
    </tr>
  );
}

export function Th({ children }: { children: ReactNode }) {
  return <th>{children}</th>;
}

export function Td({ children }: { children: ReactNode }) {
  return <td>{children}</td>;
}
