import { describe, expect, it } from 'bun:test';

import { parseOpenApiToUiSchema, type OpenApiV3Document } from './parser';

describe('parseOpenApiToUiSchema', () => {
  it('infers entities, fields, endpoints, and views from a typical CRUD spec', () => {
    const spec: OpenApiV3Document = {
      openapi: '3.0.0',
      paths: {
        '/users': {
          get: {
            operationId: 'listUsers',
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                  },
                },
              },
            },
          },
          post: {
            operationId: 'createUser',
            requestBody: {
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/UserCreate' } },
              },
            },
            responses: {
              '201': {
                content: {
                  'application/json': { schema: { $ref: '#/components/schemas/User' } },
                },
              },
            },
          },
        },
        '/users/{id}': {
          get: {
            operationId: 'getUser',
            responses: {
              '200': {
                content: {
                  'application/json': { schema: { $ref: '#/components/schemas/User' } },
                },
              },
            },
          },
          patch: {
            operationId: 'updateUser',
            requestBody: {
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/UserUpdate' } },
              },
            },
            responses: {
              '200': {
                content: {
                  'application/json': { schema: { $ref: '#/components/schemas/User' } },
                },
              },
            },
          },
          delete: {
            operationId: 'deleteUser',
            responses: { '204': { description: 'Deleted' } },
          },
        },
      },
      components: {
        schemas: {
          User: {
            type: 'object',
            required: ['id', 'email'],
            properties: {
              id: { type: 'string', readOnly: true },
              email: { type: 'string', format: 'email' },
              name: { type: 'string' },
              isActive: { type: 'boolean' },
              role: { type: 'string', enum: ['admin', 'user'] },
              createdAt: { type: 'string', format: 'date-time', readOnly: true },
            },
          },
          UserCreate: {
            allOf: [
              { $ref: '#/components/schemas/User' },
              {
                type: 'object',
                required: ['password'],
                properties: {
                  password: { type: 'string', writeOnly: true },
                },
              },
            ],
          },
          UserUpdate: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              isActive: { type: 'boolean' },
            },
          },
        },
      },
    };

    const ui = parseOpenApiToUiSchema(spec);
    expect(ui.version).toBe(1);
    expect(Object.keys(ui.entities)).toEqual(['User']);

    const user = ui.entities.User!;
    expect(user.resourcePath).toBe('/users');
    expect(user.primaryKey).toBe('id');

    expect(user.endpoints).toEqual({
      create: { method: 'POST', operationId: 'createUser', path: '/users' },
      delete: { method: 'DELETE', operationId: 'deleteUser', path: '/users/{id}' },
      list: { method: 'GET', operationId: 'listUsers', path: '/users' },
      read: { method: 'GET', operationId: 'getUser', path: '/users/{id}' },
      update: { method: 'PATCH', operationId: 'updateUser', path: '/users/{id}' },
    });

    expect(user.fields.map((f) => f.name)).toEqual([
      'createdAt',
      'email',
      'id',
      'isActive',
      'name',
      'role',
    ]);

    expect(user.views.list.columns).toEqual(['id', 'createdAt', 'email', 'isActive', 'name']);
    expect(user.views.detail.fields).toEqual(['createdAt', 'email', 'id', 'isActive', 'name', 'role']);
    expect(user.views.form.fields).toEqual(['email', 'isActive', 'name', 'role']);

    // Determinism: parse twice yields a deep-equal schema.
    expect(parseOpenApiToUiSchema(spec)).toEqual(ui);
  });

  it('falls back to path-based entity naming when schemas are inline', () => {
    const spec: OpenApiV3Document = {
      openapi: '3.0.0',
      paths: {
        '/widgets': {
          get: {
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          label: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const ui = parseOpenApiToUiSchema(spec);
    expect(Object.keys(ui.entities)).toEqual(['Widget']);
    expect(ui.entities.Widget!.fields.map((f) => f.name)).toEqual(['id', 'label']);
  });
});
