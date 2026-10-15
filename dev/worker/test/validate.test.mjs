/**
 * Tests the Worker's validation rules outside the Workers runtime.
 *
 * The Worker and the browser form must agree on every required field. This
 * exercises the same `validate()` the Worker runs, so a change to one set of
 * questions cannot silently break the other.
 *
 *   node worker/test/validate.test.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const workerSource = readFileSync(join(here, '..', 'src', 'index.js'), 'utf8');

// Inline the generated question data in place of the ES import, so the module
// can be evaluated here without a bundler.
const questionsSource = readFileSync(join(here, '..', 'src', 'questions.js'), 'utf8');
const dataLiteral = questionsSource.slice(questionsSource.indexOf('=') + 1).replace(/;\s*$/, '');

const testable = workerSource
  .replace(/^import\s+\{[^}]*\}\s+from\s+'[^']+';?$/m, `const QUESTION_DATA = ${dataLiteral};`)
  .concat('\nexport { validate, getQuestionSet, QUESTION_DATA };\n');

const { validate, getQuestionSet, QUESTION_DATA } = await import(
  `data:text/javascript;base64,${Buffer.from(testable).toString('base64')}`
);

const PR_ANSWERS = {
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

const TECH_ANSWERS = {
  tech_stack: 'HTML/CSS, React, Git, Vercel.',
  tech_website_features: 'A public events calendar.',
  tech_site_down: 'Check the deploy logs, roll back, then fix forward.'
};

const DATA_SCIENCE_ANSWERS = {
  ds_tools: 'Python, pandas, scikit-learn.',
  ds_project: 'I analysed Cairo air quality data and built a dashboard.',
  ds_overfitting: 'It is when a model memorises the training data instead of the pattern.'
};

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('accepts a complete PR application', () => {
  const result = validate(PR_ANSWERS);
  if (!result.ok) throw new Error(`expected ok, got: ${result.errors?.join('; ')}`);
});

test('lowercases the email so duplicates are caught', () => {
  const result = validate({ ...PR_ANSWERS, email: 'MONA@Example.COM' });
  if (result.application.email !== 'mona@example.com') throw new Error('email not lowercased');
});

test('stamps submittedAt on the server, not the client', () => {
  const result = validate({ ...PR_ANSWERS, submitted_at: '1999-01-01', status: 'Accepted' });
  if (result.application.status !== undefined) throw new Error('client status leaked through');
  if (!result.application.submittedAt.startsWith('20')) throw new Error('missing server timestamp');
});

test('stores the question label alongside each answer', () => {
  const result = validate(PR_ANSWERS);
  const first = result.application.answers[0];
  if (first.id !== 'pr_sponsor_outreach') throw new Error(`unexpected id: ${first.id}`);
  if (typeof first.label !== 'string' || !first.label.length) throw new Error('label missing');
});

test('records exactly one answer per question plus none for the link', () => {
  const result = validate(PR_ANSWERS);
  if (result.application.answers.length !== 3) {
    throw new Error(`expected 3 answers, got ${result.application.answers.length}`);
  }
});

test('rejects a body that is not an object', () => {
  for (const bad of ['nope', 42, null, ['a']]) {
    if (validate(bad).ok) throw new Error(`accepted ${JSON.stringify(bad)}`);
  }
});

test('rejects an email without @', () => {
  if (validate({ ...PR_ANSWERS, email: 'nope' }).ok) throw new Error('accepted bad email');
});

test('enforces the 7 character phone minimum', () => {
  if (validate({ ...PR_ANSWERS, phone: '123456' }).ok) throw new Error('accepted short phone');
  if (!validate({ ...PR_ANSWERS, phone: '1234567' }).ok) throw new Error('rejected 7 chars');
});

test('enforces the 20 character why_join minimum', () => {
  if (validate({ ...PR_ANSWERS, why_join: 'too short' }).ok) throw new Error('accepted short why');
});

test('rejects a blank answer to a required question', () => {
  const result = validate({ ...PR_ANSWERS, pr_languages: '   ' });
  if (result.ok) throw new Error('accepted blank required answer');
  if (!result.errors.join(' ').includes('languages')) throw new Error('error should name the field');
});

test('rejects an unknown committee', () => {
  if (validate({ ...PR_ANSWERS, committee: 'Astrology' }).ok) throw new Error('accepted bad committee');
});

test('requires an academic track for Academics', () => {
  const result = validate({ ...PR_ANSWERS, committee: 'Academics', academic_track: '' });
  if (result.ok) throw new Error('accepted Academics with no track');
  if (!result.errors.join(' ').toLowerCase().includes('track')) throw new Error('unclear error');
});

test('rejects a track on a non-Academics committee', () => {
  if (validate({ ...PR_ANSWERS, academic_track: 'Data Science' }).ok) {
    throw new Error('accepted a track on PR');
  }
});

test('accepts a Data Science application with its required link', () => {
  const result = validate({
    ...PR_ANSWERS,
    committee: 'Academics',
    academic_track: 'Data Science',
    portfolio_link: 'https://kaggle.com/mona',
    ...DATA_SCIENCE_ANSWERS
  });
  if (!result.ok) throw new Error(`expected ok, got: ${result.errors?.join('; ')}`);
  if (result.application.answers.length !== 3) throw new Error('wrong answer count');
});

test('leaves academic_track blank when not applying to Academics', () => {
  if (validate(PR_ANSWERS).application.academicTrack !== '') throw new Error('track not cleared');
});

test('requires the end link when the question set marks it required', () => {
  const result = validate({
    ...PR_ANSWERS,
    committee: 'Tech / IT',
    ...TECH_ANSWERS
  });
  if (result.ok) throw new Error('accepted Tech/IT with no link');
  if (!result.errors.join(' ').toLowerCase().includes('link')) throw new Error('unclear error');
});

test('treats an optional end link as optional', () => {
  if (!validate({ ...PR_ANSWERS, portfolio_link: '' }).ok) {
    throw new Error('PR should not require a link');
  }
});

test('rejects a link without http(s)', () => {
  if (validate({ ...PR_ANSWERS, portfolio_link: 'linkedin.com/in/mona' }).ok) {
    throw new Error('accepted a schemeless link');
  }
});

test('ignores unknown extra fields', () => {
  if (!validate({ ...PR_ANSWERS, injected: 'x', admin: true }).ok) {
    throw new Error('extra fields should be ignored, not rejected');
  }
});

test('rejects an answer longer than the cap', () => {
  const result = validate({ ...PR_ANSWERS, pr_languages: 'a'.repeat(5001) });
  if (result.ok) throw new Error('accepted an over-long answer');
});

test('getQuestionSet resolves committees and tracks', () => {
  if (getQuestionSet('PR', '')?.title !== 'Public Relations') throw new Error('PR lookup failed');
  if (getQuestionSet('Academics', 'Data Science')?.title !== 'Academics — Data Science') {
    throw new Error(`track lookup failed: ${getQuestionSet('Academics', 'Data Science')?.title}`);
  }
  if (getQuestionSet('', '') !== null) throw new Error('empty selection should be null');
  if (getQuestionSet('Academics', '') !== null) throw new Error('Academics with no track should be null');
  if (getQuestionSet('Astrology', '') !== null) throw new Error('unknown committee should be null');
});

test('every option has a question set', () => {
  for (const committee of QUESTION_DATA.committees) {
    if (committee === 'Academics') continue;
    if (!getQuestionSet(committee, '')) throw new Error(`${committee} has no question set`);
  }
  for (const track of QUESTION_DATA.academicTracks) {
    if (!getQuestionSet('Academics', track)) throw new Error(`${track} has no question set`);
  }
});

// ---------------------------------------------------------------- run

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

console.log(`\n${tests.length - failed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
