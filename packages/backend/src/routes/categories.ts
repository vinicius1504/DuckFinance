import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as categoryService from '../services/category.service.js';

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['income', 'expense']),
  icon: z.string().optional(),
  color: z.string().optional(),
  parentId: z.string().uuid().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['income', 'expense']).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  parentId: z.string().uuid().nullable().optional(),
});

export default async function categoryRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/categories', async (request) => {
    return categoryService.getCategories(app, request.user.sub);
  });

  app.get('/categories/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const category = await categoryService.getCategoryById(app, request.user.sub, id);
    if (!category) return reply.status(404).send({ error: 'Category not found' });
    return category;
  });

  app.post('/categories', async (request, reply) => {
    const body = createSchema.parse(request.body);
    const category = await categoryService.createCategory(app, request.user.sub, body);
    return reply.status(201).send(category);
  });

  app.put('/categories/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateSchema.parse(request.body);
    const category = await categoryService.updateCategory(app, request.user.sub, id, body);
    if (!category) return reply.status(404).send({ error: 'Category not found' });
    return category;
  });

  app.delete('/categories/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const category = await categoryService.deleteCategory(app, request.user.sub, id);
    if (!category) return reply.status(404).send({ error: 'Category not found' });
    return { success: true };
  });
}
