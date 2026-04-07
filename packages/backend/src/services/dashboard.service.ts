import { eq, and, sql, desc } from 'drizzle-orm';
import { transactions, categories } from '../db/schema.js';
import type { FastifyInstance } from 'fastify';

export async function getMonthlyStats(app: FastifyInstance, userId: string, month: number, year: number) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`;

  // Total income & expense
  const [incomeResult] = await app.db
    .select({ total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)` })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'income'),
        sql`${transactions.date} >= ${startDate}`,
        sql`${transactions.date} < ${endDate}`,
      ),
    );

  const [expenseResult] = await app.db
    .select({ total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)` })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'expense'),
        sql`${transactions.date} >= ${startDate}`,
        sql`${transactions.date} < ${endDate}`,
      ),
    );

  // Spending by category
  const spendingByCategory = await app.db
    .select({
      categoryName: categories.name,
      categoryColor: categories.color,
      total: sql<string>`SUM(${transactions.amount})`,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'expense'),
        sql`${transactions.date} >= ${startDate}`,
        sql`${transactions.date} < ${endDate}`,
      ),
    )
    .groupBy(categories.name, categories.color)
    .orderBy(desc(sql`SUM(${transactions.amount})`));

  return {
    totalIncome: Number(incomeResult?.total || 0),
    totalExpense: Number(expenseResult?.total || 0),
    spendingByCategory: spendingByCategory.map((s) => ({
      categoryName: s.categoryName,
      categoryColor: s.categoryColor,
      total: Number(s.total),
    })),
  };
}

export async function getMonthlyHistory(app: FastifyInstance, userId: string, months: number = 6) {
  const results = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, '0')}-01`;

    const [incomeResult] = await app.db
      .select({ total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'income'),
          sql`${transactions.date} >= ${startDate}`,
          sql`${transactions.date} < ${endDate}`,
        ),
      );

    const [expenseResult] = await app.db
      .select({ total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          sql`${transactions.date} >= ${startDate}`,
          sql`${transactions.date} < ${endDate}`,
        ),
      );

    results.push({
      month,
      year,
      income: Number(incomeResult?.total || 0),
      expense: Number(expenseResult?.total || 0),
    });
  }

  return results;
}
