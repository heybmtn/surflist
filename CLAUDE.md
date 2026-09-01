# CLAUDE.md — operating guide for Claude Code

You are the **only writer to this repo.** Research and curation happen in Claude
chat; your job is to apply changes to the real files, build, and ship. Work
carefully and additively.

Surflist is a zero-dependency Node static site generator. `build.js` reads the
data files and generates every HTML page. Full human guide: **CONTRIBUTING.md**.
How the chat + Code lanes fit together: **WORKFLOW.md**.

## Non-negotiables

1. **Never hand-edit generated HTML.** All `.html` files, `sitemap.xml`,
   `robots.txt`, `llms.txt`, `search.json` and the `<country>/<region>/<town>/…`
   tree are generated. `node build.js` overwrites them. Only edit `data/*.js`,
   and — when a task truly requires it — `build.js` / `styles.css` / `search.js`.
2. **Always work from the latest.** `git pull` (or ensure a clean, current
   checkout) before you touch anything. Never apply a change onto a stale tree.
3. **Never replace a whole file from a paste.** Especially `build.js`. Make
   targeted, minimal edits against the real current file. A chat hand-off gives
   you *entries to add* or *a change to make* — you locate the spot in the actual
   file and edit in place. This is the rule that prevents silently wiping work.
4. **Commit source and generated output together**, in one commit. Never commit
   source without the rebuilt pages, or a hand-edit to a generated page.
5. **Never invent data.** If a hand-off is missing a field, leave it out — do not
   fill it with a plausible guess. Preserve `verified` exactly as specified.
6. **Ship via PR, never straight to `main`.** Work on a branch, push it, and open
   a pull request. The human reviews and merges. Never push to `main`, and never
   merge your own PR.

## The standard loop (every task)

Work on a branch and open a PR — `main` is the production branch and merging is
the human's call.

```bash
git checkout main && git pull
git checkout -b add/bude-schools     # branch name: <verb>/<place>-<category>
# …make the edit (see below)…
node build.js --check     # place-integrity: fails on slug-fork typos, listing-slug collisions, missing country codes / flag files; flags thin towns
node build.js             # regenerates every page from the data
git add -A                # source + regenerated output — one commit
git commit -m "…"         # see convention below
git push -u origin add/bude-schools
gh pr create --title "…" --body "…"   # open the PR; do NOT merge it yourself
```

If `--check` reports a collision, fix the spelling before building. `build.js` has
no built-in link or JSON-LD validator — after building, spot-check any new or
changed pages in the browser (or a link checker) before committing. Cloudflare Pages
builds a **preview deployment** for the PR (its own preview URL) and deploys
production only when the PR is merged to `main`.

## Applying a hand-off from chat

A hand-off names a data file, the exact `country`/`region`/`town` spelling, and
one or more listing entries. To apply it:

1. Open the real `data/<file>.js` and find the `// ---- <Town> ----` comment.
   Create it if the town is new. Match existing `country`/`region`/`town`
   spelling **exactly** — a typo forks a duplicate place.
2. Insert the entries additively. Don't reorder or rewrite existing entries; the
   build sorts output.
3. Run the loop on a branch and open a PR. Confirm the new town/region/country
   appears (or, if under the 2-listing threshold, note that its hub is
   intentionally suppressed). In the PR body, list what was added and flag
   anything thin or ruled out.

If a hand-off describes a **blog post**, add it to `data/blog.js` (copy an
existing post). Don't invent listing facts; link to directory pages instead.

If a hand-off describes a **structural change** (a new feature, a registry edit,
CSS), make the minimal edit to the real `build.js` / `styles.css` — never paste a
whole replacement file.

## Where things live

Data files and their one category-specific ("facet") field:

| File               | Facet field   | Type   |
| ------------------ | ------------- | ------ |
| `data/schools.js`  | `levels`      | array  |
| `data/shops.js`    | `offerings`   | array  |
| `data/stays.js`    | `stayType`    | string |
| `data/services.js` | `serviceType` | string |
| `data/blog.js`     | `tags`        | array  |

Registries near the top of `build.js`:

- **`COUNTRIES`** — `{ name, bucket, flag, intro }`. `bucket` is a homepage group
  (`United Kingdom` / `Europe` / `Worldwide`), never a URL segment. `name` must
  match the `country` on listings exactly. `flag` is a `/flags/` filename without
  `.svg`.
- **`REGIONS`** — `{ name, intro }`, optional; gives a region a proper intro.
- **`TOWN_CONTENT`** — keyed by `"<country-slug>/<region-slug>/<town-slug>"`;
  optional `intro` / `beaches` / `whenToSurf` / `faq`. Omitted fields render as
  HTML-comment placeholders. FAQ emits `FAQPage` schema.
- **`data/blog.js`** — posts (`title`, `slug`, `date`, `description`, `blurb`,
  `tags`, `body`). Builds `/blog/` and `/blog/<slug>/`. Link towns that already
  have a hub; do not invent listing facts in a post.

Thresholds: a town hub needs **≥2 listings**; a town+category page needs **≥2 in
that category**. Homepage "popular towns" = top 8 by listing count; "latest
listings" = a random 8 from every category. Every surf school gets a listing
page at `/surf-schools/<slug>/`; `verified` is a paid badge, not the gate for
having a school page. Duplicate school names are disambiguated with a town
suffix; `--check` fails if two listing paths would still collide.

## Flags (new country)

```bash
curl -sfL "https://raw.githubusercontent.com/lipis/flag-icons/main/flags/4x3/<code>.svg" -o flags/<code>.svg
```

Then set `flag: "<code>"` in the `COUNTRIES` entry and **commit the SVG**
(`git add -A` covers it). UK nations use `gb-eng` / `gb-sct` / `gb-wls`.
`/flags/` survives the build.

## `verified` is a paid state — never set it from research

Every listing from a research hand-off is `verified: false`, always. `verified:
true` is a paid/billing state the site owner controls: set it only when the human
explicitly tells you a specific business has paid (and then add the paid-only
detail fields). **Having a school page does not require `verified: true`** —
every school already gets `/surf-schools/<slug>/`. A research or new-listings
hand-off must never arrive with `verified: true` — if one does, treat it as an
error and apply the entry as `verified: false`. Never attach socials or details
the hand-off didn't provide.

## Commit message convention

Short, specific, what-and-where:

- `Add 4 surf schools in Bude, Cornwall`
- `Add Ireland (country + flag) with Bundoran + Lahinch schools`
- `Fill Newquay town editorial (beaches, when-to-surf, FAQ)`

**PR title** uses the same style. **PR body** lists what was added, notes the
sources were verified against official sites, and flags anything thin or ruled
out. Leave the PR for the human to review and merge — never self-merge.

## Preview (optional)

```bash
node build.js && python3 -m http.server 8000   # http://localhost:8000
```
