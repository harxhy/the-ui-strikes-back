/**
 * UI Copilot – OpenAPI v3 to UI schema parser.
 * 
 * Given an OpenAPI v3 spec (as JS object), extracts basic CRUD endpoint
 * mapping into a UI-oriented schema for rapid UI prototyping.
 * 
 * No dependencies, hackathon/draft-grade code.
 */

// --- Types

type UiSchema = {
  entity: string;
  list?: {
    endpoint: string;
    method: string;
  };
  detail?: {
    endpoint: string;
    method: string;
  };
  form?: {
    create?: {
      endpoint: string;
      method: string;
    };
    update?: {
      endpoint: string;
      method: string;
    };
  };
};

type OpenAPISpec = any; // For the hackathon, not fully typed.

// --- Utility Functions

function capitalize(word: string): string {
  if (!word) return "";
  return word[0].toUpperCase() + word.slice(1);
}

// Very basic plural-to-singular. For demo only.
function singularize(word: string): string {
  if (word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.endsWith("ses")) return word.slice(0, -2);
  if (word.endsWith("s") && word.length > 1) return word.slice(0, -1);
  return word;
}

// Extracts top-level resource from path, e.g.,
//
//  - /users --> users
//  - /users/{id} --> users
//  - /accounts/{accountId}/users --> users (nested, picks last segment)
//
function extractEntityName(path: string): string | null {
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 0) return null;
  // prefer collection endpoints (avoid simple id param as entity)
  if (segments.length >= 2 && segments[segments.length - 1].startsWith('{')) {
    return segments[segments.length - 2];
  }
  return segments[segments.length - 1];
}

// Determines if a path is a collection (list) endpoint (no {param} at end)
function isCollectionPath(path: string): boolean {
  return !/{[^}]+}$/.test(path);
}

// Determines if a path is a detail endpoint (ends with {param})
function isDetailPath(path: string): boolean {
  return /{[^}]+}$/.test(path);
}

// --- Main Function

export function parseOpenApiToUiSchema(openApi: OpenAPISpec): UiSchema[] {
  if (!openApi || typeof openApi !== "object" || !openApi.paths) {
    throw new Error("Invalid OpenAPI spec provided.");
  }

  // Map: entityName(lowercase) -> endpoints we find
  const entities: {
    [entity: string]: {
      entity: string,
      list?: { endpoint: string; method: string };  
      detail?: { endpoint: string; method: string };  
      form: {
        create?: { endpoint: string; method: string };  
        update?: { endpoint: string; method: string };  
      };
    }
  } = {};

  const paths = openApi.paths;
  for (const pathName in paths) {
    const methods = paths[pathName];
    const entitySegment = extractEntityName(pathName);
    if (!entitySegment) continue;
    const entityName = capitalize(singularize(entitySegment.toLowerCase())); // e.g. users -> User

    // Setup initial if doesn't exist
    if (!entities[entityName]) {
      entities[entityName] = { entity: entityName, form: {} };
    }

    for (const method in methods) {
      const m = method.toUpperCase();
      // List view - GET on collection
      if (m === "GET" && isCollectionPath(pathName)) {
        // Prefer first found as main list
        if (!entities[entityName].list) {
          entities[entityName].list = { endpoint: pathName, method: m };
        }
      }
      // Detail view - GET by id
      else if (m === "GET" && isDetailPath(pathName)) {
        if (!entities[entityName].detail) {
          entities[entityName].detail = { endpoint: pathName, method: m };
        }
      }
      // Form views
      else if (m === "POST" && isCollectionPath(pathName)) {
        // Create on collection
        if (!entities[entityName].form.create) {
          entities[entityName].form.create = { endpoint: pathName, method: m };
        }
      }
      else if ((m === "PUT" || m === "PATCH") && isDetailPath(pathName)) {
        // Update on detail
        if (!entities[entityName].form.update) {
          entities[entityName].form.update = { endpoint: pathName, method: m };
        }
      }
      // You can add DELETE/other methods here for further expansion
    }
  }

  // Output array, filter to only entities that have at least a list or detail or form
  const result: UiSchema[] = Object.values(entities).filter(e =>
    e.list || e.detail || e.form.create || e.form.update
  ).map(e => ({
    entity: e.entity,
    ...(e.list ? { list: e.list } : {}),
    ...(e.detail ? { detail: e.detail } : {}),
    ...(e.form.create || e.form.update
      ? {
          form: {
            ...(e.form.create ? { create: e.form.create } : {}),
            ...(e.form.update ? { update: e.form.update } : {}),
          }
        }
      : {})
  }));

  return result;
}

// --- Example Usage

if (require.main === module) {
  // Minimal OpenAPI-like object for demonstration
  const openApiSpec = {
    openapi: "3.0.0",
    paths: {
      "/users": {
        get: {},
        post: {}
      },
      "/users/{id}": {
        get: {},
        put: {}
      },
      "/posts": {
        get: {}
      },
      "/posts/{id}": {
        get: {},
        patch: {}
      }
    }
  };

  const schema = parseOpenApiToUiSchema(openApiSpec);
  console.log("Parsed UI Schema:", JSON.stringify(schema, null, 2));
}

/*
Example Output:

[
  {
    "entity": "User",
    "list": { "endpoint": "/users", "method": "GET" },
    "detail": { "endpoint": "/users/{id}", "method": "GET" },
    "form": {
      "create": { "endpoint": "/users", "method": "POST" },
      "update": { "endpoint": "/users/{id}", "method": "PUT" }
    }
  },
  {
    "entity": "Post",
    "list": { "endpoint": "/posts", "method": "GET" },
    "detail": { "endpoint": "/posts/{id}", "method": "GET" },
    "form": {
      "update": { "endpoint": "/posts/{id}", "method": "PATCH" }
    }
  }
]
*/
