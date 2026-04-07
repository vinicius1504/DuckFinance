import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as accountService from '../services/account.service.js';

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['checking', 'savings', 'investment', 'cash', 'other']),
  balance: z.number(),
  color: z.string().optional(),
  institution: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['checking', 'savings', 'investment', 'cash', 'other']).optional(),
  balance: z.number().optional(),
  color: z.string().optional(),
  institution: z.string().optional(),
  isActive: z.boolean().optional(),
});

export default async function accountRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/accounts', async (request) => {
    return accountService.getAccounts(app, request.user.sub);
  });

  app.get('/accounts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const account = await accountService.getAccountById(app, request.user.sub, id);
    if (!account) return reply.status(404).send({ error: 'Account not found' });
    return account;
  });

  app.post('/accounts', async (request, reply) => {
    const body = createSchema.parse(request.body);
    const account = await accountService.createAccount(app, request.user.sub, body);
    return reply.status(201).send(account);
  });

  app.put('/accounts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateSchema.parse(request.body);
    const account = await accountService.updateAccount(app, request.user.sub, id, body);
    if (!account) return reply.status(404).send({ error: 'Account not found' });
    return account;
  });

  app.delete('/accounts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const account = await accountService.deleteAccount(app, request.user.sub, id);
    if (!account) return reply.status(404).send({ error: 'Account not found' });
    return { success: true };
  });
}
