'use client';

import type { UiEntitySchema, UiField } from '../types';
import { Badge, Button, HStack, Panel, Spinner, VStack } from '../tambo';

type AnyRecord = Record<string, unknown>;

function formatValue(field: UiField | undefined, value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (!field) return String(value);
  if (field.type === 'boolean') return value ? 'true' : 'false';
  if (field.type === 'string' && field.format === 'date-time' && typeof value === 'string') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
  }
  return String(value);
}

export function DetailView({
  entity,
  state,
  selectedId,
  row,
  onRetry,
  onEditClick,
  onDelete,
}: {
  entity: UiEntitySchema;
  state: { status: 'idle' | 'loading' | 'error' | 'success'; message?: string };
  selectedId: string | null;
  row: AnyRecord | null;
  onRetry: () => void;
  onEditClick: () => void;
  onDelete: () => void;
}) {
  const fieldsByName = new Map(entity.fields.map((f) => [f.name, f] as const));
  const detailFields = entity.views.detail.fields;

  return (
    <Panel style={{ minHeight: 420 }}>
      <VStack gap={14}>
        <HStack style={{ justifyContent: 'space-between' }}>
          <VStack gap={4} style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Detail</div>
            <div style={{ color: 'var(--muted)', fontSize: 12 }}>{selectedId ? `id: ${selectedId}` : 'Select a row'}</div>
          </VStack>

          <HStack gap={10}>
            <Button variant="secondary" onClick={onRetry} disabled={!selectedId}>
              Reload
            </Button>
            <Button onClick={onEditClick} disabled={!selectedId || !entity.endpoints.update}>
              Edit
            </Button>
            <Button variant="danger" onClick={onDelete} disabled={!selectedId || !entity.endpoints.delete}>
              Delete
            </Button>
          </HStack>
        </HStack>

        {state.status === 'idle' ? (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Click a row in the list to load details.</div>
        ) : state.status === 'loading' ? (
          <Spinner label="Loading detail…" />
        ) : state.status === 'error' ? (
          <VStack gap={10}>
            <Badge tone="danger">Error</Badge>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>{state.message ?? 'Unknown error.'}</div>
            <Button onClick={onRetry}>Retry</Button>
          </VStack>
        ) : !row ? (
          <VStack gap={10}>
            <Badge tone="danger">Not found</Badge>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>The selected record doesn’t exist anymore.</div>
          </VStack>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {detailFields.map((name) => (
              <div
                key={name}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 14,
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <span style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 700 }}>
                  {fieldsByName.get(name)?.label ?? name}
                </span>
                <span style={{ fontSize: 13, fontWeight: 650, textAlign: 'right' }}>{formatValue(fieldsByName.get(name), row[name])}</span>
              </div>
            ))}
          </div>
        )}
      </VStack>
    </Panel>
  );
}
