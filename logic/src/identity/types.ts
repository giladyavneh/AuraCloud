export type IdentitySource = 'sso' | 'iam';

export interface PolicyRefs {
  inlineDocuments: Record<string, unknown>[];
  attachedArns: string[];
}

export interface ResolvedIdentity {
  source: IdentitySource;
  raw: Record<string, unknown>;
  policies: unknown[];
  accessibleAwsAccountIds: string[];
  accountId: string;
  arn: string;
  awsUserId?: string;
}
