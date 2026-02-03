export type CrudMockApi<RecordT extends Record<string, unknown> = Record<string, unknown>> = {
  list: () => Promise<RecordT[]>;
  read: (id: string) => Promise<RecordT | null>;
  create: (input: Partial<RecordT>) => Promise<RecordT>;
  update: (id: string, input: Partial<RecordT>) => Promise<RecordT | null>;
};

export type CreateInMemoryMockApiOptions<RecordT extends Record<string, unknown>> = {
  seed: RecordT[];
  /** Used when generating ids for newly created records. Defaults to `id`. */
  idField?: keyof RecordT & string;
  /** Artificial latency to make loading states visible. */
  latencyMs?: number;
};

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function createInMemoryMockApi<RecordT extends Record<string, unknown>>(
  options: CreateInMemoryMockApiOptions<RecordT>,
): CrudMockApi<RecordT> {
  const idField = options.idField ?? 'id';
  const latencyMs = options.latencyMs ?? 450;

  // Shared mutable state (good enough for a hackathon demo).
  let rows = [...options.seed];
  let nextId = rows.length + 1;

  return {
    async list() {
      await delay(latencyMs);
      return [...rows];
    },

    async read(id) {
      await delay(latencyMs);
      return rows.find((r) => String(r[idField]) === String(id)) ?? null;
    },

    async create(input) {
      await delay(latencyMs);
      const created = { ...(input as RecordT), [idField]: String(nextId++) } as RecordT;
      rows = [created, ...rows];
      return created;
    },

    async update(id, input) {
      await delay(latencyMs);
      const idx = rows.findIndex((r) => String(r[idField]) === String(id));
      if (idx === -1) return null;
      rows[idx] = { ...rows[idx], ...(input as RecordT) };
      return rows[idx] ?? null;
    },
  };
}
