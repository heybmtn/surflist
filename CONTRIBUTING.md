# Contributing to Surflist

This is the working guide for keeping Surflist (surflist.co) up to date — adding
surf schools, shops, stays and services, and wiring up new towns, regions and
countries. It lives in the repo so it's always next to the code it describes.

**What Surflist is:** a static directory of surf destinations. A Node script
(`build.js`) reads plain data files and generates every HTML page. No frameworks,
no database. You edit data, run one command, and commit.

You don't need to be a developer, but you do need to be comfortable with a text
editor (VS Code is fine), a terminal, and basic Git (`clone`, `pull`, `add`,
`commit`, `push`). Everything else is spelled out below.

---

## The three golden rules

Break these and you'll either lose work or publish broken pages. They come before
everything else.

1. **Never edit the generated HTML.** `index.html`, `surf-schools/index.html`,
   `england/cornwall/newquay/index.html` and every other `.html` file are
   **generated**. `node build.js` overwrites them on every run. You only ever
   edit the files in `data/` and — occasionally — `build.js` and `styles.css`.

2. **Always start from the latest repo.** `git pull` (or re-clone) before you
   edit. If you edit an old copy of `build.js` and then build, you silently wipe
   out changes made after your copy was taken. This has happened before. When in
   doubt, re-clone fresh.

3. **Commit source *and* generated files together.** After a build, commit both
   the files you changed **and** every page the build regenerated. Never commit
   source without the rebuilt pages, and never commit a hand-edit to a generated
   page. Source and output should always match.

---

## Setup and the workflow you repeat every time

First time only:

```bash
git clone https://github.com/heybmtn/surflist.git
cd surflist
```

Then, for every change, this is the loop — in order, no shortcuts:

```bash
git pull                    # 1. get the latest before editing anything

#                             2. make your edits in data/ (see below)

node build.js --check       # 3. integrity check FIRST — catches typos pre-ship
node build.js               # 4. build for real (only if --check passed)

python3 -m http.server 8000 # 5. preview at http://localhost:8000 (Ctrl+C to stop)

git add -A                  # 6. stage source + regenerated files + any new flags
git commit -m "Add 4 surf schools in Bude, Cornwall"
git push                    # 7. publish — Cloudflare Pages rebuilds on push
```

`git add -A` stages everything, including new flag SVGs and all regenerated HTML —
that's what you want. Give Cloudflare a minute or two after pushing, then check
surflist.co.

---

## Add or update a listing

### Places are *derived*, not created

There's no "towns" file and no "add a place" step. **A town, region or country
exists only because a listing points at it.** Add a school in a new town and that
town's hub page appears automatically; remove the last listing in a town and the
hub disappears. So "add a location" and "add a listing" are the same action:
append an entry to the right data file.

### Which file, and its one special field

| Adding a…                   | Edit                  | Special field                |
| --------------------------- | --------------------- | ---------------------------- |
| Surf school                 | `data/schools.js`     | `levels` (array)             |
| Surf shop                   | `data/shops.js`       | `offerings` (array)          |
| Place to stay               | `data/stays.js`       | `stayType` (string)          |
| Surf service (repair, etc.) | `data/services.js`    | `serviceType` (string)       |

Every entry lives inside `window.LISTINGS = [ ... ]`. The `// ---- Newquay ----`
comments are just for humans — group your entry under the right town comment or
add a new one. Order inside the array doesn't matter; the build sorts things.

### Tier 1 — a free listing (the common case)

Free listings show as a card that links out to the business. **Copy an existing
free entry from the same file** and change the details:

```js
{ name: "Business Name", country: "England", region: "Cornwall", town: "Bude",
  url: "https://theirofficialsite.com",
  blurb: "One honest, friendly sentence — what makes them worth a look.",
  image: "", verified: false,
  socials: { instagram: "https://www.instagram.com/them/" },
  levels: ["Beginner", "Intermediate", "Kids"] },   // <- special field for schools
```

Field by field:

- **`name`** — the business's real name.
- **`country`** — the real country: `England`, `Wales`, `Scotland`, `Portugal`,
  `Spain`, `France`. **Not** "United Kingdom" — that's only a homepage grouping,
  never a value you type here.
