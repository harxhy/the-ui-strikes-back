# UI Copilot – OpenAPI → UI schema → demo UI

Hackathon project for **The UI Strikes Back**.

This repo is a small prototype that:

1. Parses an **OpenAPI v3** document into a deterministic **UI schema** (a JSON structure describing entities, fields, and CRUD endpoints).
2. Uses that UI schema to render a schema-driven **list / detail / form** CRUD UI in a demo Next.js app.

It’s designed for demo correctness and clarity, not for production.

## Repo layout

- `backend/ui_schema/parser.ts` — `parseOpenApiToUiSchema()` (OpenAPI v3 → UI schema)
- `backend/ui_schema/parser.test.ts` — parser tests (Bun)
- `demo/sample_openapi.yaml` — sample spec (duplicated into the frontend for convenience)
- `frontend/` — demo Next.js app
  - `frontend/public/sample_openapi.yaml` — the spec loaded by the demo at runtime
  - `frontend/generated-ui/` — schema-driven React views + a mocked in-memory API + tiny “Tambo-like” UI primitives

## Run locally

You’ll need [Bun](https://bun.sh/) installed.

### 1) Run the demo UI

```bash
cd frontend
bun install
bun run dev
```

Then open:

- `http://localhost:3000`

The home page loads `public/sample_openapi.yaml`, parses it with `parseOpenApiToUiSchema()`, and renders a generated list/detail/form UI with mock data.

### 2) Run parser tests (from the repo root)

```bash
bun test backend/ui_schema/parser.test.ts
```

## How the demo works

1. `frontend/app/OpenApiDemo.tsx` fetches `/sample_openapi.yaml`.
2. The YAML is parsed client-side into an `OpenApiV3Document` (demo simplicity).
3. `backend/ui_schema/parser.ts` converts it into a `UiSchema`.
4. `frontend/generated-ui/` renders list/detail/form views from that schema using a mock in-memory data layer.

## Charlie + Tambo

- **Charlie**: This project was built with help from Charlie (an autonomous coding agent) to iterate on the OpenAPI → UI schema parser and wire up the demo UI quickly.
- **Tambo**: The demo UI uses a tiny set of local “Tambo-like” primitives in `frontend/generated-ui/tambo/` (plus styles in `frontend/app/globals.css`) to keep the generated views readable without pulling in a full design system.
