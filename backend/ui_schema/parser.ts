export type UiSchema = {
  version: 1;
  entities: Record<string, UiEntitySchema>;
};

export type UiEntitySchema = {
  /** Stable key used to reference the entity in UI code. */
  id: string;
  title: string;
  /** Collection path (e.g. `/users`). */
  resourcePath: string;
  primaryKey: string | null;

  fields: UiField[];

  endpoints: Partial<Record<CrudAction, UiEndpoint>>;
  views: {
    list: { columns: string[] };
    detail: { fields: string[] };
    form: { fields: string[] };
  };
};

export type UiFieldType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'array'
  | 'object'
  | 'unknown';

export type UiField = {
  name: string;
  label: string;
  type: UiFieldType;
  format?: string;
  required: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  enum?: string[];
};

export type CrudAction = 'list' | 'read' | 'create' | 'update' | 'delete';

export type UiEndpoint = {
  method: HttpMethod;
  path: string;
  operationId?: string;
};

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Minimal (and intentionally incomplete) OpenAPI v3 types for this parser. */
export type OpenApiV3Document = {
  openapi: string;
  info?: { title?: string; version?: string };
  paths?: Record<string, OpenApiPathItem | undefined>;
  components?: {
    schemas?: Record<string, JsonSchema | undefined>;
  };
};

export type OpenApiPathItem = {
  get?: OpenApiOperation;
  post?: OpenApiOperation;
  put?: OpenApiOperation;
  patch?: OpenApiOperation;
  delete?: OpenApiOperation;
};

export type OpenApiOperation = {
  operationId?: string;
  tags?: string[];
  requestBody?: {
    content?: Record<string, { schema?: JsonSchema } | undefined>;
  };
  responses?: Record<string, OpenApiResponse | undefined>;
};

export type OpenApiResponse = {
  description?: string;
  content?: Record<string, { schema?: JsonSchema } | undefined>;
};

export type JsonSchema = {
  $ref?: string;
  title?: string;
  description?: string;
  type?: string;
  format?: string;
  enum?: unknown[];
  properties?: Record<string, JsonSchema | undefined>;
  required?: string[];
  items?: JsonSchema;
  allOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  readOnly?: boolean;
  writeOnly?: boolean;
};

type EntityAccumulator = {
  id: string;
  title: string;
  resourcePath: string;
  schemaName: string | null;
  endpoints: Partial<Record<CrudAction, UiEndpoint>>;
  schemaCandidates: JsonSchema[];
};

const HTTP_METHODS: Array<{ key: keyof OpenApiPathItem; method: HttpMethod }> = [
  { key: 'get', method: 'GET' },
  { key: 'post', method: 'POST' },
  { key: 'put', method: 'PUT' },
  { key: 'patch', method: 'PATCH' },
  { key: 'delete', method: 'DELETE' },
];

/**
* Convert an OpenAPI v3 document into a deterministic UI schema.
*
* This parser is intentionally heuristic-driven: it tries to infer entities
* from `$ref`'d component schemas and/or from resource paths.
*/
export function parseOpenApiToUiSchema(doc: OpenApiV3Document): UiSchema {
  if (!doc?.openapi || !doc.openapi.startsWith('3.')) {
    throw new Error('Expected an OpenAPI v3 document (doc.openapi must start with "3.")');
  }

  const paths = doc.paths ?? {};
  const entitiesById = new Map<string, EntityAccumulator>();

  for (const path of sortedKeys(paths)) {
    const pathItem = paths[path];
    if (!pathItem) continue;

    for (const { key, method } of HTTP_METHODS) {
      const op = pathItem[key];
      if (!op) continue;

      const crud = inferCrudAction(method, path);
      if (!crud) continue;

      const resourcePath = inferResourcePath(path);
      const responseSchema = pickOperationResponseSchema(op);
      const requestSchema = pickOperationRequestSchema(op);

      const schemaName =
        inferSchemaName(responseSchema) ??
        inferSchemaName(requestSchema) ??
        (op.tags?.length ? toPascalCase(op.tags[0]!) : null);

      const entityId = schemaName ?? toPascalCase(singularize(lastPathSegment(resourcePath) ?? 'Entity'));

      let acc = entitiesById.get(entityId);
      if (!acc) {
        acc = {
          id: entityId,
          title: toTitle(entityId),
          resourcePath,
          schemaName,
          endpoints: {},
          schemaCandidates: [],
        };
        entitiesById.set(entityId, acc);
      }

      acc.resourcePath = pickMostSpecificResourcePath(acc.resourcePath, resourcePath);
      acc.schemaName = acc.schemaName ?? schemaName;
      acc.endpoints[crud] = { method, path, operationId: op.operationId };

      if (responseSchema) acc.schemaCandidates.push(responseSchema);
      if (requestSchema) acc.schemaCandidates.push(requestSchema);
    }
  }

  const entitiesOut: Record<string, UiEntitySchema> = {};
  for (const entityId of [...entitiesById.keys()].sort((a, b) => a.localeCompare(b))) {
    const acc = entitiesById.get(entityId)!;
    const baseSchema = pickEntitySchema(doc, acc.schemaName, acc.schemaCandidates);
    const fields = buildFields(doc, baseSchema);
    const primaryKey = inferPrimaryKey(fields);

    const detailFields = fields.map((f) => f.name);
    const formFields = pickFormFields(fields, primaryKey);
    const listColumns = pickListColumns(fields, primaryKey);

    entitiesOut[entityId] = {
      id: acc.id,
      title: acc.title,
      resourcePath: acc.resourcePath,
      primaryKey,
      fields,
      endpoints: acc.endpoints,
      views: {
        list: { columns: listColumns },
        detail: { fields: detailFields },
        form: { fields: formFields },
      },
    };
  }

  return { version: 1, entities: entitiesOut };
}

