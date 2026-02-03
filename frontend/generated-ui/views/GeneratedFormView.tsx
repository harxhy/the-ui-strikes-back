'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { UiEntitySchema, UiField } from '../../../backend/ui_schema/parser';
import type { CrudMockApi } from '../mock/mockApi';
import { getField, getPrimaryKey } from '../lib/schema';
import { Button } from '../tambo/Button';
import { Callout } from '../tambo/Callout';
import { Field } from '../tambo/Field';

type Mode = 'create' | 'update';

export type GeneratedFormViewProps<RecordT extends Record<string, unknown> = Record<string, unknown>> = {
  entity: UiEntitySchema;
  api: CrudMockApi<RecordT>;
  mode: Mode;
  /** Required for `update`. */
  id?: string;
  onCancel?: () => void;
  onSubmitSuccess?: (record: RecordT) => void;
};

export function GeneratedFormView<RecordT extends Record<string, unknown> = Record<string, unknown>>({
  entity,
  api,
  mode,
  id,
  onCancel,
  onSubmitSuccess,
}: GeneratedFormViewProps<RecordT>) {
  const pk = useMemo(() => getPrimaryKey(entity), [entity]);

  const fields = useMemo(() => {
    const out: UiField[] = [];
    for (const name of entity.views.form.fields) {
      const f = getField(entity, name);
      if (!f) continue;
      if (f.readOnly) continue;
      if (mode === 'create' && f.writeOnly) {
        // In a real system we'd probably include writeOnly on create; keeping this
        // conservative for the demo.
      }
      out.push(f);
    }
    return out;
  }, [entity, mode]);

  const [loading, setLoading] = useState(mode === 'update');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const loadForEdit = useCallback(async () => {
    if (mode !== 'update') return;
    if (!id) {
      setError('Missing id for update');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const row = await api.read(id);
      if (!row) {
        setError(`No record exists for id: ${id}`);
        setValues({});
        return;
      }
      setValues({ ...(row as Record<string, unknown>) });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load record');
      setValues({});
    } finally {
      setLoading(false);
    }
  }, [api, id, mode]);

  useEffect(() => {
    void loadForEdit();
  }, [loadForEdit]);

  const requiredNames = useMemo(() => new Set(fields.filter((f) => f.required).map((f) => f.name)), [fields]);

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};
    for (const f of fields) {
      if (!requiredNames.has(f.name)) continue;
      const v = values[f.name];
      const empty = v === null || v === undefined || v === '';
      if (empty) errs[f.name] = 'Required';
    }
    return errs;
  }, [fields, requiredNames, values]);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const submit = useCallback(async () => {
    setError(null);
    const errs = validate();
    setFieldErrors(errs);
    setTouched((prev) => ({ ...prev, ...Object.fromEntries(fields.map((f) => [f.name, true])) }));
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      if (mode === 'create') {
        const created = await api.create(values as Partial<RecordT>);
        onSubmitSuccess?.(created);
      } else {
        if (!id) {
          setError('Missing id for update');
          return;
        }
        const updated = await api.update(id, values as Partial<RecordT>);
        if (!updated) {
          setError(`No record exists for id: ${id}`);
          return;
        }
        onSubmitSuccess?.(updated);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }, [api, fields, id, mode, onSubmitSuccess, validate, values]);

  if (loading) {
    return (
      <div className="card stack">
        <div className="row-between">
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{mode === 'create' ? `Create ${entity.title}` : `Edit ${entity.title}`}</div>
            <div className="muted">Loading…</div>
          </div>
          <div className="row">{onCancel ? <Button onClick={onCancel}>Cancel</Button> : null}</div>
        </div>
        <div className="skeleton" style={{ height: 260 }} />
      </div>
    );
  }

  if (error && mode === 'update' && Object.keys(values).length === 0) {
    return (
      <div className="stack">
        <Callout title="Cannot edit">{error}</Callout>
        {onCancel ? (
          <div className="row">
            <Button onClick={onCancel}>Back</Button>
          </div>
        ) : null}
      </div>
    );
  }

  const title = mode === 'create' ? `Create ${entity.title}` : `Edit ${entity.title}`;
  const recordId = mode === 'update' ? String((values as Record<string, unknown>)[pk] ?? id ?? '') : '';

  return (
    <div className="card stack">
      <div className="row-between">
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{title}</div>
          <div className="muted">
            <span className="mono">{entity.resourcePath}</span>
            {mode === 'update' && recordId ? (
              <>
                {' '}· <span className="pill mono">{recordId}</span>
              </>
            ) : null}
          </div>
        </div>
        <div className="row">
          {onCancel ? <Button onClick={onCancel}>Cancel</Button> : null}
          <Button variant="primary" disabled={submitting} onClick={submit}>
            {submitting ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      {error ? <Callout title="Submit failed">{error}</Callout> : null}

      <div className="stack">
        {fields.map((f) => {
          const v = values[f.name];
          const showErr = touched[f.name] && fieldErrors[f.name];
          return (
            <Field
              key={f.name}
              label={`${f.label}${f.required ? ' *' : ''}`}
              help={f.format ? `format: ${f.format}` : undefined}
              error={showErr ? fieldErrors[f.name] : undefined}
            >
              {renderInput({
                field: f,
                value: v,
                onBlur: () => setTouched((prev) => ({ ...prev, [f.name]: true })),
                onChange: (next) => setValues((prev) => ({ ...prev, [f.name]: next })),
              })}
            </Field>
          );
        })}
      </div>
    </div>
  );
}

function renderInput({
  field,
  value,
  onChange,
  onBlur,
}: {
  field: UiField;
  value: unknown;
  onChange: (next: unknown) => void;
  onBlur: () => void;
}) {
  if (field.enum?.length) {
    return (
      <select
        className="tambo-select"
        value={typeof value === 'string' ? value : ''}
        onBlur={onBlur}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select…</option>
        {field.enum.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === 'boolean') {
    return (
      <label className="row" style={{ gap: 8 }}>
        <input
          type="checkbox"
          checked={value === true}
          onBlur={onBlur}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="muted">{value === true ? 'Enabled' : 'Disabled'}</span>
      </label>
    );
  }

  if (field.type === 'number' || field.type === 'integer') {
    return (
      <input
        className="tambo-input"
        type="number"
        value={typeof value === 'number' ? value : value === '' ? '' : value ? Number(value) : ''}
        onBlur={onBlur}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') return onChange('');
          const n = Number(raw);
          onChange(Number.isNaN(n) ? '' : n);
        }}
      />
    );
  }

  if (field.type === 'array' || field.type === 'object') {
    return (
      <textarea
        className="tambo-textarea"
        value={typeof value === 'string' ? value : value ? JSON.stringify(value, null, 2) : ''}
        onBlur={onBlur}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.type === 'array' ? '[...]' : '{...}'}
      />
    );
  }

  const inputType = field.format === 'email' ? 'email' : 'text';
  return (
    <input
      className="tambo-input"
      type={inputType}
      value={typeof value === 'string' ? value : value === undefined || value === null ? '' : String(value)}
      onBlur={onBlur}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.format ?? undefined}
    />
  );
}
