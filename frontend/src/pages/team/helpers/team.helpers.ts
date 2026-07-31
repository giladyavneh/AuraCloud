import type {
  Employee,
  PresetResource,
  PresetScopeType,
  Team,
  WatchlistPreset,
} from '@/pages/team/types/team.types';
import type { WatchlistResource } from '@/services/resources.service';

/** Number of managers among the given employees — used to pre-empt last-manager 409s. */
export const countManagers = (employees: Employee[]): number =>
  employees.filter((employee) => employee.role === 'manager').length;

/** Number of employees currently assigned to a given team (derived client-side, no server count endpoint). */
export const countTeamMembers = (employees: Employee[], teamId: string): number =>
  employees.filter((employee) => employee.teamId === teamId).length;

/** Employees assigned to a given team (derived client-side, no server endpoint). */
export const getTeamMembers = (employees: Employee[], teamId: string): Employee[] =>
  employees.filter((employee) => employee.teamId === teamId);

/** The team-scoped preset for a given team, or undefined when the team has none. */
export const findTeamPreset = (presets: WatchlistPreset[], teamId: string): WatchlistPreset | undefined =>
  presets.find((preset) => preset.scopeType === 'team' && preset.scopeId === teamId);

/** The team name for an employee's current team assignment, or null when unassigned. */
export const resolveTeamName = (employee: Employee, teams: Team[]): string | null =>
  teams.find((team) => team._id === employee.teamId)?.name ?? null;

/** True when an individual preset's target employee no longer exists (account was removed, §6). */
export const isOrphanedIndividualPreset = (preset: WatchlistPreset, employees: Employee[]): boolean =>
  preset.scopeType === 'individual' && !employees.some((employee) => employee._id === preset.scopeId);

/** Human-readable label for a preset's scope: team name, employee name, or the "removed" fallback. */
export const resolvePresetScopeLabel = (
  preset: WatchlistPreset,
  teams: Team[],
  employees: Employee[],
  removedEmployeeLabel: string,
): string => {
  if (preset.scopeType === 'team') {
    return teams.find((team) => team._id === preset.scopeId)?.name ?? removedEmployeeLabel;
  }
  const employee = employees.find((candidate) => candidate._id === preset.scopeId);
  return employee ? `${employee.firstName} ${employee.lastName}` : removedEmployeeLabel;
};

/** Resolves a preset's `createdBy` Customer id to a display name; null if the creator was removed. */
export const resolveCreatedByName = (preset: WatchlistPreset, employees: Employee[]): string | null => {
  if (!preset.createdBy) return null;
  const employee = employees.find((candidate) => candidate._id === preset.createdBy);
  return employee ? `${employee.firstName} ${employee.lastName}` : null;
};

/** Strips the local-only synthetic `_id` before sending draft resources to the API. */
export const toPresetResourcePayload = (resources: WatchlistResource[]): PresetResource[] =>
  resources.map(({ arn, actions }) => ({ arn, actions }));

/** Loads a preset's API resources (no `_id`) into the shape the shared resource-picker components expect. */
export const fromPresetResources = (resources: PresetResource[]): WatchlistResource[] =>
  resources.map(({ arn, actions }) => ({ arn, actions, _id: arn }));

/** Teams that don't already have a preset — one preset per scope is a hard constraint. */
export const getEligibleTeams = (teams: Team[], presets: WatchlistPreset[]): Team[] =>
  teams.filter(
    (team) =>
      !presets.some((preset) => preset.scopeType === 'team' && preset.scopeId === team._id),
  );

/** Employees that don't already have an individual preset. */
export const getEligibleEmployees = (
  employees: Employee[],
  presets: WatchlistPreset[],
): Employee[] =>
  employees.filter(
    (employee) =>
      !presets.some(
        (preset) => preset.scopeType === 'individual' && preset.scopeId === employee._id,
      ),
  );

/** Display name for a scope selection, or an empty string when nothing is selected yet. */
export const resolveScopeLabel = (
  scopeType: PresetScopeType,
  scopeId: string | null,
  teams: Team[],
  employees: Employee[],
): string => {
  if (!scopeId) return '';

  if (scopeType === 'team') {
    return teams.find((team) => team._id === scopeId)?.name ?? '';
  }

  const employee = employees.find((candidate) => candidate._id === scopeId);
  return employee ? `${employee.firstName} ${employee.lastName}` : '';
};

/** Stable serialisation of a preset's resources, for dirty-checking a draft. */
export const toComparablePresetResources = (
  resources: { arn: string; actions: string[] }[],
): string =>
  JSON.stringify(
    [...resources]
      .map(({ arn, actions }) => ({ arn, actions }))
      .sort((first, second) => first.arn.localeCompare(second.arn)),
  );

/** An employee's display name. */
export const getEmployeeFullName = (employee: Employee): string =>
  `${employee.firstName} ${employee.lastName}`;
