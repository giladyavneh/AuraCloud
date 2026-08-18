export type StatusTagVariant = 'healthy' | 'blocked' | 'stale' | 'unscanned' | 'external' | 'online';

export interface StatusTagProps {
  variant: StatusTagVariant;
  label?: string;
}
