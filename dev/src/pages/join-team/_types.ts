/**
 * Shared, strictly typed data schema for the native member registration form.
 *
 * The form is intentionally data-driven: every departmental question set lives in
 * `questions.ts` and is keyed off the selections defined here. Adding a new
 * committee or academic track only requires a new entry in those two files.
 */

/** The six committees a member can apply to. */
export type Committee =
  | 'PR'
  | 'HR'
  | 'Marketing & Social Media'
  | 'Organizing Committee'
  | 'Tech / IT'
  | 'Academics';

/** Academic sub-tracks. The empty string represents "not selected yet". */
export type AcademicTrack =
  | 'Cyber Security'
  | 'Web Development'
  | 'Competitive Programming'
  | 'Data Science'
  | '';

/** Narrowed academic track (never the empty sentinel). */
export type SelectedAcademicTrack = Exclude<AcademicTrack, ''>;

/** Semantic control type used to render a dynamic question. */
export type QuestionKind = 'text' | 'textarea' | 'url';

/** A single injected departmental question. */
export interface DynamicQuestion {
  /** Stable identifier, also used as the `dynamicResponses` key. */
  id: string;
  /** Question text shown as the field label. */
  label: string;
  /** Optional supporting copy shown under the label. */
  hint?: string;
  /** Control type to render. */
  kind: QuestionKind;
  /** Every question is required unless explicitly marked otherwise. */
  required: boolean;
  /** Number of rows for `textarea` questions. */
  rows?: number;
  placeholder?: string;
}

/** The closing link field rendered after the dynamic questions. */
export interface EndLinkDefinition {
  /** Stable identifier inside `dynamicResponses`. */
  id: string;
  label: string;
  placeholder?: string;
  /** Only links explicitly labelled "Optional" may be left blank. */
  required: boolean;
}

/** A complete question set for one committee or one academic track. */
export interface QuestionSet {
  /** Canonical key, e.g. `PR` or `Academics:Cyber Security`. */
  key: string;
  title: string;
  description: string;
  questions: DynamicQuestion[];
  endLink: EndLinkDefinition;
}

/** Matrix of departmental answers, keyed by question id. */
export type DynamicResponses = Record<string, string>;

/**
 * Core shape of the registration form.
 *
 * `whyJoin` and `portfolioLink` are the two universal closing answers:
 * `whyJoin` is always required, `portfolioLink` mirrors the active question
 * set's end link and is only enforced when that link is marked required.
 */
export interface BaseFormData {
  fullName: string;
  email: string;
  phone: string;
  committee: Committee | '';
  academicTrack: AcademicTrack;
  whyJoin: string;
  portfolioLink: string;
  dynamicResponses: DynamicResponses;
}

/**
 * Previously the form sent a `status` and a client-side `submittedAt` here.
 * The API derives both itself, so those fields are gone — see `ApiPayload` in
 * `_payload.ts` for what is actually transmitted.
 */

/** Lifecycle of the submission request. */
export type SubmissionStatus = 'idle' | 'loading' | 'success' | 'error';

/** Field-keyed validation messages. */
export type FieldErrors = Partial<Record<keyof BaseFormData, string>>;

/** Minimum accepted lengths. */
export const VALIDATION = {
  email: { mustContain: '@' },
  phone: { minLength: 7 },
  whyJoin: { minLength: 20 }
} as const;
