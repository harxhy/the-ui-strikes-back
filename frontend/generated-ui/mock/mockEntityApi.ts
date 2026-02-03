'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import type { UiEntitySchema, UiField } from '../types';
import { stableRowId, type AnyRecord } from '../rowId';

type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T };

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldFail(simulateErrors: boolean): boolean {
  if (!simulateErrors) return false;
  return Math.random() < 0.25;
}

function generateValue(field: UiField, seed: number): unknown {
  switch (field.type) {
    case 'boolean':
      return seed % 2 === 0;
    case 'integer':
      return (seed + 1) * 7;
    case 'number':
      return (seed + 1) * 3.14;
    case 'string': {
      if (field.enum?.length) return field.enum[seed % field.enum.length];
      if (field.format === 'date-time') {
        const d = new Date(Date.now() - seed * 86_400_000);
        return d.toISOString();
      }

      if (field.format === 'email') return `user${seed + 1}@demo.local`;
      return `${field.name}-${seed + 1}`;
    }
    default:
      return null;
  }
}

function createSeedRow(entity: UiEntitySchema, seed: number): AnyRecord {
  const row: AnyRecord = {};
  for (const f of entity.fields) {
    if (f.writeOnly) continue;
    row[f.name] = generateValue(f, seed);
  }

  if (entity.primaryKey && typeof row[entity.primaryKey] !== 'string') {
    row[entity.primaryKey] = `${seed + 1}`;
  }

  return row;
}

export function useMockEntityApi(entity: UiEntitySchema, { simulateErrors }: { simulateErrors: boolean }) {
  const [rows, setRows] = useState<AnyRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [listState, setListState] = useState<AsyncState<AnyRecord[]>>({ status: 'idle' });
  const [detailState, setDetailState] = useState<AsyncState<AnyRecord | null>>({ status: 'idle' });
  const [mutationState, setMutationState] = useState<AsyncState<null>>({ status: 'idle' });

  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const seed = useCallback(() => {
    const seeded = Array.from({ length: 5 }, (_, i) => createSeedRow(entity, i));
    setRows(seeded);
    setSelectedId(null);
    setListState({ status: 'success', data: seeded });
    setDetailState({ status: 'idle' });
  }, [entity]);

  const list = useCallback(async () => {
    setListState({ status: 'loading' });
    await sleep(650);

    if (shouldFail(simulateErrors)) {
      setListState({ status: 'error', message: 'Mock network error while loading the list.' });
      return;
    }

    setListState({ status: 'success', data: rowsRef.current });
  }, [simulateErrors]);

  const read = useCallback(
    async (id: string) => {
      setSelectedId(id);
      setDetailState({ status: 'loading' });
      await sleep(450);

      if (shouldFail(simulateErrors)) {
        setDetailState({ status: 'error', message: 'Mock network error while loading the detail view.' });
        return;
      }

      const row = rowsRef.current.find((r, i) => stableRowId(entity, r, i) === id) ?? null;
      setDetailState({ status: 'success', data: row });
    },
    [entity, simulateErrors],
  );

  const create = useCallback(
    async (input: AnyRecord) => {
      setMutationState({ status: 'loading' });
      await sleep(500);

      if (shouldFail(simulateErrors)) {
        setMutationState({ status: 'error', message: 'Mock network error while creating an item.' });
        return null;
      }

      const next: AnyRecord = { ...input };
      if (entity.primaryKey && typeof next[entity.primaryKey] !== 'string') {
        next[entity.primaryKey] = `${rowsRef.current.length + 1}`;
      }

      const nextRows = [...rowsRef.current, next];
      setRows(nextRows);
      setListState({ status: 'success', data: nextRows });
      setMutationState({ status: 'success', data: null });

      const id = stableRowId(entity, next, nextRows.length - 1);
      setSelectedId(id);
      setDetailState({ status: 'success', data: next });
      return next;
    },
    [entity, simulateErrors],
  );

  const update = useCallback(
    async (id: string, input: AnyRecord) => {
      setMutationState({ status: 'loading' });
      await sleep(500);

      if (shouldFail(simulateErrors)) {
        setMutationState({ status: 'error', message: 'Mock network error while updating an item.' });
        return null;
      }

      const idx = rowsRef.current.findIndex((r, i) => stableRowId(entity, r, i) === id);
      if (idx < 0) {
        setMutationState({ status: 'error', message: 'Item no longer exists.' });
        return null;
      }

      const next = { ...rowsRef.current[idx], ...input };
      const nextRows = [...rowsRef.current];
      nextRows[idx] = next;
      setRows(nextRows);
      setListState({ status: 'success', data: nextRows });
      setMutationState({ status: 'success', data: null });
      setDetailState({ status: 'success', data: next });
      return next;
    },
    [entity, simulateErrors],
  );

  const del = useCallback(
    async (id: string) => {
      setMutationState({ status: 'loading' });
      await sleep(450);

      if (shouldFail(simulateErrors)) {
        setMutationState({ status: 'error', message: 'Mock network error while deleting an item.' });
        return;
      }

      const nextRows = rowsRef.current.filter((r, i) => stableRowId(entity, r, i) !== id);
      setRows(nextRows);
      setListState({ status: 'success', data: nextRows });
      setMutationState({ status: 'success', data: null });
      setSelectedId(null);
      setDetailState({ status: 'idle' });
    },
    [entity, simulateErrors],
  );

  const selectedRow = useMemo(() => {
    if (!selectedId) return null;
    return rows.find((r, i) => stableRowId(entity, r, i) === selectedId) ?? null;
  }, [entity, rows, selectedId]);

  return {
    rows,
    listState,
    detailState,
    mutationState,
    selectedId,
    selectedRow,
    seed,
    list,
    read,
    create,
    update,
    del,
  };
}
