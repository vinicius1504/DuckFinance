export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  month: number;
  year: number;
  spent: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetRequest {
  categoryId: string;
  amount: number;
  month: number;
  year: number;
}

export interface UpdateBudgetRequest {
  amount?: number;
}

export interface BudgetProgress {
  budget: Budget;
  categoryName: string;
  categoryColor: string;
  percentage: number;
  remaining: number;
}
