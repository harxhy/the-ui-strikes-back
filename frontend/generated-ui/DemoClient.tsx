'use client';

import { useEffect, useMemo, useState } from 'react';

import type { UiEntitySchema, UiSchema } from './types';
import { useMockEntityApi } from './mock/mockEntityApi';
import { Badge, Button, Checkbox, CodeBlock, HStack, Panel, Spinner, VStack } from './tambo';
import { DetailView } from './views/DetailView';
import { FormView } from './views/FormView';
import { ListView } from './views/ListView';

export function DemoClient({ openApiYaml, uiSchema }: { openApiYaml: string; uiSchema: UiSchema }) {
  const entityIds = useMemo(() => Object.keys(uiSchema.entities).sort((a, b) => a.localeCompare(b)), [uiSchema.entities]);
  const [activeEntityId, setActiveEntityId] = useState<string>(() => entityIds[0] ?? '');
  const [simulateErrors, setSimulateErrors] = useState(false);

  useEffect(() => {
    setActiveEntityId((current) => (entityIds.includes(current) ? current : entityIds[0] ?? ''));
  }, [entityIds]);

  const entity = activeEntityId ? uiSchema.entities[activeEntityId] : undefined;
  const uiSchemaJson = useMemo(() => JSON.stringify(uiSchema, null, 2), [uiSchema]);

  if (!entity) {
    return (
      <main style={{ padding: 32 }}>
        <Panel>
          <VStack>
            <Badge tone="danger">No entities</Badge>
            <div style={{ color: 'var(--muted)' }}>Parser returned an empty `entities` map.</div>
          </VStack>
        </Panel>
      </main>
    );
  }

  return (
    <main style={{ padding: 28, display: 'grid', gap: 16 }}>
      <Panel style={{ padding: 18 }}>
        <HStack style={{ justifyContent: 'space-between' }}>
          <VStack gap={6} style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 0.2 }}>UI Copilot Demo</div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>
              Load OpenAPI → parse to UI schema → render generated list/detail/form.
            </div>
          </VStack>

          <HStack gap={10}>
            <Checkbox label="Simulate errors" checked={simulateErrors} onChange={setSimulateErrors} />
          </HStack>
        </HStack>

        <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {entityIds.map((id) => {
            const isActive = id === activeEntityId;
            return (
              <Button
                key={id}
                variant={isActive ? 'primary' : 'secondary'}
                onClick={() => setActiveEntityId(id)}
                style={{ padding: '8px 10px' }}
              >
                {uiSchema.entities[id]?.title ?? id}
              </Button>
            );
          })}
        </div>
      </Panel>

      <EntityDemo key={activeEntityId} entity={entity} simulateErrors={simulateErrors} />

      <Panel>
        <VStack gap={12}>
          <HStack style={{ justifyContent: 'space-between' }}>
            <div style={{ fontSize: 14, fontWeight: 900 }}>Source inputs</div>
            <Badge>Demo-only</Badge>
          </HStack>

          <details>
            <summary style={{ cursor: 'pointer', fontWeight: 800, color: 'var(--muted)' }}>OpenAPI YAML</summary>
            <div style={{ marginTop: 10 }}>
              <CodeBlock code={openApiYaml} maxHeight={320} />
            </div>
          </details>
          <details>
            <summary style={{ cursor: 'pointer', fontWeight: 800, color: 'var(--muted)' }}>Parsed UI schema</summary>
            <div style={{ marginTop: 10 }}>
              <CodeBlock code={uiSchemaJson} maxHeight={320} />
            </div>
          </details>
        </VStack>
      </Panel>
    </main>
  );
}

function EntityDemo({ entity, simulateErrors }: { entity: UiEntitySchema; simulateErrors: boolean }) {
  const api = useMockEntityApi(entity, { simulateErrors });
  const [formMode, setFormMode] = useState<'create' | 'update'>('create');
  const [formReset, setFormReset] = useState(0);

  useEffect(() => {
    void api.list();
  }, [api.list]);

  const listState =
    api.listState.status === 'error'
      ? { status: 'error' as const, message: api.listState.message }
      : { status: api.listState.status };

  const detailState =
    api.detailState.status === 'error'
      ? { status: 'error' as const, message: api.detailState.message }
      : { status: api.detailState.status };

  const mutationState =
    api.mutationState.status === 'error'
      ? { status: 'error' as const, message: api.mutationState.message }
      : { status: api.mutationState.status };

  return (
    <div
      style={{
        display: 'grid',
        gap: 14,
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        alignItems: 'start',
      }}
    >
      <ListView
        entity={entity}
        state={listState}
        rows={api.rows}
        selectedId={api.selectedId}
        onRetry={() => void api.list()}
        onSeed={api.seed}
        onSelect={(id) => {
          setFormMode('update');
          setFormReset((n) => n + 1);
          void api.read(id);
        }}
        onCreateClick={() => {
          setFormMode('create');
          setFormReset((n) => n + 1);
        }}
      />

      <DetailView
        entity={entity}
        state={detailState}
        selectedId={api.selectedId}
        row={api.selectedRow}
        onRetry={() => (api.selectedId ? void api.read(api.selectedId) : undefined)}
        onEditClick={() => setFormMode('update')}
        onDelete={() => (api.selectedId ? void api.del(api.selectedId) : undefined)}
      />

      <FormView
        key={`${formMode}:${formReset}`}
        entity={entity}
        mode={formMode}
        state={mutationState}
        row={formMode === 'update' ? api.selectedRow : null}
        onCancel={() => {
          setFormReset((n) => n + 1);
        }}
        onCreate={async (input) => {
          await api.create(input);
        }}
        onUpdate={async (input) => {
          if (!api.selectedId) return;
          await api.update(api.selectedId, input);
        }}
      />

      {api.mutationState.status === 'loading' ? (
        <div style={{ gridColumn: '1 / -1' }}>
          <Spinner label="Applying mutation…" />
        </div>
      ) : null}
    </div>
  );
}
