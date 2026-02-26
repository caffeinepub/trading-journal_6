import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { Trade, Backup } from '../backend';

export function useGetTrades() {
  const { actor, isFetching } = useActor();
  return useQuery<Trade[]>({
    queryKey: ['trades'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTrades();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTradeById(id: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<Trade | null>({
    queryKey: ['trade', String(id)],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getTradeById(id);
    },
    enabled: !!actor && !isFetching,
  });
}

interface AddTradeParams {
  date: bigint;
  stockName: string;
  tradeType: string;
  direction: string;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  target: number;
  quantity: bigint;
  isAPlusSetup: boolean;
  emotion: string;
  convictionLevel: bigint;
  followedPlan: boolean;
  mistakeType: string;
  notes: string;
}

export function useAddTrade() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: AddTradeParams) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addTrade(
        params.date,
        params.stockName,
        params.tradeType,
        params.direction,
        params.entryPrice,
        params.exitPrice,
        params.stopLoss,
        params.target,
        params.quantity,
        params.isAPlusSetup,
        params.emotion,
        params.convictionLevel,
        params.followedPlan,
        params.mistakeType,
        params.notes,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    },
  });
}

interface UpdateTradeParams extends AddTradeParams {
  id: bigint;
}

export function useUpdateTrade() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: UpdateTradeParams) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTrade(
        params.id,
        params.date,
        params.stockName,
        params.tradeType,
        params.direction,
        params.entryPrice,
        params.exitPrice,
        params.stopLoss,
        params.target,
        params.quantity,
        params.isAPlusSetup,
        params.emotion,
        params.convictionLevel,
        params.followedPlan,
        params.mistakeType,
        params.notes,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    },
  });
}

export function useDeleteTrade() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteTrade(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    },
  });
}

export function useGetAccountSize() {
  const { actor, isFetching } = useActor();
  return useQuery<number>({
    queryKey: ['accountSize'],
    queryFn: async () => {
      if (!actor) return 1000;
      return actor.getAccountSize();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetAccountSize() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (size: number) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setAccountSize(size);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountSize'] });
      queryClient.invalidateQueries({ queryKey: ['riskStatus'] });
    },
  });
}

export function useGetDailyMaxLoss() {
  const { actor, isFetching } = useActor();
  return useQuery<number>({
    queryKey: ['dailyMaxLoss'],
    queryFn: async () => {
      if (!actor) return 20;
      return actor.getDailyMaxLoss();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetDailyMaxLoss() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (limit: number) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setDailyMaxLoss(limit);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyMaxLoss'] });
      queryClient.invalidateQueries({ queryKey: ['riskStatus'] });
    },
  });
}

export function useGetRiskStatus() {
  const { actor, isFetching } = useActor();
  return useQuery<{ totalPnl: number; accountSize: number; dailyMaxLoss: number }>({
    queryKey: ['riskStatus'],
    queryFn: async () => {
      if (!actor) return { totalPnl: 0, accountSize: 1000, dailyMaxLoss: 20 };
      return actor.getRiskStatus();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useExportBackup() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.exportBackup();
    },
  });
}

export function useImportBackup() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (backup: Backup) => {
      if (!actor) throw new Error('Actor not available');
      return actor.importBackup(backup);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['accountSize'] });
      queryClient.invalidateQueries({ queryKey: ['dailyMaxLoss'] });
      queryClient.invalidateQueries({ queryKey: ['riskStatus'] });
    },
  });
}

export function useGetCallerUserProfileQuery() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: { name: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}
