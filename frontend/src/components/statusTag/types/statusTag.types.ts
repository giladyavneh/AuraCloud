export type StatusTagVariant = 'healthy' | 'blocked' | 'stale' | 'warning' | 'online';

export interface StatusTagProps {
  variant: StatusTagVariant;
  label?: string;
}
