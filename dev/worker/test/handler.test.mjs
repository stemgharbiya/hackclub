/**
 * Integration tests for the Worker's request handler.
 *
 * `validate.test.mjs` covers the validation rules in isolation. This exercises
 * the parts that decide whether a request is allowed to reach the database:
 * Turnstile gating, duplicate handling, authorisation, CORS, and failure paths.
 *
 * Turnstile and D1 are both mocked, so nothing here touches Cloudflare. It
 * proves the request pipeline, not that the live secrets work.
 *
 *   node worker/test/handler.test.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const workerSource = readFileSync(join(here, '..', 'src', 'index.js'), 'utf8');
const questionsSource = readFileSync(join(here, '..', 'src', 'questions.js'), 'utf8');

const dataLiteral = questionsSource.slice(questionsSource.indexOf('=') + 1).replace(/;\s*$/, '');

const testable = workerSource
  .replace(/^import\s+\{[^}]*\}\s+from\s+'[^']+';?$/m, `const QUESTION_DATA = ${dataLiteral};`)
  .concat('\nexport { validate, getQuestionSet, QUESTION_DATA };\n');

const { default: worker, validate } = await import(
  `data:text/javascript;base64,${Buffer.from(testable).toString('base64')}`
);

// ---------------------------------------------------------------- fixtures

const VALID_PR = {
  full_name: 'Mona Ashraf',
  email: 'mona@example.com',
  phone: '+201234567890',
  committee: 'PR',
  academic_track: '',
  why_join: 'I want to grow the club and learn sponsorship outreach.',
  portfolio_link: '',
  pr_sponsor_outreach: 'I emailed three local companies about our workshop.',
  pr_sponsor_pitch: 'Dear team, we are hosting a hackathon and would love your support.',
  pr_languages: 'English, Arabic'
};

/** Minimal D1 stand-in that records what was written. */
function makeEnv(options = {}) {
  const writes = [];

  return {
    writes,
    env: {
      TURNSTILE_SECRET: options.secret ?? 'test-secret',
      ADMIN_TOKEN: options.adminToken ?? 'test-admin-token',
      DB: {
        prepare(sql) {
          const record = { sql, values: null };
          const api = {
            bind(...values) {
              record.values = values;
              return api;
            },
            async run() {
              if (options.dbError) throw new Error(options.dbError);
              if (options.uniqueViolation) {
                throw new Error('D1_ERROR: UNIQUE constraint failed: applications.email');
              }
              writes.push(record);
              return { success: true, meta: { changes: 1 } };
            },
            async all() {
              if (options.listError) throw new Error(options.listError);
              return { results: options.rows ?? [] };
            }
          };
          return api;
        }
      }
    }
  };
}

const SITEVERIFY_HOST = 'challenges.cloudflare.com';
const SITEVERIFY_PATH = '/turnstile/v0/siteverify';

/**
 * Turnsstile siteverify mock.
 *
 * Matches on the parsed hostname and path rather than a substring, so a URL
 * like https://evil.example/challenges.cloudflare.com cannot satisfy it.
 */
function stubSiteverify(behaviour) {
  const original = globalThis.fetch;

  globalThis.fetch = async (url, init) => {
    const parsed = new URL(String(url));

    if (parsed.hostname === SITEVERIFY_HOST && parsed.pathname === SITEVERIFY_PATH) {
      return behaviour(JSON.parse(init.body));
    }
    throw new Error(`unexpected network call to ${url}`);
  };

  return () => {
    globalThis.fetch = original;
  };
}

const siteverifyOk = async () =>
  new Response(JSON.stringify({ success: true }), { status: 200 });
const siteverifyFail = async () =>
  new Response(JSON.stringify({ success: false, 'error-codes': ['invalid-input-response'] }), {
    status: 200
  });
const siteverifyDown = async () => new Response('', { status: 503 });

