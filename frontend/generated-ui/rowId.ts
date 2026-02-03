'use client';

import type { UiEntitySchema } from './types';

export type AnyRecord = Record<string, unknown>;

export function stableRowId(entity: UiEntitySchema, row: AnyRecord, index: number): string {
  if (entity.primaryKey && typeof row[entity.primaryKey] === 'string') return row[entity.primaryKey] as string;
  return `${entity.id}:${index}`;
}
