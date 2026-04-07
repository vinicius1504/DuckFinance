import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { users, categories } from '../db/schema.js';
import type { FastifyInstance } from 'fastify';

const DEFAULT_CATEGORIES = [
  { name: 'Alimentacao', type: 'expense', icon: 'utensils', color: '#FF6B6B' },
  { name: 'Transporte', type: 'expense', icon: 'car', color: '#4ECDC4' },
  { name: 'Moradia', type: 'expense', icon: 'home', color: '#45B7D1' },
  { name: 'Saude', type: 'expense', icon: 'heart-pulse', color: '#96CEB4' },
  { name: 'Educacao', type: 'expense', icon: 'graduation-cap', color: '#FFEAA7' },
  { name: 'Lazer', type: 'expense', icon: 'gamepad-2', color: '#DDA0DD' },
  { name: 'Vestuario', type: 'expense', icon: 'shirt', color: '#FF8C94' },
  { name: 'Servicos', type: 'expense', icon: 'wrench', color: '#A8D8EA' },
  { name: 'Compras', type: 'expense', icon: 'shopping-bag', color: '#FFB347' },
  { name: 'Assinaturas', type: 'expense', icon: 'repeat', color: '#B19CD9' },
  { name: 'Impostos', type: 'expense', icon: 'receipt', color: '#FF6961' },
  { name: 'Outros', type: 'expense', icon: 'circle-dot', color: '#95A5A6' },
  { name: 'Salario', type: 'income', icon: 'banknote', color: '#2ECC71' },
  { name: 'Freelance', type: 'income', icon: 'laptop', color: '#3498DB' },
  { name: 'Investimentos', type: 'income', icon: 'trending-up', color: '#F1C40F' },
  { name: 'Outros Rendimentos', type: 'income', icon: 'plus-circle', color: '#1ABC9C' },
] as const;

export async function registerUser(app: FastifyInstance, data: { name: string; email: string; password: string }) {
  const existing = await app.db.select().from(users).where(eq(users.email, data.email)).limit(1);
  if (existing.length > 0) {
    throw new Error('Email already registered');
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const [user] = await app.db.insert(users).values({
    name: data.name,
    email: data.email,
    passwordHash,
  }).returning();

  // Seed default categories for new user
  await app.db.insert(categories).values(
    DEFAULT_CATEGORIES.map((c) => ({
      userId: user.id,
      name: c.name,
      type: c.type,
      icon: c.icon,
      color: c.color,
    }))
  );

  const token = app.jwt.sign({ sub: user.id, email: user.email });
  return { token, user: { id: user.id, name: user.name, email: user.email } };
}

export async function loginUser(app: FastifyInstance, data: { email: string; password: string }) {
  const [user] = await app.db.select().from(users).where(eq(users.email, data.email)).limit(1);
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid credentials');
  }

  const token = app.jwt.sign({ sub: user.id, email: user.email });
  return { token, user: { id: user.id, name: user.name, email: user.email } };
}
