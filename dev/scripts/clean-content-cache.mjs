/**
 * Removes Astro's content-layer data store.
 *
 * The store caches parsed frontmatter per file. If a content file changes
 * underneath a running dev server (a `git checkout`, a branch switch, a mass
 * find-and-replace) the cached entry can survive the change and the page reads
 * stale frontmatter. That is how `/team` started throwing "season undefined":
 * `season:` had been added to the member files in an earlier commit, but the
 * cache kept the pre-`season` frontmatter for every file that had not been
 * touched since. The build was fine because it ran with a cold cache, which is
 * exactly why the bug was so confusing.
 *
 * Deleting the store costs a re-parse of a couple of dozen small markdown files
 * (tens of milliseconds), so it is wired into `predev` and `prebuild`. Generated
 * types in `.astro/` are left alone so start-up stays fast.
 */
import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const stores = [
  '.astro/data-store.json',
  'node_modules/.astro/data-store.json'
];

let removed = 0;

for (const relative of stores) {
  const target = path.join(projectRoot, relative);
  try {
    await rm(target, { force: true });
    removed += 1;
  } catch (error) {
    console.warn(`[clean-content-cache] could not remove ${relative}: ${error.message}`);
  }
}

if (removed > 0) {
  console.log('[clean-content-cache] cleared stale content cache');
}