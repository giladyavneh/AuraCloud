import type { WatchlistResource } from '@/services/resources.service';

export type { WatchlistResource };

export interface ResourceSelectorPanelProps {
  draftResources: WatchlistResource[];
  onDraftChange: (resources: WatchlistResource[]) => void;
  onSave: () => void;
  isSaving: boolean;
}

export interface JsonEditorPanelProps {
  draftResources: WatchlistResource[];
  onDraftChange: (resources: WatchlistResource[]) => void;
}

export interface WatchlistTableProps {
  resources: WatchlistResource[];
  onRemove: (arn: string) => void;
}

export interface AddResourceFormProps {
  onAdd: (resource: WatchlistResource) => void;
  existingArns: string[];
  onSave: () => void;
  isSaving: boolean;
}