function postRequest(body, { origin = 'https://gharbiyahc.org', raw = null } = {}) {
  return new Request('https://worker.test/api/applications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(origin ? { Origin: origin } : {})
    },
    body: raw ?? JSON.stringify(body)
  });
}

async function call(request, env) {
  return await worker.fetch(request, env);
}

// ---------------------------------------------------------------- tests

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('rejects a submission with no Turnstile token', async () => {
  const restore = stubSiteverify(siteverifyOk);
  try {
    const { env, writes } = makeEnv();
    const res = await call(postRequest(VALID_PR), env);

    if (res.status !== 400) throw new Error(`expected 400, got ${res.status}`);
    if (writes.length !== 0) throw new Error('reached the database without a token');
    const body = await res.json();
    if (!/verification/i.test(body.error)) throw new Error('unhelpful error message');
  } finally { restore(); }
});

test('rejects a Turnstile token Cloudflare marks invalid', async () => {
  const restore = stubSiteverify(siteverifyFail);
  try {
    const { env, writes } = makeEnv();
    const res = await call(
      postRequest({ ...VALID_PR, 'cf-turnstile-response': 'forged' }),
      env
    );

    if (res.status !== 400) throw new Error(`expected 400, got ${res.status}`);
    if (writes.length !== 0) throw new Error('a forged token reached the database');
  } finally { restore(); }
});

test('rejects everything when siteverify itself fails', async () => {
  const restore = stubSiteverify(siteverifyDown);
  try {
    const { env, writes } = makeEnv();
    const res = await call(
      postRequest({ ...VALID_PR, 'cf-turnstile-response': 'abc' }),
      env
    );

    if (res.status !== 400) throw new Error(`expected 400, got ${res.status}`);
    if (writes.length !== 0) throw new Error('stored without a working check');
  } finally { restore(); }
});

test('fails closed when TURNSTILE_SECRET is missing', async () => {
  const { env, writes } = makeEnv({ secret: '' });
  const original = globalThis.fetch;
  let siteverifyCalled = false;

  globalThis.fetch = async () => {
    siteverifyCalled = true;
    return new Response(JSON.stringify({ success: true }));
  };

  let status;
  try {
    const res = await call(postRequest({ ...VALID_PR, 'cf-turnstile-response': 'abc' }), env);
    status = res.status;
  } finally {
    globalThis.fetch = original;
  }

  if (status !== 400) throw new Error(`expected 400, got ${status}`);
  if (writes.length !== 0) throw new Error('stored with no secret configured');
  if (siteverifyCalled) throw new Error('called siteverify with no secret');
});

test('stores a valid submission after a good token', async () => {
  const restore = stubSiteverify(siteverifyOk);
  try {
    const { env, writes } = makeEnv();
    const res = await call(
      postRequest({ ...VALID_PR, 'cf-turnstile-response': 'good-token' }),
      env
    );

    if (res.status !== 201) throw new Error(`expected 201, got ${res.status}`);
    if (writes.length !== 1) throw new Error(`expected 1 write, got ${writes.length}`);

    const bound = writes[0].values;
    if (bound[0] !== 'Mona Ashraf') throw new Error('full_name not bound first');
    if (bound[1] !== 'mona@example.com') throw new Error('email not bound');
    if (!bound[7]?.includes('pr_sponsor_pitch')) throw new Error('answers not serialised');
    if (bound[8] !== 'New') throw new Error('status not forced to New');
  } finally { restore(); }
});

test('never interpolates user input into SQL', async () => {
  const restore = stubSiteverify(siteverifyOk);
  try {
    const { env, writes } = makeEnv();
    await call(
      postRequest({
        ...VALID_PR,
        'cf-turnstile-response': 't',
        full_name: "'); DROP TABLE applications; --"
      }),
      env
    );

    const sql = writes[0].sql;
    if (!sql.includes('?')) throw new Error('query is not parameterised');
    if (sql.includes('DROP')) throw new Error('user input reached the SQL text');
    if (writes[0].values[0] !== "'); DROP TABLE applications; --") {
      throw new Error('input was not bound as a value');
    }
  } finally { restore(); }
});