- **`region`** — e.g. `Cornwall`, `Algarve`, `Basque Country`. Match existing
  spelling **exactly** (see Troubleshooting on slug forks).
- **`town`** — the town/spot. Same exact-spelling rule.
- **`url`** — the business's **official website**. Only if they genuinely have no
  site, an official Instagram/Facebook page is an acceptable fallback.
- **`blurb`** — one sentence in the site's plain, honest voice. Describe what's
  true; don't hype.
- **`image`** — leave `""` for an automatic gradient placeholder. Only put a URL
  here if you have a real, usable image.
- **`verified`** — always `false` for research and free listings. `true` is a
  **paid state** the site owner sets when a business pays (see Tier 2), never a
  quality or research judgment.
- **`socials`** — only handles you've **confirmed** are theirs. Valid keys:
  `instagram`, `facebook`, `tiktok`, `youtube`, `x`. Omit any you can't verify;
  `{}` is fine.
- **the special field** — from the table above. Arrays for schools/shops, a
  single string for stays/services.

Special-field values in use:

- schools `levels`: `Beginner`, `Intermediate`, `Advanced`, `Kids`
- shops `offerings`: `Surfboards`, `Wetsuits`, `Apparel`, `Accessories`
  (also `Board rental`, `Ding repair`, etc. where true)
