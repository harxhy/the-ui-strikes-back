import { parseOpenApiToUiSchema, type OpenApiV3Document } from './parser';

const spec: OpenApiV3Document = {
  openapi: '3.0.0',
  paths: {
    '/todos': {
      get: {
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Todo' } },
              },
            },
          },
        },
      },
      post: {
        requestBody: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/TodoCreate' } },
          },
        },
        responses: {
          '201': {
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Todo' } },
            },
          },
        },
      },
    },
    '/todos/{id}': {
      get: {
        responses: {
          '200': {
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Todo' } },
            },
          },
        },
      },
      patch: {
        requestBody: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/TodoUpdate' } },
          },
        },
        responses: {
          '200': {
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Todo' } },
            },
          },
        },
      },
      delete: { responses: { '204': { description: 'Deleted' } } },
    },
  },
  components: {
    schemas: {
      Todo: {
        type: 'object',
        required: ['id', 'title', 'done'],
        properties: {
          id: { type: 'string', readOnly: true },
          title: { type: 'string' },
          done: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time', readOnly: true },
        },
      },
      TodoCreate: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string' },
        },
      },
      TodoUpdate: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          done: { type: 'boolean' },
        },
      },
    },
  },
};

const uiSchema = parseOpenApiToUiSchema(spec);
console.log(JSON.stringify(uiSchema, null, 2));