test('returns 422 with details when answers are incomplete', async () => {
  const restore = stubSiteverify(siteverifyOk);
  try {
    const { env, writes } = makeEnv();
    const { pr_languages, ...incomplete } = VALID_PR;
    const res = await call(
      postRequest({ ...incomplete, 'cf-turnstile-response': 't' }),
      env
    );

    if (res.status !== 422) throw new Error(`expected 422, got ${res.status}`);
    if (writes.length !== 0) throw new Error('stored an incomplete application');
    const body = await res.json();
    if (!Array.isArray(body.errors) || !body.errors.length) throw new Error('no error list');
  } finally { restore(); }
});

test('returns 409 for a duplicate email', async () => {
  const restore = stubSiteverify(siteverifyOk);
  try {
    const { env, writes } = makeEnv({ uniqueViolation: true });
    const res = await call(
      postRequest({ ...VALID_PR, 'cf-turnstile-response': 't' }),
      env
    );

    if (res.status !== 409) throw new Error(`expected 409, got ${res.status}`);
    if (writes.length !== 0) throw new Error('should not write on conflict');
    const body = await res.json();
    if (!/already have/i.test(body.error)) throw new Error('unhelpful duplicate message');
  } finally { restore(); }
});

test('surfaces a database failure as 500, not a stack trace', async () => {
  const restore = stubSiteverify(siteverifyOk);
  try {
    const { env } = makeEnv({ dbError: 'D1_ERROR: disk I/O error' });
    const res = await call(
      postRequest({ ...VALID_PR, 'cf-turnstile-response': 't' }),
      env
    );

    if (res.status !== 500) throw new Error(`expected 500, got ${res.status}`);
    const body = await res.json();
    if (JSON.stringify(body).toLowerCase().includes('d1_error')) {
      throw new Error('leaked an internal error to the client');
    }
  } finally { restore(); }
});

test('rejects malformed JSON with 400', async () => {
  const restore = stubSiteverify(siteverifyOk);
  try {
    const { env, writes } = makeEnv();
    const res = await call(postRequest(null, { raw: '{not json' }), env);

    if (res.status !== 400) throw new Error(`expected 400, got ${res.status}`);
    if (writes.length !== 0) throw new Error('wrote from a malformed body');
  } finally { restore(); }
});

test('rejects an oversized body with 413', async () => {
  const restore = stubSiteverify(siteverifyOk);
  try {
    const { env, writes } = makeEnv();
    const huge = JSON.stringify({ ...VALID_PR, full_name: 'a'.repeat(300 * 1024) });
    const res = await call(postRequest(null, { raw: huge }), env);

    if (res.status !== 413) throw new Error(`expected 413, got ${res.status}`);
    if (writes.length !== 0) throw new Error('wrote from an oversized body');
  } finally { restore(); }
});

test('handles an empty body without crashing', async () => {
  const restore = stubSiteverify(siteverifyOk);
  try {
    const { env } = makeEnv();
    const res = await call(postRequest(null, { raw: '' }), env);
    if (res.status !== 400) throw new Error(`expected 400, got ${res.status}`);
  } finally { restore(); }
});

test('allows the real site origin and refuses everything else', async () => {
  const { env } = makeEnv();

  const allowed = await call(
    new Request('https://worker.test/api/health', {
      headers: { Origin: 'https://gharbiyahc.org' }
    }),
    env
  );
  if (allowed.headers.get('Access-Control-Allow-Origin') !== 'https://gharbiyahc.org') {
    throw new Error('site origin not allowed');
  }

  for (const origin of ['https://evil.example', 'https://gharbiyahc.org.evil.example', 'null']) {
    const res = await call(
      new Request('https://worker.test/api/health', { headers: { Origin: origin } }),
      env
    );
    if (res.headers.get('Access-Control-Allow-Origin')) {
      throw new Error(`origin was allowed: ${origin}`);
    }
  }
});

