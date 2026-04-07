import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api/endpoints.js';

export function useCategoryBreakdown(startDate: string, endDate: string, type?: string) {
  return useQuery({
    queryKey: ['reports', 'category-breakdown', startDate, endDate, type],
    queryFn: () => reportsApi.categoryBreakdown(startDate, endDate, type),
    enabled: !!startDate && !!endDate,
  });
}

export function useCashFlow(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['reports', 'cash-flow', startDate, endDate],
    queryFn: () => reportsApi.cashFlow(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}
