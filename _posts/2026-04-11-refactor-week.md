---
date: 2026-04-11
layout: post
slug: refactor-week
title: "A week refactoring my static site: Jekyll, GitHub Pages, and the boring stuff that matters"
description: "What changed on wgma.ca in a focused refactor week—Jekyll 4, Actions, Pagefind, Astro, self-hosted fonts, and the config footguns that only show up in production."
categories:
- web
- tooling
tags:
- jekyll
- github-pages
- static-site
- pagefind
- astro
- seo
---

Personal sites are the perfect place to procrastinate productively. Over the last week I leaned into that and touched almost every layer of this repo: the Jekyll blog, the GitHub Actions pipeline, client-side search, fonts, contact, SEO, and the little Astro arcade that lives beside the main site. None of it is novel—it's a stack thousands of people run—but when it is *your* domain and *your* deploy, the details stick. Here is what I changed, how the build fits together, and what I would tell my past self before doing it again.

<!--more-->

## Why bother

A static personal site is not a startup. The goal is not scale; it is clarity. I wanted the blog to be easier to scan, search, and share; the `/work` page to reflect what I actually do without duplicating LaTeX-style resumes in three places; and the whole thing to feel a bit more intentional on slow connections and small screens. Refactors like this are also how I keep Jekyll and “classic” static hosting muscle memory warm next to day-job systems that move much faster.

## Stack snapshot

The public site is **Jekyll 4.x** (Ruby **3.3** in CI), deployed with **GitHub Pages** using the modern **artifact** flow—not the old “push a `gh-pages` branch by hand” pattern. The custom domain **wgma.ca** points at GitHub the usual way (DNS + repo settings); the repo name is still the classic `username.github.io` layout, which is fine.

Alongside Jekyll there is a small **Astro** app under `arcade/` for browser games. Jekyll’s config **excludes** that folder from its own build so the two tools do not step on each other. **Pagefind** builds a client-side search index from the generated HTML after both halves exist. That split—Jekyll for content, Astro for an interactive subtree, Pagefind layered on top—is the architectural picture worth keeping in your head.

## The build pipeline (order matters)

If you read one file to understand deploys, read `.github/workflows/pages.yml`. The sequence is deliberate:

1. **Resume data** — `python3 resume/parse_paste.py` turns a maintained paste/source into YAML the `/work` page consumes. Doing this *before* Jekyll means the site never renders stale employment bullets because someone forgot a manual edit.

2. **Jekyll** — `JEKYLL_ENV=production bundle exec jekyll build` produces `_site/` with posts under stable `/blog/...` URLs (`permalink: /blog/:year-:month-:day/:title` in `_config.yml`).

3. **Astro** — `npm install && npm run build` inside `arcade/`, then the workflow copies `arcade/dist` into `_site/arcade`. Visitors see one origin; crawlers see one sitemap story.

4. **Pagefind** — `npm ci && npm run pagefind` at the repo root. The npm script points Pagefind at `_site` and restricts the glob to `blog/**/*.html` so the index stays small and relevant instead of indexing every ancillary page.

5. **Upload + deploy** — GitHub’s `upload-pages-artifact` and `deploy-pages` actions publish the combined tree.

That ordering is the main “learning” for anyone merging multiple static generators: **who owns `_site/` and when** must be explicit, or you get races, overwrites, or “works locally, empty in CI.”

## Learnings and footguns

### `keep_files` and local `jekyll serve`

Pagefind writes under `_site/pagefind/`. Jekyll, on the other hand, likes a clean regenerate. Without `keep_files: [pagefind]` in `_config.yml`, every rebuild during `jekyll serve` can wipe the Pagefind bundle, and suddenly `/pagefind/*.js` 404s until you re-run the indexer. The comment in config is there because I hit exactly that. Production CI runs Pagefind once at the end, so it is fine—but **local search testing** is miserable until `keep_files` is set.

### Scoping Pagefind to the blog

The root `package.json` runs Pagefind with `--glob "blog/**/*.html"`. That is a feature, not a shortcut: search stays focused on long-form posts, the index stays lighter, and you avoid noisy hits from one-off pages. If you expand the glob later, expect larger downloads and more “why did this random page rank above my post?” moments.

### Self-hosted fonts

I moved to **self-hosted WOFF2** subsets and dropped the Google Fonts links. Tradeoffs are straightforward: you pay with repo size and your own caching headers, but you gain fewer third-party requests, more predictable layout (no FOUT from a remote stylesheet), and a slightly cleaner privacy story. The cost is operational—you own font updates and subsetting—but for a personal site that cost is tiny compared to chasing remote availability.

### SEO and metadata

Plugins like `jekyll-seo-tag` and `jekyll-sitemap` are doing the unglamorous work: Open Graph defaults, feed discovery, stable URLs. The site keeps blog posts under `/blog/...` so old links and RSS expectations stay sane. Per-post overrides (`description`, `image`) still beat defaults when a post is shared somewhere that actually shows a preview card.

### Contact without spam‑harvesting every page

Contact now runs through **Formspree** with the form id living in `_config.yml`. The UI can point people at a form instead of scattering `mailto:` everywhere. You still have email; you just choose where it appears. For a public repo, the id is visible—rotate it if you abuse-test your inbox—but that is the usual static-site compromise.

## What visitors actually see

Behind the pipeline is a simpler story: the **blog index** is a catalogue with consistent teasers and excerpts, posts show **reading time** and **related posts** where it helps, and **tags** have a proper home. **Solarized**-inspired light and dark themes landed with a small auto preference and a manual toggle so reading at night does not feel like staring into a flashlight. The **404** page and **accessibility** tweaks are the kind of changes nobody compliments out loud but everyone benefits from when they tab through focus order once.

Search is the flashiest feature: **Pagefind** powers client-side search from the blog toolbar, which fits the static hosting model—no server, no API keys, just a generated index shipped next to the HTML.

## Closing

If I did this week again, I would still separate Jekyll and Astro, still run Pagefind last, and still document `keep_files` the first time—not the third. What is left on the list is the usual static-site backlog: occasional content passes, keeping the resume parser honest, and resisting the urge to rewrite everything in the hot new meta-framework when Jekyll is doing exactly what it promises.

Thanks for reading; if you are also babysitting a decade-old personal domain, I hope one of these notes saves you an afternoon of “why does search work in CI but not on my laptop?”
