import type { CustomerRole } from '@/services/types/auth.types';

export interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleTitle: string;
  role: CustomerRole;
  teamId: string | null;
  hasAwsConnected: boolean;
  createdAt: string;
}

export interface Team {
  _id: string;
  name: string;
  createdAt: string;
}

export type PresetScopeType = 'team' | 'individual';

export interface PresetResource {
  arn: string;
  actions: string[];
}

export interface WatchlistPreset {
  _id: string;
  scopeType: PresetScopeType;
  scopeId: string;
  name?: string;
  resources: PresetResource[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PresetUpsertPayload {
  scopeType: PresetScopeType;
  scopeId: string;
  name?: string;
  resources: PresetResource[];
}
