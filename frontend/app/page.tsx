import { parseOpenApiToUiSchema } from '../../backend/ui_schema/parser';
import { todoOpenApi } from '../generated-ui/demo/openapiTodo';
import { GeneratedCrudPlayground } from '../generated-ui/demo/GeneratedCrudPlayground';

const ui = parseOpenApiToUiSchema(todoOpenApi);
const todo = ui.entities.Todo;

export default function HomePage() {
  if (!todo) {
    return (
      <main className="container">
        <div className="card">
          <div style={{ fontSize: 22, fontWeight: 900 }}>UI Copilot Demo</div>
          <p className="muted">No entity named “Todo” was inferred from the sample OpenAPI doc.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container stack">
      <div className="card row-between">
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>UI Copilot Demo</div>
          <div className="muted">
            Generated list / detail / form views from <span className="mono">parseOpenApiToUiSchema()</span>
          </div>
        </div>
        <div className="pill">Hackathon mode</div>
      </div>

      <GeneratedCrudPlayground entity={todo} />
    </main>
  );
}
