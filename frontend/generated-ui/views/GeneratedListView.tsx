'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { UiEntitySchema } from '../../../backend/ui_schema/parser';
import type { CrudMockApi } from '../mock/mockApi';
import { formatValue } from '../lib/format';
import { getField, getPrimaryKey } from '../lib/schema';
import { Button } from '../tambo/Button';
import { Callout } from '../tambo/Callout';
import { Table, TBody, Td, Th, THead, Tr } from '../tambo/Table';

export type GeneratedListViewProps<RecordT extends Record<string, unknown> = Record<string, unknown>> = {
  entity: UiEntitySchema;
  api: CrudMockApi<RecordT>;
  onSelectRow?: (id: string) => void;
  onCreate?: () => void;
};

export function GeneratedListView<RecordT extends Record<string, unknown> = Record<string, unknown>>({
  entity,
  api,
  onSelectRow,
  onCreate,
}: GeneratedListViewProps<RecordT>) {
  const [rows, setRows] = useState<RecordT[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const pk = useMemo(() => getPrimaryKey(entity), [entity]);
  const columns = entity.views.list.columns;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.list();
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load list');
      setRows(null);
    } finally {
      setLoading(false);
    }
  }, [api]);

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
          {onCreate ? (
            <Button variant="primary" disabled>
              Create
            </Button>
          ) : null}
        </div>
        <div className="skeleton" style={{ height: 160 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="stack">
        <Callout title={`${entity.title} list failed`}>{error}</Callout>
        <div className="row">
          <Button variant="primary" onClick={load}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const data = rows ?? [];
  if (data.length === 0) {
    return (
      <div className="stack">
        <Callout title={`No ${entity.title}s yet`}>Create the first one to see the generated detail + form views.</Callout>
        {onCreate ? (
          <div className="row">
            <Button variant="primary" onClick={onCreate}>
              Create {entity.title}
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="card stack">
      <div className="row-between">
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{entity.title}</div>
          <div className="muted">
            {data.length} row{data.length === 1 ? '' : 's'} · <span className="mono">{entity.resourcePath}</span>
          </div>
        </div>
        {onCreate ? (
          <Button variant="primary" onClick={onCreate}>
            Create
          </Button>
        ) : null}
      </div>

      <Table>
        <THead>
          <Tr>
            {columns.map((name) => (
              <Th key={name}>{getField(entity, name)?.label ?? name}</Th>
            ))}
          </Tr>
        </THead>
        <TBody>
          {data.map((row, idx) => {
            const id = String((row as Record<string, unknown>)[pk] ?? idx);
            return (
              <Tr key={id} onClick={onSelectRow ? () => onSelectRow(id) : undefined}>
                {columns.map((name) => (
                  <Td key={name}>{formatValue(getField(entity, name), (row as Record<string, unknown>)[name])}</Td>
                ))}
              </Tr>
            );
          })}
        </TBody>
      </Table>
    </div>
  );
}
