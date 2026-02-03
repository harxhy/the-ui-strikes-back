'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { UiEntitySchema } from '../../../backend/ui_schema/parser';
import type { CrudMockApi } from '../mock/mockApi';
import { formatValue } from '../lib/format';
import { getField, getPrimaryKey } from '../lib/schema';
import { Button } from '../tambo/Button';
import { Callout } from '../tambo/Callout';

export type GeneratedDetailViewProps<RecordT extends Record<string, unknown> = Record<string, unknown>> = {
  entity: UiEntitySchema;
  api: CrudMockApi<RecordT>;
  id: string;
  onBack?: () => void;
  onEdit?: (id: string) => void;
};

export function GeneratedDetailView<RecordT extends Record<string, unknown> = Record<string, unknown>>({
  entity,
  api,
  id,
  onBack,
  onEdit,
}: GeneratedDetailViewProps<RecordT>) {
  const [row, setRow] = useState<RecordT | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const pk = useMemo(() => getPrimaryKey(entity), [entity]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.read(id);
      setRow(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load record');
      setRow(null);
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="card stack">
        <div className="row-between">
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{entity.title}</div>
            <div className="muted">Loading…</div>
          </div>
          <div className="row">
            {onBack ? <Button onClick={onBack}>Back</Button> : null}
            {onEdit ? (
              <Button variant="primary" disabled>
                Edit
              </Button>
            ) : null}
          </div>
        </div>
        <div className="skeleton" style={{ height: 220 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="stack">
        <Callout title={`${entity.title} detail failed`}>{error}</Callout>
        <div className="row">
          <Button variant="primary" onClick={load}>
            Retry
          </Button>
          {onBack ? <Button onClick={onBack}>Back</Button> : null}
        </div>
      </div>
    );
  }

  if (!row) {
    return (
      <div className="stack">
        <Callout title="Not found">No record exists for id: {id}</Callout>
        {onBack ? (
          <div className="row">
            <Button onClick={onBack}>Back</Button>
          </div>
        ) : null}
      </div>
    );
  }

  const recordId = String((row as Record<string, unknown>)[pk] ?? id);

  return (
    <div className="card stack">
      <div className="row-between">
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{entity.title} detail</div>
          <div className="muted">
            <span className="pill mono">{recordId}</span>
          </div>
        </div>
        <div className="row">
          {onBack ? <Button onClick={onBack}>Back</Button> : null}
          {onEdit ? (
            <Button variant="primary" onClick={() => onEdit(recordId)}>
              Edit
            </Button>
          ) : null}
        </div>
      </div>

      <div className="stack">
        {entity.views.detail.fields.map((name) => {
          const field = getField(entity, name);
          const value = (row as Record<string, unknown>)[name];
          return (
            <div key={name} className="row-between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
              <div style={{ fontWeight: 700 }}>{field?.label ?? name}</div>
              <div className="muted" style={{ textAlign: 'right', maxWidth: 700, overflowWrap: 'anywhere' }}>
                {formatValue(field, value) || <span className="pill">—</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
