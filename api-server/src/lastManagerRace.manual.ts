// MANUAL integration check — not part of the unit test run (presets.test.ts).
// Needs a live MONGO_URI (replica set) AND a running api-server:
//
//   PORT=3999 npx tsx api-server/src/index.ts &
//   npx tsx api-server/src/lastManagerRace.manual.ts
//
// Guards the last-manager write-skew race: two concurrent demotes, each targeting
// the other manager, must not leave the company with zero managers. Regressing this
// locks a company out of its own account permanently, and it is invisible to any
// sequential test — which is why this check exists separately.
// Also covers the CastError-to-500 paths (malformed :id, empty-string teamId).
// Creates and fully deletes its own throwaway company.
import assert from 'node:assert';
import { connectMongo, CompanyModel, CustomerModel, mongoose } from 'utils';

const BASE = process.env.TEST_API ?? 'http://localhost:3999';
const stamp = Date.now();
const slug = `racetest-${stamp}`;

const post = async (path: string, body: unknown, token?: string) => {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  return { status: r.status, body: await r.json().catch(() => null) };
};

const put = async (path: string, body: unknown, token: string) => {
  const r = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return { status: r.status, body: await r.json().catch(() => null) };
};

const get = async (path: string, token: string) => {
  const r = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  return { status: r.status, body: await r.json().catch(() => null) };
};

async function main() {
  await connectMongo();

  // 1. Manager A creates the company
  const a = await post('/api/auth/signup', {
    role: 'manager', firstName: 'Race', lastName: 'ManagerA',
    email: `race-a-${stamp}@qatest.local`, roleTitle: 'Eng', password: 'pw12345678',
    companyName: `Race ${stamp}`, companySlug: slug,
  });
  assert.strictEqual(a.status, 201, `signup A failed: ${JSON.stringify(a.body)}`);
  const tokenA = a.body.token as string;
  const idA = a.body.customer._id as string;

  // 2. Employee B joins, then gets promoted to manager
  const code = await get('/api/company/invite-code', tokenA);
  const b = await post('/api/auth/signup', {
    role: 'employee', firstName: 'Race', lastName: 'ManagerB',
    email: `race-b-${stamp}@qatest.local`, roleTitle: 'Eng', password: 'pw12345678',
    companySlug: slug, inviteCode: code.body.inviteCode,
  });
  assert.strictEqual(b.status, 201, `signup B failed: ${JSON.stringify(b.body)}`);
  const tokenB = b.body.token as string;
  const idB = b.body.customer._id as string;

  const promote = await put(`/api/employees/${idB}/role`, { role: 'manager' }, tokenA);
  assert.strictEqual(promote.status, 200, `promote failed: ${JSON.stringify(promote.body)}`);

  const companyId = a.body.customer.companyId as string;
  assert.strictEqual(
    await CustomerModel.countDocuments({ companyId, role: 'manager' }), 2,
    'setup should leave exactly 2 managers',
  );

  // 3. THE RACE: each manager demotes the other, concurrently.
  const [r1, r2] = await Promise.all([
    put(`/api/employees/${idB}/role`, { role: 'employee' }, tokenA),
    put(`/api/employees/${idA}/role`, { role: 'employee' }, tokenB),
  ]);
  const statuses = [r1.status, r2.status].sort();
  const remaining = await CustomerModel.countDocuments({ companyId, role: 'manager' });

  console.log(`  concurrent demote statuses: ${JSON.stringify(statuses)}`);
  console.log(`  managers remaining:         ${remaining}`);

  assert.ok(remaining >= 1, `RACE LOST: company left with ${remaining} managers`);
  assert.deepStrictEqual(statuses, [200, 409], `expected one 200 + one 409, got ${JSON.stringify(statuses)}`);

  // 4. Malformed :id must be 404, not 500
  const bad = await put('/api/employees/not-a-valid-id/role', { role: 'employee' }, tokenA);
  console.log(`  malformed :id status:       ${bad.status}`);
  assert.strictEqual(bad.status, 404, `expected 404 for malformed id, got ${bad.status}`);

  // 5. Empty-string teamId must not 500
  const survivorToken = r1.status === 200 ? tokenA : tokenB;
  const emptyTeam = await put(`/api/employees/${idB}/team`, { teamId: '' }, survivorToken);
  console.log(`  empty-string teamId status: ${emptyTeam.status}`);
  assert.ok(emptyTeam.status < 500, `empty teamId should not 500, got ${emptyTeam.status}`);

  console.log('\nrace.ts: all assertions passed');
}

main()
  .catch((err) => { console.error('\nrace.ts FAILED:', err.message); process.exitCode = 1; })
  .finally(async () => {
    // Clean up everything this script created
    const company = await CompanyModel.findOne({ slug });
    if (company) {
      await CustomerModel.deleteMany({ companyId: company._id.toString() });
      await CompanyModel.deleteOne({ _id: company._id });
    }
    const leftover = await CustomerModel.countDocuments({ email: { $regex: `race-.*-${stamp}@qatest.local` } });
    console.log(`  cleanup: ${leftover} leftover test customers`);
    await mongoose.disconnect();
  });
