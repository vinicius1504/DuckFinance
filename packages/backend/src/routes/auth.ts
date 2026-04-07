import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { registerUser, loginUser } from '../services/auth.service.js';
import { users } from '../db/schema.js';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export default async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);
    try {
      const result = await registerUser(app, body);
      return reply.status(201).send(result);
    } catch (err: any) {
      if (err.message === 'Email already registered') {
        return reply.status(409).send({ error: err.message });
      }
      throw err;
    }
  });

  app.post('/auth/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    try {
      const result = await loginUser(app, body);
      return reply.send(result);
    } catch (err: any) {
      if (err.message === 'Invalid credentials') {
        return reply.status(401).send({ error: err.message });
      }
      throw err;
    }
  });

  app.get('/auth/me', { preHandler: [app.authenticate] }, async (request) => {
    const { sub } = request.user;
    const [user] = await app.db.select({
      id: users.id,
      name: users.name,
      email: users.email,
    }).from(users).where(eq(users.id, sub));
    return user;
  });
}
