import type { ConnectedClient } from "@/services/types/oauth.types";

export interface AwsCredentialsFormValues {
  accessKeyId: string;
  secretAccessKey: string;
}

export interface InviteCodeFieldsProps {
  inviteCode: string;
  slug: string;
}

export interface ConnectedClientRowProps {
  client: ConnectedClient;
  onDisconnect: () => void;
}

export interface ConnectedClientsListProps {
  clients: ConnectedClient[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onDisconnect: (client: ConnectedClient) => void;
}
