export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  parentId: string | null;
  createdAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  parentId?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  type?: CategoryType;
  icon?: string;
  color?: string;
  parentId?: string | null;
}
