// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
	// The domain GitHub Pages actually serves, and the one the Worker's
	// ALLOWED_ORIGINS expects. This used to point at gharbiya.hackclub.com,
	// which no longer resolves, so every <loc> in sitemap-0.xml and the
	// Sitemap: line in robots.txt pointed at a dead host.
	site: 'https://gharbiyahc.org',
	integrations: [tailwind(), sitemap(), react()],
});
