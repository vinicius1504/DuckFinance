export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  creditCardId: string | null;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  isPaid: boolean;
  isRecurring: boolean;
  notes: string | null;
  pluggyTransactionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionRequest {
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
  creditCardId?: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  isPaid?: boolean;
  isRecurring?: boolean;
  notes?: string;
}

export interface UpdateTransactionRequest {
  accountId?: string;
  toAccountId?: string | null;
  categoryId?: string | null;
  creditCardId?: string | null;
  type?: TransactionType;
  amount?: number;
  description?: string;
  date?: string;
  isPaid?: boolean;
  isRecurring?: boolean;
  notes?: string | null;
}

export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  creditCardId?: string;
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
  isPaid?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
