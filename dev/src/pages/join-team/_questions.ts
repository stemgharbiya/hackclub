import questionData from './questions.json';
import type {
  AcademicTrack,
  Committee,
  DynamicQuestion,
  QuestionSet,
  SelectedAcademicTrack
} from './_types';

/**
 * Question definitions live in `questions.json` so the browser app and the
 * backend service validate against exactly the same data.
 */
export const COMMITTEE_QUESTION_SETS = questionData.committeeSets as unknown as Record<
  Exclude<Committee, 'Academics'>,
  QuestionSet
>;

export const ACADEMICS_TRACK_QUESTION_SETS = questionData.academicTrackSets as unknown as Record<
  SelectedAcademicTrack,
  QuestionSet
>;

/** Ordered committee options for the step 1 dropdown. */
export const COMMITTEE_OPTIONS = questionData.committees as Committee[];

/** Ordered academic track options for the nested step 1 dropdown. */
export const ACADEMIC_TRACK_OPTIONS = questionData.academicTracks as SelectedAcademicTrack[];

/** All question sets, used by the backend contract tests. */
export const ALL_QUESTION_SETS: QuestionSet[] = [
  ...Object.values(COMMITTEE_QUESTION_SETS),
  ...Object.values(ACADEMICS_TRACK_QUESTION_SETS)
];

export const ALL_QUESTION_IDS: string[] = ALL_QUESTION_SETS.flatMap((set) =>
  set.questions.map((question: DynamicQuestion) => question.id)
);

/**
 * Resolves the active question set from the two step 1 selections.
 * Returns `null` while the selection is incomplete.
 */
export function getQuestionSet(
  committee: Committee | '',
  academicTrack: AcademicTrack
): QuestionSet | null {
  if (!committee) return null;

  if (committee === 'Academics') {
    if (!academicTrack) return null;
    return ACADEMICS_TRACK_QUESTION_SETS[academicTrack];
  }

  return COMMITTEE_QUESTION_SETS[committee];
}

/** Human readable label for the selection, used in the closing question. */
export function getSelectionLabel(
  committee: Committee | '',
  academicTrack: AcademicTrack
): string {
  if (committee === 'Academics') {
    return academicTrack ? `${academicTrack} Track` : '';
  }
  return committee;
}
