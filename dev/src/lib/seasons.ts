/**
 * Single source of truth for seasons.
 *
 * Every season-aware page reads from here, so starting a new season is a data
 * change plus one new page rather than a hunt through the codebase for
 * hardcoded "Season 5" strings.
 */

export type SeasonStatus = 'archived' | 'current' | 'upcoming';

export interface Season {
  /** Numeric season, matches the `season` field on content entries. */
  number: number;
  /** URL segment, also the directory under `src/pages/`. */
  slug: string;
  /** Short label for nav and badges. */
  label: string;
  /** Display range, e.g. "2025 – 2026". */
  years: string;
  /** Human dates the season actually ran. */
  period: string;
  status: SeasonStatus;
  /** Two brand colours for the gradient headline, fed to `theme.util.gx`. */
  gradient: [string, string];
  /** One-line summary used on the archive index. */
  summary: string;
}

/** The season the club is currently running. Bump this once a year. */
export const CURRENT_SEASON = 6;

/**
 * The season whose bootcamps, workshops, and events the live pages feature.
 *
 * Leadership and achievements are separate concerns: the club is led by the
 * Season 6 team today, but Season 6 has no published work yet. Pointing this at
 * Season 5 keeps the home page, /bootcamps, and /events showing real numbers
 * instead of zeros while the new season is still empty.
 *
 * Once Season 6 has its first bootcamp or event, set this back to CURRENT_SEASON
 * and the pages will follow automatically. Leave it alone otherwise.
 */
export const SHOWCASE_SEASON = 5;

/**
 * Newest first. Adding a season means adding an entry here — do not renumber
 * existing ones, the numbers are permanent and are used in content frontmatter.
 */
export const SEASONS: Season[] = [
  {
    number: 6,
    slug: '2026-2027',
    label: 'Season 6',
    years: '2026 – 2027',
    period: 'Started October 2026',
    status: 'current',
    gradient: ['orange', 'red'],
    summary: 'The current season. Building on what Season 5 shipped, starting from an empty page.'
  },
  {
    number: 5,
    slug: '2025-2026',
    label: 'Season 5',
    years: '2025 – 2026',
    period: 'November 2025 – July 2026',
    status: 'archived',
    gradient: ['yellow', 'orange'],
    summary:
      'Four bootcamps, four workshops, and four events. The season the club reached Level 3.'
  }
];

export function getSeason(number: number): Season | undefined {
  return SEASONS.find((season) => season.number === number);
}

export function getCurrentSeason(): Season {
  const season = getSeason(CURRENT_SEASON);
  if (!season) {
    throw new Error(`CURRENT_SEASON is ${CURRENT_SEASON} but no matching entry exists in SEASONS.`);
  }
  return season;
}

export function getArchivedSeasons(): Season[] {
  return SEASONS.filter((season) => season.status === 'archived');
}

/** The season whose achievements the live pages feature. */
export function getShowcaseSeason(): Season {
  const season = getSeason(SHOWCASE_SEASON);
  if (!season) {
    throw new Error(`SHOWCASE_SEASON is ${SHOWCASE_SEASON} but no matching entry exists in SEASONS.`);
  }
  return season;
}

/**
 * True when the showcased season is not the one currently running.
 *
 * Both constants are literal types, so the comparison is widened explicitly —
 * otherwise TypeScript flags it once the two values differ.
 */
export function isShowcaseSeasonArchived(): boolean {
  return Number(SHOWCASE_SEASON) !== Number(CURRENT_SEASON);
}

/** Minimal shape shared by every season-tagged content collection. */
interface SeasonTagged {
  data: { season: number; date?: Date };
}

/** Filters any season-tagged collection down to one season, oldest first. */
export function bySeason<T extends SeasonTagged>(entries: T[], season: number): T[] {
  return entries
    .filter((entry) => entry.data.season === season)
    .sort((a, b) => {
      const aTime = a.data.date?.getTime() ?? 0;
      const bTime = b.data.date?.getTime() ?? 0;
      return aTime - bTime;
    });
}

/** Every entry in a collection that is not part of an archived season. */
export function withoutArchivedSeasons<T extends SeasonTagged>(entries: T[]): T[] {
  const archived = new Set(getArchivedSeasons().map((season) => season.number));
  return entries.filter((entry) => !archived.has(entry.data.season));
}