function inferCrudAction(method: HttpMethod, path: string): CrudAction | null {
  const isItem = hasPathParams(path);
  switch (method) {
    case 'GET':
      return isItem ? 'read' : 'list';
    case 'POST':
      return isItem ? null : 'create';
    case 'PUT':
    case 'PATCH':
      return isItem ? 'update' : null;
    case 'DELETE':
      return isItem ? 'delete' : null;
    default:
      return null;
  }
}

function inferResourcePath(path: string): string {
  const segments = path.split('/').filter(Boolean);
  const first = segments.find((s) => !s.startsWith('{'));
  return first ? `/${first}` : path;
}

function pickMostSpecificResourcePath(a: string, b: string): string {
  if (a === b) return a;
  if (a.length !== b.length) return a.length < b.length ? a : b;
  return a.localeCompare(b) <= 0 ? a : b;
}

function pickOperationResponseSchema(op: OpenApiOperation): JsonSchema | null {
  const responses = op.responses ?? {};
  const successCodes = sortedKeys(responses).filter((code) => /^[2]\d\d$/.test(code));
  const preferred = successCodes.find((c) => c === '200') ?? successCodes[0];
  if (!preferred) return null;

  const res = responses[preferred];
  return pickJsonSchemaFromContent(res?.content);
}

function pickOperationRequestSchema(op: OpenApiOperation): JsonSchema | null {
  return pickJsonSchemaFromContent(op.requestBody?.content);
}

function pickJsonSchemaFromContent(
  content: Record<string, { schema?: JsonSchema } | undefined> | undefined,
): JsonSchema | null {
  if (!content) return null;
  const preferred =
    content['application/json'] ??
    content['application/*+json'] ??
    content['application/vnd.api+json'] ??
    content[sortedKeys(content)[0]!];

  return preferred?.schema ?? null;
}

function pickEntitySchema(doc: OpenApiV3Document, schemaName: string | null, candidates: JsonSchema[]): JsonSchema | null {
  if (schemaName) {
    const fromComponents = doc.components?.schemas?.[schemaName];
    if (fromComponents) return { $ref: `#/components/schemas/${schemaName}` };
  }

  for (const candidate of candidates) {
    const refName = inferSchemaName(candidate);
    if (refName && doc.components?.schemas?.[refName]) {
      return { $ref: `#/components/schemas/${refName}` };
    }
  }

  return candidates[0] ?? null;
}

function buildFields(doc: OpenApiV3Document, schema: JsonSchema | null): UiField[] {
  if (!schema) return [];
  const resolved = resolveSchema(doc, schema);

  if (resolved.type === 'array' && resolved.items) {
    return buildFields(doc, resolved.items);
  }

  if (resolved.type !== 'object' && !resolved.properties) {
    return [];
  }

  const required = new Set(resolved.required ?? []);
  const props = resolved.properties ?? {};
  const out: UiField[] = [];

  for (const name of sortedKeys(props)) {
    const prop = props[name];
    if (!prop) continue;
    const p = resolveSchema(doc, prop);
    const type = normalizeSchemaType(p);

    out.push({
      name,
      label: toTitle(name),
      type,
      format: typeof p.format === 'string' ? p.format : undefined,
      required: required.has(name),
      readOnly: p.readOnly ? true : undefined,
      writeOnly: p.writeOnly ? true : undefined,
      enum: Array.isArray(p.enum) ? p.enum.map(String).sort((a, b) => a.localeCompare(b)) : undefined,
    });
  }

  return out;
}

