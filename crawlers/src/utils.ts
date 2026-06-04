/**
 * Extracts IAM action strings from a policy document.
 * Handles both string form ("s3:GetObject") and array form (["s3:GetObject", ...]).
 * Accepts either a parsed object or a raw JSON string.
 */
export function extractActionsFromPolicyDocument(
  policy: string | Record<string, unknown>,
): string[] {
  let doc: Record<string, unknown>;
  if (typeof policy === 'string') {
    try {
      doc = JSON.parse(decodeURIComponent(policy)) as Record<string, unknown>;
    } catch {
      return [];
    }
  } else {
    doc = policy;
  }

  const statements = (doc.Statement as Array<Record<string, unknown>>) ?? [];
  const actions = new Set<string>();

  for (const statement of statements) {
    const action = statement.Action;
    if (typeof action === 'string') {
      actions.add(action);
    } else if (Array.isArray(action)) {
      for (const a of action) {
        if (typeof a === 'string') actions.add(a);
      }
    }
  }

  return [...actions];
}

export function attemptDeepParse(data: any): any {
    if (typeof data === 'string') {
        try {
            // Check if it's a JSON string (starts with { or [)
            if (data.startsWith('{') || data.startsWith('[')) {
                const parsed = JSON.parse(data);
                // Recursively parse in case of double-serialization
                return attemptDeepParse(parsed);
            }
        } catch {
            return data;
        }
    }

    if (Array.isArray(data)) {
        return data.map(attemptDeepParse);
    }

    if (data !== null && typeof data === 'object') {
        return Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, attemptDeepParse(v)])
        );
    }

    return data;
}

export function print(obj: any) {
    const cleaned = attemptDeepParse(obj);
    console.log(JSON.stringify(cleaned, null, 2));
}

export async function printAllRedisData(redis: any, options?: { intervalMs?: number, excludeKeys?: string[] }) {
  while (true) {
    try {
      const keys = await redis.keys('*');
      const allData: Record<string, any> = {};

      for (const key of keys) {
        const type = await redis.type(key);
        let value;

        switch (type) {
          case 'string': value = await redis.get(key); break;
          case 'hash':   value = await redis.hGetAll(key); break;
          case 'list':   value = await redis.lRange(key, 0, -1); break;
          case 'set':    value = await redis.sMembers(key); break;
          case 'zset':   value = await redis.zRange(key, 0, -1, { WITHSCORES: true }); break;
          default:       value = `(unhandled type: ${type})`;
        }
        allData[key] = value;
      }

      console.log(`\n\x1b[36m--- 🗄️  REDIS SNAPSHOT [${new Date().toLocaleTimeString()}] ---\x1b[0m`);
      
      if (Object.keys(allData).length === 0) {
        console.log(" (Redis is empty)");
      } else {
        print(allData);
      }
      
      console.log(`\x1b[36m----------------------------------------------\x1b[0m\n`);

    } catch (err: any) {
        console.error('\x1b[31mError printing Redis data:\x1b[0m', err.message);
    }
    await new Promise(r => setTimeout(r, 10000));
  }
}