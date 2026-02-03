import type { UiField } from '../../../backend/ui_schema/parser';

export function formatValue(field: UiField | undefined, value: unknown): string {
  if (value === null || value === undefined) return '';

  if (field?.type === 'boolean') {
    return value === true ? 'Yes' : value === false ? 'No' : String(value);
  }

  if (typeof value === 'string') {
    if (field?.format === 'date-time') {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
    }
    if (field?.format === 'date') {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
    }
    return value;
  }

  if (typeof value === 'number') return String(value);

  if (Array.isArray(value) || typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}