function resolveSchema(doc: OpenApiV3Document, schema: JsonSchema, seenRefs = new Set<string>()): JsonSchema {
  if (schema.$ref) {
    const refName = parseSchemaRef(schema.$ref);
    if (!refName) return schema;

    if (seenRefs.has(refName)) return schema;
    seenRefs.add(refName);

    const resolved = doc.components?.schemas?.[refName];
    if (!resolved) return schema;
    return resolveSchema(doc, resolved, seenRefs);
  }

  if (schema.allOf?.length) {
    const parts = schema.allOf.map((s) => resolveSchema(doc, s, new Set(seenRefs)));
    return mergeAllOf(parts);
  }

  return schema;
}

function mergeAllOf(parts: JsonSchema[]): JsonSchema {
  const merged: JsonSchema = { type: 'object', properties: {}, required: [] };
  const required = new Set<string>();

  for (const p of parts) {
    if (p.type) merged.type = p.type;
    if (p.format && !merged.format) merged.format = p.format;
    if (p.readOnly) merged.readOnly = true;
    if (p.writeOnly) merged.writeOnly = true;
    if (p.required) for (const r of p.required) required.add(r);

    if (p.properties) {
      merged.properties = merged.properties ?? {};
      for (const [k, v] of Object.entries(p.properties)) {
        if (!v) continue;
        merged.properties[k] = v;
      }
    }
  }

  merged.required = [...required].sort((a, b) => a.localeCompare(b));
  if (merged.required.length === 0) delete merged.required;
  if (merged.properties && Object.keys(merged.properties).length === 0) delete merged.properties;

  return merged;
}

function inferSchemaName(schema: JsonSchema | null): string | null {
  if (!schema) return null;

  if (schema.$ref) {
    return parseSchemaRef(schema.$ref);
  }

  if (schema.type === 'array' && schema.items) {
    return inferSchemaName(schema.items);
  }

  return null;
}

function parseSchemaRef(ref: string): string | null {
  const prefix = '#/components/schemas/';
  if (!ref.startsWith(prefix)) return null;
  const name = ref.slice(prefix.length);
  return name ? decodeURIComponent(name) : null;
}

function normalizeSchemaType(schema: JsonSchema): UiFieldType {
  if (schema.oneOf?.length || schema.anyOf?.length) return 'unknown';
  if (schema.type === 'string') return 'string';
  if (schema.type === 'number') return 'number';
  if (schema.type === 'integer') return 'integer';
  if (schema.type === 'boolean') return 'boolean';
  if (schema.type === 'array') return 'array';
  if (schema.type === 'object' || schema.properties) return 'object';
  return 'unknown';
}

function inferPrimaryKey(fields: UiField[]): string | null {
  const names = new Set(fields.map((f) => f.name));
  if (names.has('id')) return 'id';
  if (names.has('_id')) return '_id';

  const candidate = fields
    .map((f) => f.name)
    .filter((n) => /id$/i.test(n))
    .sort((a, b) => a.localeCompare(b))[0];

  return candidate ?? null;
}

function pickFormFields(fields: UiField[], primaryKey: string | null): string[] {
  const required = fields.filter((f) => f.required);
  const optional = fields.filter((f) => !f.required);

  const pick = (list: UiField[]) =>
    list
      .filter((f) => !f.readOnly)
      .filter((f) => !(primaryKey && f.name === primaryKey && !f.required))
      .map((f) => f.name);

  return [...pick(required), ...pick(optional)];
}

function pickListColumns(fields: UiField[], primaryKey: string | null): string[] {
  const scalarFields = fields.filter((f) => f.type !== 'object' && f.type !== 'array');
  const ordered = scalarFields.map((f) => f.name);

  if (primaryKey) {
    const rest = ordered.filter((n) => n !== primaryKey);
    return [primaryKey, ...rest].slice(0, 5);
  }

  return ordered.slice(0, 5);
}

function hasPathParams(path: string): boolean {
  return /\{[^}]+\}/.test(path);
}

function lastPathSegment(path: string): string | null {
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? null;
}

function singularize(word: string): string {
  if (word.endsWith('ies') && word.length > 3) return `${word.slice(0, -3)}y`;
  if (word.endsWith('ses') && word.length > 3) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 1) return word.slice(0, -1);
  return word;
}

function toPascalCase(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9]+/g, ' ').trim();
  if (!cleaned) return '';

  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((part) => `${part[0]!.toUpperCase()}${part.slice(1)}`)
    .join('');
}

function toTitle(value: string): string {
  const spaced = value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();

  return spaced
    .split(/\s+/g)
    .filter(Boolean)
    .map((w) => `${w[0]!.toUpperCase()}${w.slice(1)}`)
    .join(' ');
}

function sortedKeys<T extends Record<string, unknown>>(obj: T): Array<keyof T & string> {
  return Object.keys(obj).sort((a, b) => a.localeCompare(b)) as Array<keyof T & string>;
}
