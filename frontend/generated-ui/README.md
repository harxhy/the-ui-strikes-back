# `generated-ui/`

Hackathon-grade, schema-driven CRUD UI.

This folder contains generic React components that render **list / detail / form** views from the UI schema produced by `parseOpenApiToUiSchema()`.

- Views live in `generated-ui/views/`
- Minimal (local) **Tambo-like primitives** live in `generated-ui/tambo/`
- A mocked in-memory fetch layer lives in `generated-ui/mock/`

The home page (`frontend/app/page.tsx`) wires these together with a sample OpenAPI document.
