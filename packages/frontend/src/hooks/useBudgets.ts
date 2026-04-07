import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetsApi } from '../api/endpoints.js';
import type { CreateBudgetRequest, UpdateBudgetRequest } from '@duckfinance/shared';

export function useBudgets(month: number, year: number) {
  return useQuery({
    queryKey: ['budgets', month, year],
    queryFn: () => budgetsApi.list(month, year),
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBudgetRequest) => budgetsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBudgetRequest }) => budgetsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => budgetsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
}

export function useCopyBudgets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ month, year }: { month: number; year: number }) => budgetsApi.copyPrevious(month, year),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
}