- stays `stayType`: `Camp`, `Hostel`, `Guesthouse`, `Hotel`, `Lodge`, `Resort`
  (single value, not an array — use the closest match rather than inventing a
  new one, so the type filter doesn't fragment)
- services `serviceType`: e.g. `Board repair`

### Tier 2 — a verified (paid) listing (gets its own page)

`verified: true` is the **paid upgrade**: the site owner sets it when a business
pays, and the business then earns its **own detail page** (e.g.
`/surf-schools/cornish-wave-surf-school/`) with rich schema markup for SEO and
LLMs. It is never set by research or as a reward for being well-checked — a new
listing, however thoroughly confirmed, always starts free (`verified: false`).
When you do upgrade a paid listing, the extra fields below are all optional; fill
what's accurate and leave out the rest. A real one to copy from:

```js
{ name: "Cornish Wave Surf School", country: "England", region: "Cornwall", town: "Newquay",
  url: "https://cornishwave.com",
  blurb: "Small-group surf coaching on Towan and Fistral from a long-running local school.",
  image: "", verified: true,
  socials: { instagram: "https://www.instagram.com/cornishwave/", facebook: "https://www.facebook.com/cornishwave" },
  levels: ["Beginner", "Intermediate", "Kids"],

  // --- extra fields that power the detail page (all optional) ---
  streetAddress: "40 Fore Street, TR7 1LP",
  phone: "01637 846523",
  email: "hello@cornishwave.com",
  priceRange: "£40–£489pp",
  groupSize: "Max 8 people per instructor",
  minAge: "8 (group lessons)",
  equipment: "Wetsuit & surfboard included",
  description: "A fuller two- or three-paragraph write-up.\n\nUse \\n\\n between paragraphs.",
  lessons:   [ "Group lesson — small groups, daily", "Private coaching — 1:1" ],
  pricing:   [ "Group lesson — £40pp", "Private lesson — from £110" ],
  surfSpots: [ "Towan Beach", "Fistral Beach" ],
  spotNotes: [ "Towan — sheltered, best around mid-tide.", "Fistral — more open Atlantic swell." ],
  amenities: [ "Changing rooms and lockers", "Parking within walking distance" ],
  accreditations: [ "ISA Level 2 qualified instructors", "8:1 max ratio" ],
  faq: [ { q: "What's the minimum age?", a: "8 for group lessons." } ],
  lastVerified: "2026-08-24" },
```

- **`lastVerified`** is the date (`YYYY-MM-DD`) you last checked the details
  against their site. It also drives homepage ordering (below), so keep it fresh.
- Paragraph breaks inside `description` are written as `\n\n`.
- Each list field (`lessons`, `pricing`, `surfSpots`, …) renders as its own
  section. Only include ones you have real content for.
- `lat` / `lng` are supported if you have exact coordinates, but aren't required.

### The verification standard (non-negotiable)

This is what keeps Surflist trustworthy:

- **Confirm the business is real before adding**, by checking its official
  website — but this is *not* the `verified` field. Never invent a business or
  guess details. Can't confirm it operates? Don't list it.
- **Socials only where confirmed.** Attach a profile only after checking it's
  really theirs.
- **Every listing starts `verified: false`.** `verified: true` is a paid state
  the owner sets when a business pays — never set it as a result of research,
  confirmation, or how complete the details are.
- **Flag thin spots honestly — don't pad.** If a town has only one real school it
  won't meet the hub threshold, and that's fine. Never invent a second listing to
  force a hub. If a "beach" is really part of an existing town, fold it into that
  town's slug rather than creating a near-duplicate.

---

## How listings reach the hub pages and the homepage

You don't place things on pages — the build derives it all from the data.

### Hub pages (the geographic tree)

```
/england/                                 country hub
/england/cornwall/                        region hub
/england/cornwall/newquay/                town hub   ← the key SEO page
/england/cornwall/newquay/surf-schools/   town + category page

/surf-schools/                            browse all schools
/surf-schools/cornish-wave-surf-school/   a verified school's own page
```

**Threshold rule:** a town hub only generates with **≥2 listings**, and a
town+category page only with **≥2 listings in that category** in that town. This
suppresses thin pages. Add a town's first listing and no hub appears yet; add a
second and it does.

### The homepage — both sections are automatic

- **Popular surf destinations** (town chips): the **top 8 towns by listing
  count**, then alphabetical. To feature a town, give it more listings.
- **Latest listings**: a random 8 drawn from **every listing in every
  category** (free and verified alike), reshuffled client-side on each page
  load. Verified listings show their blurb and a "Surflist verified" badge
  and link to their own page; free listings link straight out to the
  business's site. There's no `lastVerified`-based ordering or schools-only
  featuring — every listing has an equal chance of appearing.

There's no separate "homepage" list to edit — the homepage curates itself from
your data.

---

## Town editorial content ("Surfing in <town>")

Town hubs can carry editorial copy — an intro, a "best beaches" list, a
when-to-surf section and an FAQ — from the **`TOWN_CONTENT`** registry near the
top of `build.js`. Newquay and Ericeira are the worked examples. Keyed by URL
path (`<country-slug>/<region-slug>/<town-slug>`):

```js
"england/cornwall/newquay": {
  intro: "Optional — overrides the auto-generated intro.",
  beaches: [
    { name: "Fistral", note: "The town's marquee beach break — consistent, punchy, busy." },
    { name: "Watergate Bay", note: "Two miles of open sand just north of town." },
  ],
  whenToSurf: "Paragraph one.\n\nParagraph two.",
  faq: [
    { q: "Is Newquay good for beginners?", a: "Yes — Towan and Porth are sheltered options." },
  ],
},
```

Every field is optional. **What you provide renders; what you omit shows as an
HTML comment placeholder in the page source**, ready to fill later. The FAQ also
emits `FAQPage` schema. Only add local knowledge you can stand behind.

---

## Add a new region

Regions are discovered from the data automatically — using a new `region` value
is enough to create one. To give it a proper intro, add an entry to the
**`REGIONS`** array in `build.js`:

```js
{ name: "Devon",
  intro: "Surf schools, shops, places to stay and board repair across Devon." },
```

`name` must match the `region` value on the listings exactly. Skip it and the
region still works with a generic intro.

---

## Add a new country

Two parts: a registry entry and a flag file.

**A — the `COUNTRIES` registry in `build.js`:**

```js
{ name: "Ireland", bucket: "Europe", flag: "ie",
  intro: "Surf Ireland — the raw Atlantic swells of the west coast, from Bundoran to Lahinch." },
```

- **`name`** — must match the `country` value on the listings exactly.
- **`bucket`** — homepage group: `United Kingdom`, `Europe`, or `Worldwide`
  (grouping only, never a URL segment).
- **`flag`** — the flag filename **without** `.svg` (see next section).
- **`intro`** — the country hub's intro paragraph.

A country with no entry still works but defaults to "Worldwide" with a generic
intro, so always add the entry.

**B — the flag file:** fetch it into `/flags/` (next section) and **commit it**.
If the SVG isn't committed, the flag 404s after deploy.

---

## Flags

Flags are self-hosted SVGs in **`/flags/`** (no CDN — matching the site's
zero-dependency approach). They appear automatically next to a country's name on
the homepage, footer and country hub. Source: the public-domain **flag-icons**
project, `4x3` variant. To add one, from the repo root:

```bash
curl -sfL "https://raw.githubusercontent.com/lipis/flag-icons/main/flags/4x3/ie.svg" -o flags/ie.svg
```

- The **code** is the two-letter country code (`pt`, `es`, `fr`, `ie`).
- **UK nations use subdivision codes:** `gb-eng`, `gb-sct`, `gb-wls` — use these
  SVGs, not emoji (emoji subdivision flags don't render on Windows).
- The `COUNTRIES` `flag:` field is this code **without** `.svg` (e.g. `"ie"`).
- **Commit the new SVG** — `git add -A` covers it.

`/flags/` survives `node build.js`; the build's cleanup only removes generated
country/category directories, not static asset folders.

---

## Validate and ship

**`node build.js --check`** (run first): prints the full place tree with counts,
flags any town below the 2-listing threshold, and **fails (non-zero exit) if a
spelling typo has forked one place into two slugs**. Fix collisions before
building.

**`node build.js`**: regenerates the homepage, every hub, every verified page,
plus `sitemap.xml`, `robots.txt` and `llms.txt`. It does not validate internal
links or JSON-LD itself, so spot-check new or changed pages in the browser (or
a link checker) before committing.

Then commit both source and generated files and push; Cloudflare Pages rebuilds
on push.

---

## Troubleshooting

**Changes disappeared after building.** You edited a stale copy — `git pull`
before editing (Golden Rule 2).

**Flag not showing live.** The SVG in `/flags/` wasn't committed. `git status`
should list it; `git add -A`.

**A town appears twice, or `--check` reports a collision.** Two listings spell the
town/region differently ("St Ives" vs "St. Ives", a trailing space, etc.). Each
spelling becomes its own slug. Pick one spelling and make every listing match.

**A phantom "United Kingdom" country appeared.** A listing has
`country: "United Kingdom"`. Countries are real names (`England`, `Wales`,
`Scotland`); "United Kingdom" is only a homepage bucket. Fix the `country` value.

**An expected town hub is missing.** It has fewer than 2 listings — hubs below the
threshold are suppressed on purpose. Add a real second listing, or leave it.
Don't invent one.

**Edited an HTML file and nothing changed.** It's generated; the build overwrote
it. Edit the `data/` file or `build.js` instead (Golden Rule 1).

**Local preview 404s.** Serve it (`python3 -m http.server 8000` →
`http://localhost:8000`), don't open the HTML file directly. The site uses clean
directory URLs that need a server.

---

## Cheat sheet

**Loop:** `git pull` → edit `data/` → `node build.js --check` → `node build.js`
→ preview → `git add -A` → `commit` → `push`.

**Free listing:**

```js
{ name: "", country: "", region: "", town: "",
  url: "https://",
  blurb: "",
  image: "", verified: false,
  socials: {},
  levels: ["Beginner"] },   // schools; swap for offerings / stayType / serviceType
```

**Special field:** schools `levels:[…]` · shops `offerings:[…]` ·
stays `stayType:"…"` · services `serviceType:"…"`

**Country values:** England · Wales · Scotland · Portugal · Spain · France
(never "United Kingdom").

**Buckets:** United Kingdom · Europe · Worldwide.

**Hub threshold:** 2 listings for a town hub; 2 in a category for a town+category
page.

**Homepage is automatic:** popular towns = most listings; featured schools =
verified, most recent `lastVerified`.

**New flag:**
`curl -sfL "https://raw.githubusercontent.com/lipis/flag-icons/main/flags/4x3/<code>.svg" -o flags/<code>.svg`
→ `flag: "<code>"` in `COUNTRIES` → commit the SVG.
