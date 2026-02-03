import fs from 'node:fs/promises';
import path from 'node:path';

import { parse as parseYaml } from 'yaml';

import { parseOpenApiToUiSchema, type OpenApiV3Document } from '../../backend/ui_schema/parser';
import { DemoClient } from '../generated-ui/DemoClient';

export const dynamic = 'force-static';

export default async function HomePage() {
  try {
    const openApiPath = path.resolve(process.cwd(), '..', 'demo', 'sample_openapi.yaml');
    const openApiYaml = await fs.readFile(openApiPath, 'utf8');
    const openApiDoc = parseYaml(openApiYaml) as OpenApiV3Document;

    const uiSchema = parseOpenApiToUiSchema(openApiDoc);

    return <DemoClient openApiYaml={openApiYaml} uiSchema={uiSchema} />;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return (
      <main style={{ padding: 32, color: 'var(--text)' }}>
        <div
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 18,
            display: 'grid',
            gap: 10,
            maxWidth: 920,
            margin: '0 auto',
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 900 }}>Demo failed to load</div>
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Could not read/parse OpenAPI or generate UI schema.</div>
          <pre
            style={{
              margin: 0,
              background: 'rgba(0,0,0,0.32)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: 14,
              overflow: 'auto',
            }}
          >
            {message}
          </pre>
        </div>
      </main>
    );
  }
}
