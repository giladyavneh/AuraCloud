import { GetPolicyCommand, GetPolicyVersionCommand, IAMClient } from "@aws-sdk/client-iam";

export type ManagedPolicyEntry = { defaultVersion: string; document: any };

export function decodePolicyDoc(raw: string | undefined): any {
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}

export async function resolveManagedPolicy(
  iamClient: IAMClient,
  arn: string,
  withRetry: <T>(fn: () => Promise<T>) => Promise<T>,
): Promise<ManagedPolicyEntry | null> {
  try {
    const policyResp = await withRetry(() => iamClient.send(new GetPolicyCommand({ PolicyArn: arn })));
    const versionId = policyResp.Policy?.DefaultVersionId;
    if (!versionId) return null;
    const versionResp = await withRetry(() =>
      iamClient.send(new GetPolicyVersionCommand({ PolicyArn: arn, VersionId: versionId }))
    );
    const document = decodePolicyDoc(versionResp.PolicyVersion?.Document);
    return { defaultVersion: versionId, document };
  } catch {
    return null;
  }
}

export async function resolveManagedPolicies(
  iamClient: IAMClient,
  arns: Iterable<string>,
  withRetry: <T>(fn: () => Promise<T>) => Promise<T>,
): Promise<Record<string, ManagedPolicyEntry>> {
  const out: Record<string, ManagedPolicyEntry> = {};
  for (const arn of new Set(arns)) {
    const resolved = await resolveManagedPolicy(iamClient, arn, withRetry);
    if (resolved) out[arn] = resolved;
  }
  return out;
}
