import 'dotenv/config';
import { db } from './connection.js';
import { categories } from './schema.js';

const DEFAULT_CATEGORIES = [
  // Expense categories
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
  // Income categories
  { name: 'Salario', type: 'income', icon: 'banknote', color: '#2ECC71' },
  { name: 'Freelance', type: 'income', icon: 'laptop', color: '#3498DB' },
  { name: 'Investimentos', type: 'income', icon: 'trending-up', color: '#F1C40F' },
  { name: 'Outros Rendimentos', type: 'income', icon: 'plus-circle', color: '#1ABC9C' },
] as const;

async function seed() {
  console.log('Seeding default categories...');

  // Note: seed requires a userId. This is meant to be called per-user via the auth service.
  // For now, just log.
  console.log(`${DEFAULT_CATEGORIES.length} default categories ready to be assigned on user registration.`);
  process.exit(0);
}

export { DEFAULT_CATEGORIES };
seed();
