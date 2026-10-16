import type { BaseFormData } from './_types';

/**
 * Payload sent to the join-team Worker (`dev/worker/`).
 *
 * A flat object of snake_case fields plus the Turnstile token, rather than the
 * nested structure the form holds internally. The Worker flattens each
 * answer's id and label into its own `answers` column on the way to D1.
 */
export interface ApiPayload {
  // Core applicant details
  full_name: string;
  email: string;
  phone: string;

  // Selection
  committee: string;
  academic_track: string;

  // Closing questions
  why_join: string;
  portfolio_link: string;

  // Departmental answers, flattened onto the top level
  [questionId: string]: string;

  // Required by the API's spam check
  'cf-turnstile-response': string;
}

/**
 * Flattens form state into the Worker payload.
 *
 * Every dynamic answer is spread onto the top level so the Worker receives
 * `pr_sponsor_pitch` rather than `dynamicResponses.pr_sponsor_pitch`.
 */
export function toApiPayload(formData: BaseFormData, turnstileToken: string): ApiPayload {
  return {
    ...formData.dynamicResponses,
    full_name: formData.fullName,
    email: formData.email,
    phone: formData.phone,
    committee: formData.committee,
    academic_track: formData.academicTrack,
    why_join: formData.whyJoin,
    portfolio_link: formData.portfolioLink,
    'cf-turnstile-response': turnstileToken
  };
}
