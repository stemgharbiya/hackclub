import { useCallback, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  ACADEMIC_TRACK_OPTIONS,
  COMMITTEE_OPTIONS,
  getQuestionSet,
  getSelectionLabel
} from './_questions';
import { toApiPayload } from './_payload';
import Turnstile from './_Turnstile';
import {
  VALIDATION,
  type AcademicTrack,
  type BaseFormData,
  type Committee,
  type DynamicResponses,
  type SubmissionStatus
} from './_types';

/**
 * Backend endpoint that receives registration payloads.
 *
 * Points at the custom domain on the same account as the site, so the browser
 * sends one preflight and the Worker answers with the site's own origin.
 * Override with PUBLIC_REGISTRATION_ENDPOINT to test against `wrangler dev`.
 */
const REGISTRATION_ENDPOINT =
  import.meta.env.PUBLIC_REGISTRATION_ENDPOINT || 'https://apply.gharbiyahc.org/api/applications';

/** Gives up rather than leaving the button spinning forever on a dead host. */
const REQUEST_TIMEOUT_MS = 15000;

/**
 * `text-base` on inputs is deliberate: anything under 16px makes iOS Safari
 * zoom on focus, which breaks the mobile layout mid-form.
 */
const inputClass =
  'w-full min-w-0 rounded-2xl border border-slate-300 bg-white/90 px-4 py-3 text-base leading-relaxed text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500';

const labelClass = 'block min-w-0 space-y-2';
const labelTextClass = 'block text-sm font-semibold break-words text-slate-900 dark:text-white';
const hintClass = 'block text-xs text-slate-500 dark:text-slate-400';
const errorTextClass = 'block text-xs font-medium text-[var(--red)]';

const cardClass = 'card w-full';
const actionBaseClass =
  'inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-center text-base font-bold transition sm:w-auto';

const createInitialData = (): BaseFormData => ({
  fullName: '',
  email: '',
  phone: '',
  committee: '',
  academicTrack: '',
  whyJoin: '',
  portfolioLink: '',
  dynamicResponses: {}
});

