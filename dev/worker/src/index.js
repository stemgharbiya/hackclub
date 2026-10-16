/**
 * Join-team applications API — Cloudflare Worker.
 *
 * Responsibilities, in order:
 *   1. Reject cross-origin requests from anywhere but the site.
 *   2. Verify the Cloudflare Turnstile token with Cloudflare itself.
 *   3. Validate every answer against the question sets the form shipped.
 *   4. Store the application in D1, rejecting duplicate emails.
 *
 * Turnstile is checked before validation on purpose: an unverified caller
 * should not be able to make us do any work beyond one lookup.
 */

import { QUESTION_DATA } from './questions.js';

// Origins allowed to POST from a browser. Add a staging domain if you need one.
const ALLOWED_ORIGINS = [
  'https://gharbiyahc.org',
  'http://localhost:4321',
  'http://localhost:8787'
];

const EMAIL_MIN = 3;
const PHONE_MIN_LENGTH = 7;
const WHY_JOIN_MIN_LENGTH = 20;
const MAX_STRING = 5000;
const MAX_ANSWERS = 60;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    try {
      if (url.pathname === '/api/health') {
        return json(request, 200, { ok: true, service: 'join-team-api' });
      }

      if (url.pathname === '/api/applications') {
        if (request.method === 'POST') return await handleSubmit(request, env);
        if (request.method === 'GET') return await handleList(request, env);
      }

      return json(request, 404, { error: 'Not found.' });
    } catch (error) {
      console.error('Unhandled error:', error?.stack ?? error);
      return json(request, 500, { error: 'Something went wrong on our side.' });
    }
  }
};

// ---------------------------------------------------------------- CORS

function corsHeaders(request) {
  const origin = request.headers.get('Origin');
  // Same-origin and server-to-server calls send no Origin header.
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) return {};

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}

function json(request, status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(request),
      ...extraHeaders
    }
  });
}

// ---------------------------------------------------------------- Submit

