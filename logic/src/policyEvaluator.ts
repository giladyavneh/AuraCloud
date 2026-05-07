export type Effect = "Allow" | "Deny";

export type PolicyStatement = {
    Sid?: string;
    Effect: Effect;
    Action?: string | string[];
    NotAction?: string | string[];
    Resource?: string | string[];
    NotResource?: string | string[];
    Principal?: any;
    NotPrincipal?: any;
    Condition?: Record<string, any>;
};

export type PolicyDocument = {
    Version?: string;
    Statement: PolicyStatement | PolicyStatement[];
};

export type PolicySource = {
    document: PolicyDocument;
    origin: string;
    type: "identity" | "resource";
};

export type EvalStatus = "Allow" | "Deny" | "Unknown";

export type EvalResult = {
    status: EvalStatus;
    reasons: string[];
};

function toArray<T>(v: T | T[] | undefined | null): T[] {
    if (v == null) return [];
    return Array.isArray(v) ? v : [v];
}

function escapeRegex(s: string): string {
    return s.replace(/[.+^${}()|[\]\\]/g, "\\$&");
}

function wildcardToRegex(pattern: string): RegExp {
    const escaped = escapeRegex(pattern).replace(/\*/g, ".*").replace(/\?/g, ".");
    return new RegExp(`^${escaped}$`, "i");
}

function matchesAny(value: string, patterns: string[]): boolean {
    return patterns.some(p => wildcardToRegex(p).test(value));
}

function actionMatches(action: string, stmt: PolicyStatement): boolean {
    const allow = toArray(stmt.Action);
    const block = toArray(stmt.NotAction);
    if (allow.length && !matchesAny(action, allow)) return false;
    if (block.length && matchesAny(action, block)) return false;
    return allow.length > 0 || block.length > 0;
}

function resourceMatches(resourceCandidates: string[], stmt: PolicyStatement): boolean {
    const allow = toArray(stmt.Resource);
    const block = toArray(stmt.NotResource);
    const matchPattern = (patterns: string[]) =>
        resourceCandidates.some(r => matchesAny(r, patterns));
    if (allow.length) {
        if (!matchPattern(allow)) return false;
    }
    if (block.length) {
        if (matchPattern(block)) return false;
    }
    return allow.length > 0 || block.length > 0;
}

function flattenPrincipal(principal: any): string[] {
    if (principal == null) return [];
    if (typeof principal === "string") return [principal];
    if (Array.isArray(principal)) return principal.flatMap(flattenPrincipal);
    if (typeof principal === "object") {
        const out: string[] = [];
        for (const v of Object.values(principal)) out.push(...flattenPrincipal(v));
        return out;
    }
    return [];
}

function principalMatches(principalArn: string | undefined, stmt: PolicyStatement): boolean {
    const allow = flattenPrincipal(stmt.Principal);
    const block = flattenPrincipal(stmt.NotPrincipal);

    if (!allow.length && !block.length) return true;

    const candidates = principalArn ? buildPrincipalCandidates(principalArn) : [];

    const matchesArn = (patterns: string[]) =>
        patterns.some(p =>
            p === "*" || candidates.some(c => wildcardToRegex(p).test(c))
        );

    if (allow.length) {
        if (!candidates.length) return false;
        if (!matchesArn(allow)) return false;
    }
    if (block.length && candidates.length && matchesArn(block)) return false;
    return true;
}

function buildPrincipalCandidates(arn: string): string[] {
    const out = [arn];
    const m = arn.match(/^arn:aws:iam::(\d+):/);
    const account = m?.[1];
    if (account) {
        out.push(`arn:aws:iam::${account}:root`);
        out.push(account);
    }
    return out;
}

type Match = {
    effect: Effect;
    source: string;
    sid?: string;
    conditional: boolean;
};

export function collectMatches(args: {
    action: string;
    resourceArn: string;
    principalArn?: string;
    sources: PolicySource[];
}): Match[] {
    const { action, resourceArn, principalArn, sources } = args;
    const resourceCandidates = [resourceArn, `${resourceArn}/*`];
    const matches: Match[] = [];

    for (const src of sources) {
        const statements = toArray(src.document?.Statement);
        for (const stmt of statements) {
            if (!stmt || !stmt.Effect) continue;
            if (!actionMatches(action, stmt)) continue;
            if (!resourceMatches(resourceCandidates, stmt)) continue;
            if (src.type === "resource") {
                if (!principalMatches(principalArn, stmt)) continue;
            }
            const conditional = !!stmt.Condition && Object.keys(stmt.Condition).length > 0;
            const match: Match = { effect: stmt.Effect, source: src.origin, conditional };
            if (stmt.Sid) match.sid = stmt.Sid;
            matches.push(match);
        }
    }
    return matches;
}

export function decide(matches: Match[]): EvalResult {
    const reasons: string[] = [];
    const explicitDenies = matches.filter(m => m.effect === "Deny" && !m.conditional);
    if (explicitDenies.length) {
        for (const m of explicitDenies) {
            reasons.push(`explicit Deny via ${m.source}${m.sid ? ` (${m.sid})` : ""}`);
        }
        return { status: "Deny", reasons };
    }

    const conditionalDenies = matches.filter(m => m.effect === "Deny" && m.conditional);
    const explicitAllows = matches.filter(m => m.effect === "Allow" && !m.conditional);
    const conditionalAllows = matches.filter(m => m.effect === "Allow" && m.conditional);

    if (conditionalDenies.length) {
        for (const m of conditionalDenies) {
            reasons.push(`conditional Deny via ${m.source}${m.sid ? ` (${m.sid})` : ""}`);
        }
        for (const m of explicitAllows) {
            reasons.push(`Allow via ${m.source}${m.sid ? ` (${m.sid})` : ""}`);
        }
        return { status: "Unknown", reasons };
    }

    if (explicitAllows.length) {
        for (const m of explicitAllows) {
            reasons.push(`Allow via ${m.source}${m.sid ? ` (${m.sid})` : ""}`);
        }
        return { status: "Allow", reasons };
    }

    if (conditionalAllows.length) {
        for (const m of conditionalAllows) {
            reasons.push(`conditional Allow via ${m.source}${m.sid ? ` (${m.sid})` : ""}`);
        }
        return { status: "Unknown", reasons };
    }

    return { status: "Deny", reasons: ["no matching statement (implicit deny)"] };
}

export function evaluate(args: {
    action: string;
    resourceArn: string;
    principalArn?: string;
    sources: PolicySource[];
}): EvalResult {
    return decide(collectMatches(args));
}
