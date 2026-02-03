'use client';

import { useEffect, useMemo, useState } from 'react';

import type { UiEntitySchema, UiField } from '../types';
import { Badge, Button, Checkbox, HStack, Input, Panel, Select, Spinner, VStack } from '../tambo';

type AnyRecord = Record<string, unknown>;

function toDatetimeLocal(value: unknown): string {
  if (typeof value !== 'string') return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value: string): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toISOString();
}

function uiInputType(field: UiField): 'text' | 'email' | 'number' | 'datetime-local' {
  if (field.type === 'number' || field.type === 'integer') return 'number';
  if (field.type === 'string' && field.format === 'email') return 'email';
  if (field.type === 'string' && field.format === 'date-time') return 'datetime-local';
  return 'text';
}

function sanitizeInput(field: UiField, raw: string): unknown {
  if (field.type === 'integer') {
    const n = Number(raw);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  }
  if (field.type === 'number') {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
  if (field.type === 'string' && field.format === 'date-time') return fromDatetimeLocal(raw);
  return raw;
}

function initialValue(field: UiField, row: AnyRecord | null): string {
  const v = row?.[field.name];
  if (field.type === 'string' && field.format === 'date-time') return toDatetimeLocal(v);
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return '';
}

export function FormView({
  entity,
  mode,
  state,
  row,
  onCreate,
  onUpdate,
  onCancel,
}: {
  entity: UiEntitySchema;
  mode: 'create' | 'update';
  state: { status: 'idle' | 'loading' | 'error' | 'success'; message?: string };
  row: AnyRecord | null;
  onCreate: (input: AnyRecord) => Promise<void>;
  onUpdate: (input: AnyRecord) => Promise<void>;
  onCancel: () => void;
}) {
  const formFields = useMemo(() => {
    const byName = new Map(entity.fields.map((f) => [f.name, f] as const));
    return entity.views.form.fields.map((n) => byName.get(n)).filter(Boolean) as UiField[];
  }, [entity.fields, entity.views.form.fields]);

  const [values, setValues] = useState<Record<string, unknown>>({});
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const nextValues: Record<string, unknown> = {};
    const nextChecks: Record<string, boolean> = {};

    for (const f of formFields) {
      if (f.type === 'boolean') {
        nextChecks[f.name] = Boolean(row?.[f.name]);
      } else {
        nextValues[f.name] = initialValue(f, row);
      }
    }

    setTouched(false);
    setValues(nextValues);
    setChecks(nextChecks);
  }, [formFields, row, mode]);

  const missingRequired = useMemo(() => {
    if (!touched) return [];
    const missing: string[] = [];
    for (const f of formFields) {
      if (!f.required) continue;
      if (f.type === 'boolean') continue;
      const raw = values[f.name];
      if (typeof raw !== 'string' || raw.trim() === '') missing.push(f.name);
    }
    return missing;
  }, [formFields, touched, values]);

  const canSubmit = missingRequired.length === 0 && state.status !== 'loading';

  const handleSubmit = async () => {
    setTouched(true);
    if (missingRequired.length > 0) return;

    const out: AnyRecord = {};
    for (const f of formFields) {
      if (f.type === 'boolean') {
        out[f.name] = Boolean(checks[f.name]);
      } else {
        out[f.name] = sanitizeInput(f, String(values[f.name] ?? ''));
      }
    }

    if (mode === 'create') {
      await onCreate(out);
      return;
    }
    await onUpdate(out);
  };

  return (
    <Panel style={{ minHeight: 420 }}>
      <VStack gap={14}>
        <HStack style={{ justifyContent: 'space-between' }}>
          <VStack gap={4} style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{mode === 'create' ? 'Create' : 'Update'} form</div>
            <div style={{ color: 'var(--muted)', fontSize: 12 }}>
              {mode === 'create'
                ? entity.endpoints.create
                  ? `${entity.endpoints.create.method} ${entity.endpoints.create.path}`
                  : 'No create endpoint in schema'
                : entity.endpoints.update
                  ? `${entity.endpoints.update.method} ${entity.endpoints.update.path}`
                  : 'No update endpoint in schema'}
            </div>
          </VStack>
          <Button variant="secondary" onClick={onCancel}>
            Reset
          </Button>
        </HStack>

        {!entity.endpoints[mode] ? (
          <VStack gap={10}>
            <Badge tone="danger">Unavailable</Badge>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>This schema doesn’t define a {mode} endpoint.</div>
          </VStack>
        ) : mode === 'update' && !row ? (
          <VStack gap={10}>
            <Badge>Waiting</Badge>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Select a row to edit.</div>
          </VStack>
        ) : state.status === 'loading' ? (
          <Spinner label="Saving…" />
        ) : state.status === 'error' ? (
          <VStack gap={10}>
            <Badge tone="danger">Error</Badge>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>{state.message ?? 'Unknown error.'}</div>
          </VStack>
        ) : (
          <VStack gap={12}>
            {formFields.map((f) => {
              if (f.type === 'boolean') {
                return (
                  <Checkbox
                    key={f.name}
                    label={f.label}
                    checked={Boolean(checks[f.name])}
                    onChange={(checked) => setChecks((c) => ({ ...c, [f.name]: checked }))}
                  />
                );
              }

              if (f.enum?.length) {
                const raw = String(values[f.name] ?? f.enum[0] ?? '');
                return (
                  <Select
                    key={f.name}
                    label={f.label}
                    value={raw}
                    required={f.required}
                    onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))}
                    options={f.enum.map((v) => ({ value: v, label: v }))}
                  />
                );
              }

              const raw = String(values[f.name] ?? '');
              return (
                <Input
                  key={f.name}
                  label={f.label}
                  value={raw}
                  onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))}
                  type={uiInputType(f)}
                  required={f.required}
                />
              );
            })}

            {missingRequired.length > 0 ? (
              <div style={{ color: 'var(--danger)', fontSize: 12, fontWeight: 650 }}>
                Missing required field{missingRequired.length === 1 ? '' : 's'}: {missingRequired.join(', ')}
              </div>
            ) : null}

            <HStack style={{ justifyContent: 'flex-end' }}>
              <Button onClick={handleSubmit} disabled={!canSubmit}>
                {mode === 'create' ? 'Create' : 'Save'}
              </Button>
            </HStack>
          </VStack>
        )}
      </VStack>
    </Panel>
  );
}