/** Small wrapper so every step shares one heading + copy rhythm. */
function StepHeading({
  eyebrow,
  title,
  description
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6 min-w-0 sm:mb-8">
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-3xl">
        {title}
      </h2>
      {description && (
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}

export default function JoinTeamForm() {
  const [formData, setFormData] = useState<BaseFormData>(createInitialData);
  const [step, setStep] = useState<1 | 2>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [serverMessage, setServerMessage] = useState<string>('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  // Incremented after a rejected submission to force a fresh Turnstile token.
  const [turnstileReset, setTurnstileReset] = useState(0);

  const questionSet = useMemo(
    () => getQuestionSet(formData.committee, formData.academicTrack),
    [formData.committee, formData.academicTrack]
  );

  const selectionLabel = useMemo(
    () => getSelectionLabel(formData.committee, formData.academicTrack),
    [formData.committee, formData.academicTrack]
  );

  const isSubmitting = status === 'loading';

  /**
   * Guards against a double submit before React re-renders. A disabled button
   * stops the click, but not a fast Enter-key repeat or a programmatic submit.
   */
  const statusRef = useRef<SubmissionStatus>(status);
  statusRef.current = status;

  const setField = useCallback(
    <K extends keyof BaseFormData>(field: K, value: BaseFormData[K]) => {
      setFormData((current) => ({ ...current, [field]: value }));
      setErrors((current) => {
        if (!current[field as string]) return current;
        const next = { ...current };
        delete next[field as string];
        return next;
      });
    },
    []
  );

  const setDynamicResponse = useCallback((id: string, value: string) => {
    setFormData((current) => ({
      ...current,
      dynamicResponses: { ...current.dynamicResponses, [id]: value } as DynamicResponses
    }));
    setErrors((current) => {
      if (!current[id]) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
  }, []);

  const validateStepOne = useCallback((): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      nextErrors.fullName = 'Please enter your full name.';
    }

    if (!formData.email.includes(VALIDATION.email.mustContain)) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (formData.phone.trim().length < VALIDATION.phone.minLength) {
      nextErrors.phone = `Please enter at least ${VALIDATION.phone.minLength} characters.`;
    }

    if (!formData.committee) {
      nextErrors.committee = 'Please choose a committee.';
    }

    if (formData.committee === 'Academics' && !formData.academicTrack) {
      nextErrors.academicTrack = 'Please choose an academic track.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [formData]);

  const validateStepTwo = useCallback((): boolean => {
    if (!questionSet) return false;

    const nextErrors: Record<string, string> = {};

    questionSet.questions.forEach((question) => {
      if (question.required && !(formData.dynamicResponses[question.id] ?? '').trim()) {
        nextErrors[question.id] = 'This question is required.';
      }
    });

    if (questionSet.endLink.required && !formData.portfolioLink.trim()) {
      nextErrors.portfolioLink = 'This link is required.';
    }

    if (formData.whyJoin.trim().length < VALIDATION.whyJoin.minLength) {
      nextErrors.whyJoin = `Please write at least ${VALIDATION.whyJoin.minLength} characters.`;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [formData.dynamicResponses, formData.portfolioLink, formData.whyJoin, questionSet]);

  const handleCommitteeChange = useCallback((value: Committee) => {
    // Changing the target clears departmental answers so nothing stale is submitted.
    setFormData((current) => ({
      ...current,
      committee: value,
      academicTrack: value === 'Academics' ? current.academicTrack : '',
      portfolioLink: '',
      dynamicResponses: {}
    }));
    setErrors({});
  }, []);

  const handleAcademicTrackChange = useCallback((value: AcademicTrack) => {
    setFormData((current) => ({
      ...current,
      academicTrack: value,
      portfolioLink: '',
      dynamicResponses: {}
    }));
    setErrors({});
  }, []);

  const goToStepTwo = useCallback(() => {
    if (!validateStepOne()) return;
    setStep(2);
  }, [validateStepOne]);

  const goToStepOne = useCallback(() => {
    setErrors({});
    setStep(1);
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (statusRef.current !== 'idle' && statusRef.current !== 'error') return;
      if (!validateStepTwo()) return;

      if (!turnstileToken) {
        statusRef.current = 'error';
        setServerMessage('Please complete the verification challenge before submitting.');
        setStatus('error');
        return;
      }

      const payload = toApiPayload(formData, turnstileToken);

      statusRef.current = 'loading';
      setStatus('loading');
      setServerMessage('');

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(REGISTRATION_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        const result = await response.json().catch(() => ({}) as Record<string, unknown>);

        if (!response.ok) {
          const reason =
            typeof result.error === 'string'
              ? result.error
              : typeof result.message === 'string'
                ? result.message
                : 'We could not save your application right now. Please try again.';

          throw new Error(reason);
        }

        statusRef.current = 'success';
        setStatus('success');
      } catch (error) {
        const message =
          error instanceof DOMException && error.name === 'AbortError'
            ? 'That took too long. Please check your connection and try again.'
            : error instanceof TypeError
              ? 'We could not reach the server. Please try again.'
              : error instanceof Error && error.message
                ? error.message
                : 'We could not save your application right now. Please try again.';

        statusRef.current = 'error';
        setServerMessage(message);
        setStatus('error');
        // The server already spent this token during verification, so the next
        // attempt needs a fresh challenge.
        setTurnstileToken(null);
        setTurnstileReset((signal) => signal + 1);
      } finally {
        clearTimeout(timeout);
      }
    },
    [formData, turnstileToken, validateStepTwo]
  );

  if (status === 'success') {
    return (
      <section className="card gradient-green-cyan w-full">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          // APPLICATION RECEIVED
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Thank you for applying.
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
          Your answers were stored safely on our side with the status <span className="pill">New</span>.
          Our team reviews every application by hand and will reach out to you soon.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a className="btn cta justify-center" href="/events">
            See upcoming events
          </a>
          <a className="btn outline justify-center" href="/bootcamps">
            Explore bootcamps
          </a>
        </div>
      </section>
    );
  }

  const progressPercent = step === 1 ? 50 : 100;

  return (
    <form className="w-full space-y-6" onSubmit={handleSubmit} noValidate>
      {status === 'error' && serverMessage && (
        <div
          role="alert"
          className="rounded-2xl border-2 border-[var(--red)] bg-[var(--red)]/10 px-4 py-4 text-sm font-medium leading-relaxed text-slate-900 dark:text-white sm:px-5"
        >
          {serverMessage}
        </div>
      )}

      {/* Stepper stays visible on every step so progress is never ambiguous. */}
      <div className="card w-full !p-4 sm:!p-5">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className={step === 1 ? 'pill' : 'outline-badge'}>1. About you</span>
            <span aria-hidden="true" className="text-slate-400">
              →
            </span>
            <span className={step === 2 ? 'pill' : 'outline-badge'}>2. Your questions</span>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Step {step} of 2
          </span>
        </div>
        <div
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={2}
          aria-valuenow={step}
          aria-label="Application progress"
        >
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{
              width: `${progressPercent}%`,
              backgroundImage: 'linear-gradient(90deg, var(--orange), var(--red))'
            }}
          />
        </div>
      </div>

      {/* A disabled fieldset freezes every control in one shot during flight. */}
      <fieldset disabled={isSubmitting} className="m-0 min-w-0 space-y-6 border-0 p-0">
        {step === 1 ? (
          <section className={cardClass}>
            <StepHeading
              eyebrow="Step 1 of 2"
              title="About you"
              description="We only use these details to contact you about your application."
            />

            <div className="grid min-w-0 gap-5 sm:grid-cols-2">
              <label className={labelClass}>
                <span className={labelTextClass}>Full name</span>
                <input
                  type="text"
                  name="fullName"
                  autoComplete="name"
                  required
                  value={formData.fullName}
                  onChange={(event) => setField('fullName', event.target.value)}
                  className={inputClass}
                  placeholder="Your full name"
                />
                {errors.fullName && <span className={errorTextClass}>{errors.fullName}</span>}
              </label>

              <label className={labelClass}>
                <span className={labelTextClass}>Email</span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(event) => setField('email', event.target.value)}
                  className={inputClass}
                  placeholder="you@example.com"
                />
                {errors.email && <span className={errorTextClass}>{errors.email}</span>}
              </label>

              <label className={labelClass}>
                <span className={labelTextClass}>Phone</span>
                <input
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  required
                  value={formData.phone}
                  onChange={(event) => setField('phone', event.target.value)}
                  className={inputClass}
                  placeholder="+20 1xx xxx xxxx"
                />
                {errors.phone && <span className={errorTextClass}>{errors.phone}</span>}
              </label>

              <label className={labelClass}>
                <span className={labelTextClass}>Select committee</span>
                <select
                  name="committee"
                  required
                  value={formData.committee}
                  onChange={(event) => handleCommitteeChange(event.target.value as Committee)}
                  className={inputClass}
                >
                  <option value="">Choose a committee</option>
                  {COMMITTEE_OPTIONS.map((committee) => (
                    <option key={committee} value={committee}>
                      {committee}
                    </option>
                  ))}
                </select>
                {errors.committee && <span className={errorTextClass}>{errors.committee}</span>}
              </label>

              {formData.committee === 'Academics' && (
                <label className={`${labelClass} sm:col-span-2`}>
                  <span className={labelTextClass}>Select academic track</span>
                  <select
                    name="academicTrack"
                    required
                    value={formData.academicTrack}
                    onChange={(event) =>
                      handleAcademicTrackChange(event.target.value as AcademicTrack)
                    }
                    className={inputClass}
                  >
                    <option value="">Choose a track</option>
                    {ACADEMIC_TRACK_OPTIONS.map((track) => (
                      <option key={track} value={track}>
                        {track}
                      </option>
                    ))}
                  </select>
                  {errors.academicTrack && (
                    <span className={errorTextClass}>{errors.academicTrack}</span>
                  )}
                </label>
              )}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button type="button" className={`${actionBaseClass} btn cta`} onClick={goToStepTwo}>
                Continue to questions
              </button>
            </div>
          </section>
        ) : questionSet ? (
          <>
            <section className={cardClass}>
              <StepHeading
                eyebrow={selectionLabel}
                title={questionSet.title}
                description={questionSet.description}
              />

              <div className="space-y-6">
                {questionSet.questions.map((question, index) => (
                  <label key={question.id} className={labelClass}>
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span
                        aria-hidden="true"
                        className="font-mono text-xs font-bold text-[var(--accent)]"
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className={labelTextClass}>{question.label}</span>
                    </span>
                    {question.kind === 'textarea' ? (
                      <textarea
                        name={question.id}
                        rows={question.rows ?? 5}
                        required={question.required}
                        value={formData.dynamicResponses[question.id] ?? ''}
                        onChange={(event) => setDynamicResponse(question.id, event.target.value)}
                        className={inputClass}
                        placeholder={question.placeholder}
                      />
                    ) : (
                      <input
                        type="text"
                        name={question.id}
                        required={question.required}
                        value={formData.dynamicResponses[question.id] ?? ''}
                        onChange={(event) => setDynamicResponse(question.id, event.target.value)}
                        className={inputClass}
                        placeholder={question.placeholder}
                      />
                    )}
                    {errors[question.id] && (
                      <span className={errorTextClass}>{errors[question.id]}</span>
                    )}
                  </label>
                ))}

                <label className={labelClass}>
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span
                      aria-hidden="true"
                      className="font-mono text-xs font-bold text-[var(--accent)]"
                    >
                      {String(questionSet.questions.length + 1).padStart(2, '0')}
                    </span>
                    <span className={labelTextClass}>
                      {questionSet.endLink.label}
                      {!questionSet.endLink.required && (
                        <span className={hintClass}> (Optional)</span>
                      )}
                    </span>
                  </span>
                  <input
                    type="url"
                    name={questionSet.endLink.id}
                    required={questionSet.endLink.required}
                    value={formData.portfolioLink}
                    onChange={(event) => setField('portfolioLink', event.target.value)}
                    className={inputClass}
                    placeholder={questionSet.endLink.placeholder}
                  />
                  {errors.portfolioLink && (
                    <span className={errorTextClass}>{errors.portfolioLink}</span>
                  )}
                </label>
              </div>
            </section>

            <section className={`${cardClass} gradient-purple-blue`}>
              <StepHeading
                eyebrow="Last step"
                title={`Why do you want to join ${selectionLabel}?`}
              />
              <label className={labelClass}>
                <span className="sr-only">Why do you want to join {selectionLabel}?</span>
                <textarea
                  name="whyJoin"
                  rows={5}
                  required
                  minLength={VALIDATION.whyJoin.minLength}
                  value={formData.whyJoin}
                  onChange={(event) => setField('whyJoin', event.target.value)}
                  className={inputClass}
                  placeholder="Tell us what you want to build here, and what you would bring to the team."
                />
                <span className={hintClass}>
                  {formData.whyJoin.trim().length}/{VALIDATION.whyJoin.minLength} characters minimum
                </span>
                {errors.whyJoin && <span className={errorTextClass}>{errors.whyJoin}</span>}
              </label>
            </section>

            <section className="card w-full">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                Verification
              </p>
              <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                Complete the human check, then send the form.
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                We use Cloudflare Turnstile to keep the application form spam-free and fair.
              </p>

              <div className="mt-5">
                <Turnstile
                  onToken={setTurnstileToken}
                  disabled={isSubmitting}
                  resetSignal={turnstileReset}
                />
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <button
                  type="submit"
                  className={`${actionBaseClass} btn cta`}
                  disabled={isSubmitting || !turnstileToken}
                >
                  {isSubmitting ? 'Submitting File State...' : 'Submit application'}
                </button>
                <button
                  type="button"
                  className={`${actionBaseClass} btn outline`}
                  onClick={goToStepOne}
                >
                  Back
                </button>
              </div>
              <p
                className="mt-4 text-sm text-slate-600 dark:text-slate-300"
                aria-live="polite"
                role={isSubmitting ? 'status' : undefined}
              >
                {isSubmitting
                  ? 'Sending your application to the team...'
                  : turnstileToken
                    ? ''
                    : 'Complete the verification widget to enable the submit button.'}
              </p>
            </section>
          </>
        ) : null}
      </fieldset>
    </form>
  );
}
