export type StatusTagVariant = 'healthy' | 'blocked' | 'stale' | 'online';

export interface StatusTagProps {
  variant: StatusTagVariant;
  label?: string;
}
