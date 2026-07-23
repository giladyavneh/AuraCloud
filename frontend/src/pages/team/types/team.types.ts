import type { Employee, Team, WatchlistPreset } from '@/services/types/team.types';

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
