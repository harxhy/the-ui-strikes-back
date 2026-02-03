'use client';

import type { CSSProperties, ReactNode } from 'react';

const basePanel: CSSProperties = {
  background: 'var(--panel)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: 16,
};

export function Panel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ ...basePanel, ...style }}>{children}</div>;
}

export function HStack({ children, gap = 12, style }: { children: ReactNode; gap?: number; style?: CSSProperties }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap,
        flexWrap: 'wrap',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function VStack({ children, gap = 12, style }: { children: ReactNode; gap?: number; style?: CSSProperties }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'danger';

export function Button({
  children,
  onClick,
  disabled,
  variant = 'primary',
  style,
  type,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  style?: CSSProperties;
  type?: 'button' | 'submit' | 'reset';
}) {
  const palette: Record<ButtonVariant, { bg: string; border: string; color: string }> = {
    primary: { bg: 'rgba(110, 231, 255, 0.15)', border: 'rgba(110, 231, 255, 0.35)', color: 'var(--text)' },
    secondary: { bg: 'rgba(255, 255, 255, 0.06)', border: 'rgba(255, 255, 255, 0.14)', color: 'var(--text)' },
    danger: { bg: 'rgba(255, 107, 107, 0.12)', border: 'rgba(255, 107, 107, 0.35)', color: 'var(--text)' },
  };

  const p = palette[variant];

  return (
    <button
      type={type ?? 'button'}
      onClick={onClick}
      disabled={disabled}
      style={{
        appearance: 'none',
        border: `1px solid ${p.border}`,
        background: p.bg,
        color: p.color,
        padding: '10px 12px',
        borderRadius: 12,
        fontWeight: 600,
        letterSpacing: 0.2,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'number' | 'datetime-local';
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ color: 'var(--muted)', fontSize: 12 }}>
        {label}
        {required ? <span style={{ color: 'var(--accent)' }}> *</span> : null}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        required={required}
        disabled={disabled}
        style={{
          width: '100%',
          borderRadius: 12,
          border: '1px solid var(--border)',
          background: 'var(--panel-2)',
          color: 'var(--text)',
          padding: '10px 12px',
          outline: 'none',
        }}
      />
    </label>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ color: 'var(--muted)', fontSize: 12 }}>
        {label}
        {required ? <span style={{ color: 'var(--accent)' }}> *</span> : null}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        style={{
          width: '100%',
          borderRadius: 12,
          border: '1px solid var(--border)',
          background: 'var(--panel-2)',
          color: 'var(--text)',
          padding: '10px 12px',
          outline: 'none',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Checkbox({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer' }}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 16, height: 16 }}
      />
      <span style={{ color: checked ? 'var(--text)' : 'var(--muted)', fontWeight: 600 }}>{label}</span>
    </label>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'danger' }) {
  const palette =
    tone === 'danger'
      ? { bg: 'rgba(255, 107, 107, 0.12)', border: 'rgba(255, 107, 107, 0.35)' }
      : { bg: 'rgba(255, 255, 255, 0.06)', border: 'rgba(255, 255, 255, 0.14)' };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        border: `1px solid ${palette.border}`,
        background: palette.bg,
        borderRadius: 999,
        padding: '4px 10px',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.2,
      }}
    >
      {children}
    </span>
  );
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <HStack gap={10}>
      <span aria-hidden className="ui-copilot-spinner" />
      <span style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 600 }}>{label}</span>
    </HStack>
  );
}

export function CodeBlock({ code, maxHeight = 280 }: { code: string; maxHeight?: number }) {
  return (
    <pre
      style={{
        margin: 0,
        background: 'rgba(0,0,0,0.32)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: 14,
        color: 'var(--text)',
        overflow: 'auto',
        maxHeight,
        fontSize: 12,
        lineHeight: 1.45,
      }}
    >
      <code>{code}</code>
    </pre>
  );
}
