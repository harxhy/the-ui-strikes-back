'use client';

import { useMemo, useState } from 'react';

import type { UiEntitySchema } from '../../../backend/ui_schema/parser';
import { createInMemoryMockApi } from '../mock/mockApi';
import { GeneratedDetailView } from '../views/GeneratedDetailView';
import { GeneratedFormView } from '../views/GeneratedFormView';
import { GeneratedListView } from '../views/GeneratedListView';

type TodoRow = {
  id: string;
  title: string;
  done: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
};

type View =
  | { kind: 'list' }
  | { kind: 'detail'; id: string }
  | { kind: 'create' }
  | { kind: 'edit'; id: string };

export function GeneratedCrudPlayground({ entity }: { entity: UiEntitySchema }) {
  const api = useMemo(
    () =>
      createInMemoryMockApi<TodoRow>({
        latencyMs: 500,
        seed: [
          {
            id: '1',
            title: 'Ship hackathon demo',
            done: false,
            priority: 'high',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          },
          {
            id: '2',
            title: 'Generate UI from schema',
            done: true,
            priority: 'medium',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          },
        ],
      }),
    [],
  );

  const [view, setView] = useState<View>({ kind: 'list' });

  if (view.kind === 'list') {
    return (
      <GeneratedListView
        entity={entity}
        api={api}
        onSelectRow={(id) => setView({ kind: 'detail', id })}
        onCreate={() => setView({ kind: 'create' })}
      />
    );
  }

  if (view.kind === 'detail') {
    return (
      <GeneratedDetailView
        entity={entity}
        api={api}
        id={view.id}
        onBack={() => setView({ kind: 'list' })}
        onEdit={(id) => setView({ kind: 'edit', id })}
      />
    );
  }

  if (view.kind === 'create') {
    return (
      <GeneratedFormView
        entity={entity}
        api={api}
        mode="create"
        onCancel={() => setView({ kind: 'list' })}
        onSubmitSuccess={(created) => setView({ kind: 'detail', id: created.id })}
      />
    );
  }

  return (
    <GeneratedFormView
      entity={entity}
      api={api}
      mode="update"
      id={view.id}
      onCancel={() => setView({ kind: 'detail', id: view.id })}
      onSubmitSuccess={(updated) => setView({ kind: 'detail', id: updated.id })}
    />
  );
}
