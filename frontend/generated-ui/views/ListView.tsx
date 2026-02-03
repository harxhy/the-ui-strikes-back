'use client';

import type { UiEntitySchema, UiField } from '../types';
import { Badge, Button, HStack, Panel, Spinner, VStack } from '../tambo';

import { stableRowId, type AnyRecord } from '../rowId';

function formatValue(field: UiField | undefined, value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (!field) return String(value);
  if (field.type === 'boolean') return value ? 'true' : 'false';
  if (field.type === 'number' || field.type === 'integer') return typeof value === 'number' ? String(value) : String(value);
  if (field.type === 'string' && field.format === 'date-time' && typeof value === 'string') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
  }
  return String(value);
}

export function ListView({
  entity,
  state,
  rows,
  selectedId,
  onRetry,
  onSeed,
  onSelect,
  onCreateClick,
}: {
  entity: UiEntitySchema;
  state: { status: 'idle' | 'loading' | 'error' | 'success'; message?: string };
  rows: AnyRecord[];
  selectedId: string | null;
  onRetry: () => void;
  onSeed: () => void;
  onSelect: (id: string) => void;
  onCreateClick: () => void;
}) {
  const columns = entity.views.list.columns;
  const fieldsByName = new Map(entity.fields.map((f) => [f.name, f] as const));

  return (
    <Panel style={{ minHeight: 420 }}>
      <VStack gap={14}>
        <HStack style={{ justifyContent: 'space-between' }}>
          <VStack gap={4} style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>List</div>
            <div style={{ color: 'var(--muted)', fontSize: 12 }}>
              {entity.resourcePath} · {rows.length} row{rows.length === 1 ? '' : 's'}
            </div>
          </VStack>

          <HStack gap={10}>
            <Button variant="secondary" onClick={onRetry}>
              Reload
            </Button>
            <Button onClick={onCreateClick} disabled={!entity.endpoints.create}>
              New
            </Button>
          </HStack>
        </HStack>

        {state.status === 'loading' ? (
          <Spinner label="Loading list…" />
        ) : state.status === 'error' ? (
          <VStack gap={10}>
            <Badge tone="danger">Error</Badge>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>{state.message ?? 'Unknown error.'}</div>
            <HStack>
              <Button onClick={onRetry}>Retry</Button>
            </HStack>
          </VStack>
        ) : rows.length === 0 ? (
          <VStack gap={10}>
            <Badge>Empty</Badge>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>No rows yet. Seed demo data or create the first item.</div>
            <HStack>
              <Button variant="secondary" onClick={onSeed}>
                Seed demo data
              </Button>
              <Button onClick={onCreateClick} disabled={!entity.endpoints.create}>
                Create
              </Button>
            </HStack>
          </VStack>
        ) : (
          <div style={{ overflow: 'auto', borderRadius: 14, border: '1px solid var(--border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {columns.map((c) => (
                    <th
                      key={c}
                      style={{
                        textAlign: 'left',
                        padding: '10px 12px',
                        fontSize: 12,
                        color: 'var(--muted)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {fieldsByName.get(c)?.label ?? c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const id = stableRowId(entity, r, i);
                  const isSelected = id === selectedId;
                  return (
                    <tr
                      key={id}
                      onClick={() => onSelect(id)}
                      style={{
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(110, 231, 255, 0.09)' : undefined,
                      }}
                    >
                      {columns.map((c) => (
                        <td
                          key={c}
                          style={{
                            padding: '10px 12px',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            fontWeight: isSelected ? 700 : 550,
                          }}
                        >
                          {formatValue(fieldsByName.get(c), r[c])}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </VStack>
    </Panel>
  );
}
