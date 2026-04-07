import fp from 'fastify-plugin';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema.js';
import type { FastifyInstance } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    db: ReturnType<typeof drizzle<typeof schema>>;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const connectionString = process.env.DATABASE_URL!;
  const client = postgres(connectionString);
  const database = drizzle(client, { schema });
  fastify.decorate('db', database);
}, { name: 'db' });
