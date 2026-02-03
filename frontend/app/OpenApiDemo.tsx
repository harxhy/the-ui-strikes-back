'use client';

import { useCallback, useEffect, useState } from 'react';

import { parse as parseYaml } from 'yaml';

import { parseOpenApiToUiSchema, type OpenApiV3Document } from '../../backend/ui_schema/parser';
import { DemoClient } from '../generated-ui/DemoClient';
import { Badge, Button, CodeBlock, Panel, Spinner, VStack } from '../generated-ui/tambo';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; openApiYaml: string; uiSchema: ReturnType<typeof parseOpenApiToUiSchema> };

async function loadOpenApiFromPublic(): Promise<string> {
  const res = await fetch('/sample_openapi.yaml');
  if (!res.ok) {
    throw new Error(`Failed to load /sample_openapi.yaml (${res.status})`);
  }
  return await res.text();
}

export function OpenApiDemo() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const run = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const openApiYaml = await loadOpenApiFromPublic();
      const openApiDoc = parseYaml(openApiYaml) as OpenApiV3Document;
      const uiSchema = parseOpenApiToUiSchema(openApiDoc);
      setState({ status: 'success', openApiYaml, uiSchema });
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }, []);

  useEffect(() => {
    void run();
  }, [run]);

  if (state.status === 'loading') {
    return (
      <main style={{ padding: 32 }}>
        <Panel style={{ maxWidth: 980, margin: '0 auto' }}>
          <Spinner label="Loading demo OpenAPI…" />
        </Panel>
      </main>
    );
  }

  if (state.status === 'error') {
    return (
      <main style={{ padding: 32 }}>
        <Panel style={{ maxWidth: 980, margin: '0 auto' }}>
          <VStack gap={12}>
            <Badge tone="danger">Demo failed to load</Badge>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>
              Could not load/parse the sample OpenAPI or generate a UI schema.
            </div>
            <CodeBlock code={state.message} maxHeight={240} />
            <Button onClick={run}>Retry</Button>
          </VStack>
        </Panel>
      </main>
    );
  }

  return <DemoClient openApiYaml={state.openApiYaml} uiSchema={state.uiSchema} />;
}
