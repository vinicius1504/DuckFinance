import { eq, and, sql } from 'drizzle-orm';
import { budgets, categories, transactions, alerts } from '../db/schema.js';
import type { FastifyInstance } from 'fastify';

export async function getBudgets(app: FastifyInstance, userId: string, month: number, year: number) {
  const budgetRows = await app.db
    .select({
      id: budgets.id,
      userId: budgets.userId,
      categoryId: budgets.categoryId,
      amount: budgets.amount,
      month: budgets.month,
      year: budgets.year,
      createdAt: budgets.createdAt,
      updatedAt: budgets.updatedAt,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(budgets)
    .innerJoin(categories, eq(budgets.categoryId, categories.id))
    .where(and(eq(budgets.userId, userId), eq(budgets.month, month), eq(budgets.year, year)));

  // Calculate spent per category for this month
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`;

  const results = await Promise.all(
    budgetRows.map(async (b) => {
      const [spentResult] = await app.db
        .select({ total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)` })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.categoryId, b.categoryId),
            eq(transactions.type, 'expense'),
            sql`${transactions.date} >= ${startDate}`,
            sql`${transactions.date} < ${endDate}`,
          ),
        );

      const spent = Number(spentResult?.total || 0);
      const amount = Number(b.amount);
      const percentage = amount > 0 ? (spent / amount) * 100 : 0;

      return {
        budget: {
          id: b.id,
          userId: b.userId,
          categoryId: b.categoryId,
          amount,
          month: b.month,
          year: b.year,
          spent,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        },
        categoryName: b.categoryName,
        categoryColor: b.categoryColor,
        percentage: Math.round(percentage * 100) / 100,
        remaining: amount - spent,
      };
    }),
  );

  return results;
}

export async function createBudget(app: FastifyInstance, userId: string, data: {
  categoryId: string;
  amount: number;
  month: number;
  year: number;
}) {
  // Check for duplicate (same category + month + year)
  const [existing] = await app.db
    .select()
    .from(budgets)
    .where(
      and(
        eq(budgets.userId, userId),
        eq(budgets.categoryId, data.categoryId),
        eq(budgets.month, data.month),
        eq(budgets.year, data.year),
      ),
    );

  if (existing) {
    throw Object.assign(new Error('Budget already exists for this category in this month'), { statusCode: 409 });
  }

  const [budget] = await app.db.insert(budgets).values({
    userId,
    categoryId: data.categoryId,
    amount: String(data.amount),
    month: data.month,
    year: data.year,
  }).returning();

  return budget;
}

export async function updateBudget(app: FastifyInstance, userId: string, id: string, data: { amount: number }) {
  const [budget] = await app.db
    .update(budgets)
    .set({ amount: String(data.amount), updatedAt: new Date() })
    .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
    .returning();
  return budget;
}

export async function deleteBudget(app: FastifyInstance, userId: string, id: string) {
  const [budget] = await app.db
    .delete(budgets)
    .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
    .returning();
  return budget;
}

export async function copyBudgetsFromPreviousMonth(app: FastifyInstance, userId: string, month: number, year: number) {
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  const previousBudgets = await app.db
    .select()
    .from(budgets)
    .where(and(eq(budgets.userId, userId), eq(budgets.month, prevMonth), eq(budgets.year, prevYear)));

  let copied = 0;
  for (const b of previousBudgets) {
    // Skip if already exists
    const [existing] = await app.db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, userId),
          eq(budgets.categoryId, b.categoryId),
          eq(budgets.month, month),
          eq(budgets.year, year),
        ),
      );

    if (!existing) {
      await app.db.insert(budgets).values({
        userId,
        categoryId: b.categoryId,
        amount: b.amount,
        month,
        year,
      });
      copied++;
    }
  }

  return { copied };
}

export async function checkBudgetAlerts(app: FastifyInstance, userId: string, categoryId: string, month: number, year: number) {
  // Find budget for this category/month
  const [budget] = await app.db
    .select()
    .from(budgets)
    .where(
      and(
        eq(budgets.userId, userId),
        eq(budgets.categoryId, categoryId),
        eq(budgets.month, month),
        eq(budgets.year, year),
      ),
    );

  if (!budget) return;

  // Calculate spent
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`;

  const [spentResult] = await app.db
    .select({ total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)` })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.categoryId, categoryId),
        eq(transactions.type, 'expense'),
        sql`${transactions.date} >= ${startDate}`,
        sql`${transactions.date} < ${endDate}`,
      ),
    );

  const spent = Number(spentResult?.total || 0);
  const amount = Number(budget.amount);
  const percentage = amount > 0 ? (spent / amount) * 100 : 0;

  // Get category name
  const [category] = await app.db.select().from(categories).where(eq(categories.id, categoryId));
  const catName = category?.name || 'Categoria';

  if (percentage >= 100) {
    // Check if alert already exists for this budget (100%)
    const [existingAlert] = await app.db
      .select()
      .from(alerts)
      .where(
        and(
          eq(alerts.userId, userId),
          eq(alerts.referenceId, budget.id),
          eq(alerts.type, 'budget_exceeded'),
          sql`${alerts.title} LIKE '%100%'`,
        ),
      );

    if (!existingAlert) {
      await app.db.insert(alerts).values({
        userId,
        type: 'budget_exceeded',
        title: `Orcamento de ${catName} atingiu 100%`,
        message: `Voce gastou ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(spent)} de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)} orcados para ${catName}.`,
        referenceId: budget.id,
        triggerDate: new Date(),
      });
    }
  } else if (percentage >= 80) {
    // Check if alert already exists for this budget (80%)
    const [existingAlert] = await app.db
      .select()
      .from(alerts)
      .where(
        and(
          eq(alerts.userId, userId),
          eq(alerts.referenceId, budget.id),
          eq(alerts.type, 'budget_exceeded'),
          sql`${alerts.title} LIKE '%80%'`,
        ),
      );

    if (!existingAlert) {
      await app.db.insert(alerts).values({
        userId,
        type: 'budget_exceeded',
        title: `Orcamento de ${catName} atingiu 80%`,
        message: `Voce gastou ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(spent)} de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)} orcados para ${catName}. Cuidado!`,
        referenceId: budget.id,
        triggerDate: new Date(),
      });
    }
  }
}
