export type UserSyncRecord = {
    name: string;
    source: 'IAM' | 'SSO';
    externalId: string;
    arn: string | null;
}

function isNotEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim() !== '';
}

// Transforms raw JSON entries from IAM into a unified UserSyncRecord format
export function iamEntryToUser(rawJson: string): UserSyncRecord | null{
    try {
        const json = JSON.parse(rawJson);
        const { UserName, UserId, Arn} = json ?? {}
        if (isNotEmptyString(UserName) && isNotEmptyString(Arn) && isNotEmptyString(UserId)) {
            return {name: UserName, source: "IAM", externalId: UserId, arn: Arn};
        }
        console.warn('iamEntryToUser: missing required fields', json);
        return null;
    } catch (e) {
        console.warn('iamEntryToUser: failed to parse JSON', e);
        return null;
    }
}

// Transforms raw JSON entries from SSO into a unified UserSyncRecord format
export function ssoEntryToUser(rawJson: string): UserSyncRecord | null{
    try {
        const json = JSON.parse(rawJson);
        const { UserName, UserId } = json ?? {}
        if (isNotEmptyString(UserName) && isNotEmptyString(UserId)) {
            return {name: UserName, source: "SSO", externalId: UserId, arn: null};
        }
        console.warn('ssoEntryToUser: missing required fields', json);
        return null;
    } catch (e) {
        console.warn('ssoEntryToUser: failed to parse JSON', e);
        return null;
    }
}
