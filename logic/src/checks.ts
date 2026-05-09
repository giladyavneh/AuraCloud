import { collectMatches, type PolicySource } from "./policyEvaluator.js";

export type IdentityKind = "iam" | "sso";

export type IdentityContext = {
    kind: IdentityKind;
    name: string;
    found: boolean;
    principalArn?: string;
    policySources: PolicySource[];
    raw?: any;
    notes: string[];
};

export type ResourceContext = {
    arn: string;
    type: string;
    cached: boolean;
    policySources: PolicySource[];
    meta: Record<string, any>;
    notes: string[];
};

export type AccessContext = {
    identity: IdentityContext;
    resource: ResourceContext;
    action: string;
};

export type CheckOutcome = "pass" | "fail" | "unknown";

export type CheckResult = {
    name: string;
    outcome: CheckOutcome;
    reason: string;
};

export type AccessCheck = {
    name: string;
    run: (ctx: AccessContext) => Omit<CheckResult, "name">;
};

export type AccessDecision = {
    status: "Allow" | "Deny" | "Unknown";
    checks: CheckResult[];
    reasons: string[];
};

export function runChecks(checks: AccessCheck[], ctx: AccessContext): AccessDecision {
    const results: CheckResult[] = checks.map((c) => ({ name: c.name, ...c.run(ctx) }));
    const failed = results.filter((r) => r.outcome === "fail");
    const unknown = results.filter((r) => r.outcome === "unknown");

    const status: AccessDecision["status"] = failed.length
        ? "Deny"
        : unknown.length
            ? "Unknown"
            : "Allow";

    const reasons = results.map((r) => `[${r.outcome}] ${r.name}: ${r.reason}`);
    return { status, checks: results, reasons };
}

export const identityFoundCheck: AccessCheck = {
    name: "identity-found",
    run: (ctx) =>
        ctx.identity.found
            ? { outcome: "pass", reason: `${ctx.identity.kind} identity "${ctx.identity.name}" present in cache` }
            : { outcome: "fail", reason: `${ctx.identity.kind} identity "${ctx.identity.name}" not in cache` },
};

export const resourceCachedCheck: AccessCheck = {
    name: "resource-cached",
    run: (ctx) =>
        ctx.resource.cached
            ? { outcome: "pass", reason: `${ctx.resource.type} ${ctx.resource.arn} present in cache` }
            : { outcome: "unknown", reason: `${ctx.resource.type} ${ctx.resource.arn} not in cache` },
};

function describeMatches(matches: { source: string; sid?: string }[]): string {
    return matches.map((m) => `${m.source}${m.sid ? ` (${m.sid})` : ""}`).join(", ");
}

export const noExplicitDenyCheck: AccessCheck = {
    name: "no-explicit-deny",
    run: (ctx) => {
        const matches = collectMatches({
            action: ctx.action,
            resourceArn: ctx.resource.arn,
            ...(ctx.identity.principalArn ? { principalArn: ctx.identity.principalArn } : {}),
            sources: [...ctx.identity.policySources, ...ctx.resource.policySources],
        });
        const explicit = matches.filter((m) => m.effect === "Deny" && !m.conditional);
        if (explicit.length) {
            return { outcome: "fail", reason: `explicit Deny via ${describeMatches(explicit)}` };
        }
        const conditional = matches.filter((m) => m.effect === "Deny" && m.conditional);
        if (conditional.length) {
            return { outcome: "unknown", reason: `conditional Deny via ${describeMatches(conditional)}` };
        }
        return { outcome: "pass", reason: "no Deny statement matches" };
    },
};

export const hasAllowCheck: AccessCheck = {
    name: "has-allow",
    run: (ctx) => {
        const matches = collectMatches({
            action: ctx.action,
            resourceArn: ctx.resource.arn,
            ...(ctx.identity.principalArn ? { principalArn: ctx.identity.principalArn } : {}),
            sources: [...ctx.identity.policySources, ...ctx.resource.policySources],
        });
        const explicit = matches.filter((m) => m.effect === "Allow" && !m.conditional);
        if (explicit.length) {
            return { outcome: "pass", reason: `Allow via ${describeMatches(explicit)}` };
        }
        const conditional = matches.filter((m) => m.effect === "Allow" && m.conditional);
        if (conditional.length) {
            return { outcome: "unknown", reason: `conditional Allow via ${describeMatches(conditional)}` };
        }
        return { outcome: "fail", reason: "no Allow statement matches (implicit deny)" };
    },
};
