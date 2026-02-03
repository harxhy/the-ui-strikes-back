## UI Copilot demo frontend

This is a small Next.js (App Router) app used for the hackathon demo.

### Run locally

```bash
cd frontend
bun install
bun run dev
```

The home page (`/`) loads `demo/sample_openapi.yaml`, runs `parseOpenApiToUiSchema()`, and renders a generated list/detail/form UI with mock data.