test('calls Cloudflare siteverify over HTTPS on the real host, and nothing else', async () => {
  const { env, writes } = makeEnv();
  const seen = [];
  const original = globalThis.fetch;

  globalThis.fetch = async (url) => {
    const parsed = new URL(String(url));
    seen.push(`${parsed.protocol}//${parsed.hostname}${parsed.pathname}`);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  };

  try {
    await call(postRequest({ ...VALID_PR, 'cf-turnstile-response': 't' }), env);
  } finally {
    globalThis.fetch = original;
  }

  if (seen.length !== 1) throw new Error(`expected 1 outbound call, got ${seen.length}`);
  if (seen[0] !== `https://${SITEVERIFY_HOST}${SITEVERIFY_PATH}`) {
    throw new Error(`unexpected outbound URL: ${seen[0]}`);
  }
  // A downgraded or lookalike host would be an SSRF-shaped mistake worth failing on.
  if (!seen[0].startsWith(`https://${SITEVERIFY_HOST}/`)) {
    throw new Error('siteverify must be called over TLS on the real Cloudflare host');
  }
  if (writes.length !== 1) throw new Error('application was not stored');
});

test('admin list requires a token', async () => {
  const { env } = makeEnv();
  const request = () =>
    new Request('https://worker.test/api/applications', {
      headers: { Origin: 'https://gharbiyahc.org' }
    });

  if ((await call(request(), env)).status !== 401) throw new Error('no token was accepted');

  const wrong = await call(
    new Request('https://worker.test/api/applications', {
      headers: { Authorization: 'Bearer wrong' }
    }),
    env
  );
  if (wrong.status !== 401) throw new Error('wrong token was accepted');

  const right = await call(
    new Request('https://worker.test/api/applications', {
      headers: { Authorization: 'Bearer test-admin-token' }
    }),
    env
  );
  if (right.status !== 200) throw new Error(`correct token rejected: ${right.status}`);
});

test('admin list never returns the answers column', async () => {
  const { env } = makeEnv({ rows: [{ id: 1, email: 'a@b.c', why_join: 'x' }] });
  const res = await call(
    new Request('https://worker.test/api/applications', {
      headers: { Authorization: 'Bearer test-admin-token' }
    }),
    env
  );
  const body = await res.json();
  if ('answers' in body.applications[0]) throw new Error('answers leaked through the API');
});

test('admin list is disabled when ADMIN_TOKEN is unset', async () => {
  const { env } = makeEnv({ adminToken: '' });
  const res = await call(
    new Request('https://worker.test/api/applications', {
      headers: { Authorization: 'Bearer anything' }
    }),
    env
  );
  if (res.status !== 503) throw new Error(`expected 503, got ${res.status}`);
});

test('health check needs no token and leaks nothing', async () => {
  const { env } = makeEnv();
  const res = await call(new Request('https://worker.test/api/health'), env);
  if (res.status !== 200) throw new Error(`expected 200, got ${res.status}`);
  const body = await res.json();
  if (Object.keys(body).length !== 2) throw new Error('health response has extra fields');
});

test('unknown routes return 404', async () => {
  const { env } = makeEnv();
  for (const path of ['/', '/api', '/api/admin', '/api/applications/../secrets']) {
    const res = await call(new Request(`https://worker.test${path}`), env);
    if (res.status !== 404) throw new Error(`${path} returned ${res.status}`);
  }
});

// ---------------------------------------------------------------- run

// The Worker logs every caught error. That is correct in production, but it
// floods this runner's output, so swallow it and only print test results.
const realConsoleError = console.error;
console.error = () => {};

let failed = 0;
for (const { name, fn } of tests) {
  try {
    await fn();
    console.log(`  ok    ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`  FAIL  ${name}\n          ${error.message}`);
  }
}

console.error = realConsoleError;
console.log(`\n${tests.length - failed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
