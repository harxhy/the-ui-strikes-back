import type { OpenApiV3Document } from '../../../backend/ui_schema/parser';

export const todoOpenApi: OpenApiV3Document = {
  openapi: '3.0.0',
  paths: {
    '/todos': {
      get: {
        operationId: 'listTodos',
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
        operationId: 'createTodo',
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
        operationId: 'getTodo',
        responses: {
          '200': {
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Todo' } },
            },
          },
        },
      },
      patch: {
        operationId: 'updateTodo',
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
    },
  },
  components: {
    schemas: {
      Todo: {
        type: 'object',
        required: ['id', 'title', 'done', 'priority'],
        properties: {
          id: { type: 'string', readOnly: true },
          title: { type: 'string' },
          done: { type: 'boolean' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          createdAt: { type: 'string', format: 'date-time', readOnly: true },
        },
      },
      TodoCreate: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string' },
          done: { type: 'boolean' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
      },
      TodoUpdate: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          done: { type: 'boolean' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
      },
    },
  },
};
