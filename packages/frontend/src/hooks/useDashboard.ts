import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/endpoints.js';

export function useMonthlyStats(month: number, year: number) {
  return useQuery({
    queryKey: ['dashboard', 'stats', month, year],
    queryFn: () => dashboardApi.stats(month, year),
  });
}

export function useMonthlyHistory(months?: number) {
  return useQuery({
    queryKey: ['dashboard', 'history', months],
    queryFn: () => dashboardApi.history(months),
  });
}
