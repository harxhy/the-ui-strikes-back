import type { UiEntitySchema, UiField } from '../../../backend/ui_schema/parser';

export function getField(entity: UiEntitySchema, name: string): UiField | undefined {
  return entity.fields.find((f) => f.name === name);
}

export function getPrimaryKey(entity: UiEntitySchema): string {
  return entity.primaryKey ?? 'id';
}