async function handleSubmit(request, env) {
  const body = await readJson(request);
  if (body.error) return json(request, body.status, { error: body.error });

  // 1. Turnstile, verified against Cloudflare. Never trust the client's word.
  const token = body['cf-turnstile-response'];
  if (!token) {
    return json(request, 400, { error: 'Complete the verification challenge before submitting.' });
  }

  const verified = await verifyTurnstile(token, request, env);
  if (!verified.success) {
    return json(request, 400, { error: 'Your verification expired. Please solve it again.' });
  }

  // 2. Validate every answer the form was supposed to collect.
  const result = validate(body);
  if (!result.ok) {
    return json(request, 422, {
      error: 'Some answers need attention.',
      errors: result.errors
    });
  }

  const application = result.application;

  // 3. Store. D1 enforces one row per email.
  try {
    await env.DB.prepare(
      `INSERT INTO applications (
         full_name, email, phone, committee, academic_track,
         why_join, portfolio_link, answers,
         status, submitted_at, user_agent
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        application.fullName,
        application.email,
        application.phone,
        application.committee,
        application.academicTrack,
        application.whyJoin,
        application.portfolioLink,
        JSON.stringify(application.answers),
        'New',
        new Date().toISOString(),
        request.headers.get('User-Agent') ?? ''
      )
      .run();

    console.log(
      `stored ${application.email} (${application.committee}${
        application.academicTrack ? ` / ${application.academicTrack}` : ''
      })`
    );
  } catch (error) {
    if (String(error?.message ?? error).includes('UNIQUE')) {
      return json(request, 409, {
        error: 'We already have an application from this email address.'
      });
    }
    throw error;
  }

  return json(request, 201, {
    message: 'Application received.',
    status: 'New',
    submittedAt: application.submittedAt
  });
}

// ---------------------------------------------------------------- Turnstile

async function verifyTurnstile(token, request, env) {
  if (!env.TURNSTILE_SECRET) {
    // Fail closed. A missing secret must never mean "skip the check".
    console.error('TURNSTILE_SECRET is not set.');
    return { success: false };
  }

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: env.TURNSTILE_SECRET,
      response: token,
      remoteip: request.headers.get('CF-Connecting-IP') ?? undefined
    })
  });

  if (!response.ok) return { success: false };
  return await response.json();
}

// ---------------------------------------------------------------- Validate

function getQuestionSet(committee, academicTrack) {
  if (!committee) return null;
  if (committee === 'Academics') {
    if (!academicTrack) return null;
    return QUESTION_DATA.academicTrackSets[academicTrack] ?? null;
  }
  return QUESTION_DATA.committeeSets[committee] ?? null;
}

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const clean = (value) => (typeof value === 'string' ? value.trim() : '');

function validate(input) {
  if (!isPlainObject(input)) {
    return { ok: false, errors: ['Request body must be a JSON object.'] };
  }

  const errors = [];

  const fullName = clean(input.full_name);
  const email = clean(input.email).toLowerCase();
  const phone = clean(input.phone);
  const committee = clean(input.committee);
  const academicTrack = clean(input.academic_track);
  const whyJoin = clean(input.why_join);
  const portfolioLink = clean(input.portfolio_link);

  if (fullName.length < 2) errors.push('Full name is required.');
  if (!email.includes('@') || email.length < EMAIL_MIN) {
    errors.push('A valid email address is required.');
  }
  if (phone.length < PHONE_MIN_LENGTH) {
    errors.push(`Phone must be at least ${PHONE_MIN_LENGTH} characters.`);
  }
  if (!QUESTION_DATA.committees.includes(committee)) {
    errors.push('Committee is not a known option.');
  }
  if (committee === 'Academics' && !QUESTION_DATA.academicTracks.includes(academicTrack)) {
    errors.push('An academic track is required when applying to Academics.');
  }
  if (committee !== 'Academics' && academicTrack) {
    errors.push('An academic track can only be set when applying to Academics.');
  }
  if (whyJoin.length < WHY_JOIN_MIN_LENGTH) {
    errors.push(`Why you want to join must be at least ${WHY_JOIN_MIN_LENGTH} characters.`);
  }

  const questionSet = getQuestionSet(committee, academicTrack);

  // Keep the label alongside the answer so the stored record still reads
  // correctly even if the question wording changes next season.
  const answers = [];

  if (questionSet) {
    for (const question of questionSet.questions) {
      const answer = clean(input[question.id]);
      if (question.required && !answer) {
        errors.push(`Missing answer for: ${question.label}`);
        continue;
      }
      if (answer.length > MAX_STRING) {
        errors.push(`Answer is too long for: ${question.label}`);
        continue;
      }
      if (answer) answers.push({ id: question.id, label: question.label, answer });
    }

    if (questionSet.endLink.required && !portfolioLink) {
      errors.push(`A link is required for: ${questionSet.title}`);
    }
  }

  if (portfolioLink && !/^https?:\/\/.+/i.test(portfolioLink)) {
    errors.push('The link must start with http:// or https://');
  }
  if (portfolioLink.length > MAX_STRING) errors.push('The link is too long.');
  if (answers.length > MAX_ANSWERS) errors.push('Too many answers were submitted.');

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    application: {
      fullName,
      email,
      phone,
      committee,
      academicTrack: committee === 'Academics' ? academicTrack : '',
      whyJoin,
      portfolioLink,
      answers,
      submittedAt: new Date().toISOString()
    }
  };
}

// ---------------------------------------------------------------- Admin read

/**
 * GET /api/applications with `Authorization: Bearer <ADMIN_TOKEN>`.
 * Useful for scripting; D1 Studio in the dashboard is easier for reading.
 */
async function handleList(request, env) {
  if (!env.ADMIN_TOKEN) return json(request, 503, { error: 'Admin access is disabled.' });

  const header = request.headers.get('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (token !== env.ADMIN_TOKEN) return json(request, 401, { error: 'Unauthorized.' });

  const { results } = await env.DB.prepare(
    `SELECT id, full_name, email, phone, committee, academic_track,
            why_join, portfolio_link, status, submitted_at
     FROM applications
     ORDER BY id DESC
     LIMIT 500`
  ).all();

  return json(request, 200, { count: results.length, applications: results });
}

// ---------------------------------------------------------------- Body

async function readJson(request) {
  let raw;
  try {
    raw = await request.text();
  } catch {
    return { error: 'Could not read the request body.' };
  }

  if (raw.length > 256 * 1024) {
    return { error: 'Request body is too large.', status: 413 };
  }
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    return { error: 'Request body must be valid JSON.', status: 400 };
  }
}
