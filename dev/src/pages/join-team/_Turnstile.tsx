import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme?: 'auto' | 'light' | 'dark';
          callback: (token: string) => void;
          'expired-callback': () => void;
          'error-callback': () => void;
          'timeout-callback'?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const SCRIPT_ID = 'cf-turnstile-script';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/**
 * Sitekey for this site's Turnstile widget.
 *
 * Paired with the `TURNSTILE_SECRET` Worker secret. Tokens are widget-scoped,
 * so these two must belong to the same widget or every submission is rejected.
 */
const SITE_KEY = '0x4AAAAAAFTLsGbtY6v8AjV1';

interface Props {
  /** Receives the token, or null while unsolved / expired / errored. */
  onToken: (token: string | null) => void;
  /**
   * Bump this to discard the current token and render a fresh challenge.
   *
   * Turnstile tokens are single-use: once the server has spent one during
   * siteverify, a retry with the same token fails as `timeout-or-duplicate`.
   *
   * This is the only channel that resets the widget. An earlier version also
   * reset from a `disabled` prop, which fired on mount and threw away the
   * token the widget had just issued, and fired again alongside this signal
   * after a failed submit — so every rejection rendered two challenges in a
   * row and the applicant never saw why their answer was rejected.
   */
  resetSignal?: number;
}

/**
 * Cloudflare Turnstile, rendered explicitly.
 *
 * The leader form relies on Turnstile's automatic scanning of `.cf-turnstile`
 * elements. That does not work here: this component mounts after Astro
 * hydrates, so auto-render has already swept the document. `?render=explicit`
 * plus a manual `turnstile.render()` is the reliable path from React.
 */
export default function Turnstile({ onToken, resetSignal = 0 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);

  // Keep the latest callback without re-rendering the widget on every change.
  onTokenRef.current = onToken;

  useEffect(() => {
    let cancelled = false;

    const mount = () => {
      if (cancelled || !containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current !== null) return;

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        theme: 'auto',
        callback: (token: string) => onTokenRef.current(token),
        'expired-callback': () => onTokenRef.current(null),
        'error-callback': () => onTokenRef.current(null),
        'timeout-callback': () => onTokenRef.current(null)
      });
    };

    if (window.turnstile) {
      mount();
    } else {
      let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

      if (!script) {
        script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.src = SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }

      script.addEventListener('load', mount);
      // Blocked by an extension or ad blocker: surface it instead of hanging.
      script.addEventListener('error', () => onTokenRef.current(null));
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  // The server spent the previous token, so a new challenge is required.
  // Skipped when `resetSignal` is 0 so the widget is left alone on first mount:
  // resetting there would discard the token it is about to hand back.
  useEffect(() => {
    if (resetSignal === 0 || !window.turnstile || widgetIdRef.current === null) return;
    window.turnstile.reset(widgetIdRef.current);
    onTokenRef.current(null);
  }, [resetSignal]);

  return (
    <div className="min-h-[70px] rounded-2xl border border-dashed border-slate-300 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-950">
      <div ref={containerRef} />
    </div>
  );
}
