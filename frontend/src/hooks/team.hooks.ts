import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createTeam,
  deleteTeam,
  deleteWatchlistPreset,
  fetchEmployees,
  fetchTeams,
  fetchWatchlistPresets,
  removeEmployee,
  renameTeam,
  updateEmployeeRole,
  updateEmployeeTeam,
  upsertWatchlistPreset,
} from '@/services/team.service';
import type { PresetUpsertPayload } from '@/services/types/team.types';
import { QUERY_KEYS } from '@/constants/queryKeys';

export const useEmployees = () =>
  useQuery({ queryKey: QUERY_KEYS.employees, queryFn: fetchEmployees });

export const useTeams = () =>
  useQuery({ queryKey: QUERY_KEYS.teams, queryFn: fetchTeams });

export const useWatchlistPresets = () =>
  useQuery({ queryKey: QUERY_KEYS.watchlistPresets, queryFn: fetchWatchlistPresets });

export const useRemoveEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => removeEmployee(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees }),
  });
};

export const useUpdateEmployeeRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'manager' | 'employee' }) =>
      updateEmployeeRole(id, role),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees }),
  });
};

export const useUpdateEmployeeTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, teamId }: { id: string; teamId: string | null }) =>
      updateEmployeeTeam(id, teamId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees }),
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createTeam(name),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teams }),
  });
};

export const useRenameTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameTeam(id, name),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teams }),
  });
};

export const useDeleteTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTeam(id),
    onSuccess: () => {
      // Deleting a team clears members' teamId and deletes the team's preset
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teams });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.watchlistPresets });
    },
  });
};

export const useUpsertWatchlistPreset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PresetUpsertPayload) => upsertWatchlistPreset(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.watchlistPresets }),
  });
};

export const useDeleteWatchlistPreset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteWatchlistPreset(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.watchlistPresets }),
  });
};
