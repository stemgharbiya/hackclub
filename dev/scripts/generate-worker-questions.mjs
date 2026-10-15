/**
 * Regenerates `worker/src/questions.js` from the form's `questions.json`.
 *
 * The Worker and the browser form must agree on which questions exist and which
 * are required. Copying that data by hand is how the two drift apart, so this
 * script is the only supported way to change it.
 *
 *   npm run worker:questions
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, '..', 'src', 'pages', 'join-team', 'questions.json');
const target = join(here, '..', 'worker', 'src', 'questions.js');

const questions = JSON.parse(readFileSync(source, 'utf8'));

const banner = `// AUTO-GENERATED — do not edit by hand.
// Source: dev/src/pages/join-team/questions.json
// Regenerate with: npm run worker:questions
`;

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${banner}export const QUESTION_DATA = ${JSON.stringify(questions, null, 2)};\n`);

const questionCount = [
  ...Object.values(questions.committeeSets),
  ...Object.values(questions.academicTrackSets)
].reduce((total, set) => total + set.questions.length, 0);

console.log(
  `Wrote ${target}\n  ${questions.committees.length} committees, ` +
    `${questions.academicTracks.length} tracks, ${questionCount} questions.`
);
