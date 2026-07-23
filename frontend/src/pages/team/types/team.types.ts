import type { WatchlistResource } from '@/services/resources.service';
import type {
  Employee,
  PresetScopeType,
  Team,
  WatchlistPreset,
} from '@/services/types/team.types';

export type { Employee, PresetResource, PresetScopeType, Team, WatchlistPreset } from '@/services/types/team.types';

export interface SnackbarState {
  open: boolean;
  severity: 'success' | 'error';
  message: string;
}

export interface EmployeeRowMenuProps {
  employee: Employee;
  teams: Team[];
  isOnlyManager: boolean;
  isSelf: boolean;
  isPending: boolean;
  onChangeRole: (role: 'manager' | 'employee') => void;
  onChangeTeam: (teamId: string | null) => void;
  onRequestRemove: () => void;
}

export interface TeamCardProps {
  team: Team;
  members: Employee[];
  preset: WatchlistPreset | undefined;
  presetsLoading: boolean;
  onRename: () => void;
  onDelete: () => void;
}

export interface TeamMembersPanelProps {
  members: Employee[];
  preset: WatchlistPreset | undefined;
  presetsLoading: boolean;
}

export interface TeamDialogProps {
  open: boolean;
  mode: 'create' | 'rename';
  initialName: string;
  isPending: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
}

export interface PresetEditorProps {
  preset: WatchlistPreset | null;
  teams: Team[];
  employees: Employee[];
  presets: WatchlistPreset[];
  onCancel: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}

export interface TeamInviteFieldsProps {
  inviteCode: string;
  slug: string;
}

export interface PresetScopeSelectorProps {
  scopeType: PresetScopeType;
  scopeId: string | null;
  name: string;
  eligibleTeams: Team[];
  eligibleEmployees: Employee[];
  onScopeTypeChange: (scopeType: PresetScopeType) => void;
  onScopeIdChange: (scopeId: string | null) => void;
  onNameChange: (name: string) => void;
}

export interface PresetScopeSummaryProps {
  scopeType: PresetScopeType;
  scopeLabel: string;
  name: string;
  onNameChange: (name: string) => void;
}

export interface PresetResourcePickerProps {
  draftResources: WatchlistResource[];
  onDraftChange: (resources: WatchlistResource[]) => void;
  onAddResource: (resource: WatchlistResource) => void;
  onRemoveResource: (arn: string) => void;
}

export interface TeamAssignmentOptionProps {
  isSelected: boolean;
  label: string;
}

export interface EmployeeActionsMenuProps {
  employeeName: string;
  nextRole: 'manager' | 'employee';
  isDemoteBlocked: boolean;
  isRemoveBlocked: boolean;
  removeTooltip: string;
  onChangeRole: () => void;
  onShowTeamAssignment: () => void;
  onRequestRemove: () => void;
}

export interface EmployeeTeamAssignmentMenuProps {
  currentTeamId: string | null;
  teams: Team[];
  backItemRef: React.RefObject<HTMLLIElement | null>;
  onBack: () => void;
  onAssignTeam: (teamId: string | null) => void;
}

export interface EmployeesTableProps {
  employees: Employee[];
  teams: Team[];
  renderRowActions: (employee: Employee) => React.ReactNode;
}
