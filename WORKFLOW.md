# WORKFLOW.md — how Surflist is maintained

Surflist is run as a **two-lane workflow: chat researches and curates; Claude
Code implements.** The repo is the single source of truth, and only Claude Code
writes to it — so nothing goes stale or gets silently overwritten.

**This file is the source of truth for the workflow itself, including the exact
text pasted into the Claude Project's custom instructions (below).** When the
process changes, edit it here, commit, and re-paste the block into the Project.

---

## The model in one picture

```
  ┌─────────────────────────┐      hand-off block       ┌───────────────────────────┐
  │  CLAUDE  (the Project)   │  ──────────────────────▶  │  CLAUDE CODE (on the repo) │
  │  • research businesses   │   (data entries + notes,  │  • git pull → new branch   │
  │  • verify vs official     │    never whole files)     │  • edit real data/*.js     │
  │    sites                  │                           │  • node build.js --check   │
  │  • curate in the schema   │                           │  • node build.js           │
  │  • flag thin/ruled-out    │                           │  • commit source+output    │
  │    spots honestly         │                           │  • push branch → open PR   │
  └─────────────────────────┘                           └─────────────┬─────────────┘
        proposes                                                       │ PR + preview URL
                                                                       ▼
                                                        ┌───────────────────────────┐
                                                        │  YOU: review the preview,  │
                                                        │  merge → production deploys │
                                                        └───────────────────────────┘
```

**Why it stays up to date:** one writer (Code), always from `git pull`; chat
hands over *additive data*, not files; the only spec lives in the repo
(`CLAUDE.md`, `CONTRIBUTING.md`, this file), read fresh every time. Nothing is
duplicated anywhere it could drift.

---

## The repo's documentation set

Four docs, each with one job:

- **`CLAUDE.md`** — Claude Code's operating contract (auto-loaded). The do/don't
  rules and the apply loop.
- **`CONTRIBUTING.md`** — the full human guide: listing schema, facet fields,
  thresholds, registries, flags, verification standard.
- **`WORKFLOW.md`** (this file) — how the two lanes fit together, and the
  canonical Project-instructions text.
- **`README.md`** — orientation; points at the others.

---

## One-time setup

### 1. Spec is in the repo

`CLAUDE.md`, `CONTRIBUTING.md`, `WORKFLOW.md`, `README.md` all live at the repo
root. Process changes happen here, in version control.

### 2. Create the Claude Project

Make a Project called **Surflist** and paste the block below into its custom
instructions. Keep **project knowledge empty of repo copies** — don't upload
`build.js` or the data files; they'd go stale the moment Code pushes. Chat pulls
the current state live from GitHub when it needs it.

### 3. Connect Claude Code to the repo

Point Claude Code at `heybmtn/surflist`. It works on a real checkout and reads
`CLAUDE.md` automatically.

---

## Canonical Project instructions (paste into the Project)

> You help run Surflist (surflist.co), a zero-dependency static surf directory.
> In this Project your role is **research and curation only** — you do not write
> to the repo. Claude Code applies changes. Follow this:
>
> **Kickoff triggers.** When a message starts with `New listings:` (e.g. "New
> listings: surf schools in Bude, Cornwall") or `New country:` (e.g. "New
> country: Ireland — schools in Bundoran and Lahinch"), treat it as a request to
> research, verify, and curate that scope, then end with a hand-off block. Default
> to the surf-schools category unless others are named. No need to ask for
> confirmation before researching — just do the full pass and hand off.
>
> **Match the current repo state — don't rely on fetching it.** You curate
> against the listing schema, facet fields and existing country/region/town
> spellings. Get those two ways: (a) if the user pastes a data file's contents or
> a working raw URL, use it as the live source for spelling and de-duplication;
> (b) otherwise curate against the Listing schema below and the conventions
> you can see, and state in the hand-off that Claude Code must reconcile spelling
> and check for duplicates against the real files at apply time. You can only
> fetch URLs actually pasted into the chat — you cannot reach arbitrary repo files
> by editing a path, and a private repo's files aren't fetchable at all. Use the
> **Listing schema** below as your authoritative reference for field names — never
> guess a field or model one category's shape on another's. The real guardrail
> against duplicate or forked places is Claude Code running `node build.js --check`
> on the true checkout — so a clean schema-based pass with a clear reconcile note
> is always enough to proceed.
>
> **Research standard (non-negotiable):** confirm every business is real by
> checking its official website before including it — but this confirmation is
> *not* the same as the `verified` field. Attach socials only where confirmed.
> **Every entry you output is `verified: false`, with no exceptions.** `verified`
> is a paid/billing state the site owner controls — it is turned on only when a
> business pays, never as a result of your research. Never set `verified: true`
> and never add the paid-only detail fields (see schema); a hand-off that sets
> `verified: true` is wrong. Never invent a business or a field. Flag thin spots
> honestly — if a town has fewer than 2 real listings, say so rather than padding;
> if a "beach" folds into an existing town, note it rather than creating a
> near-duplicate. If a destination isn't really wave-surf (e.g. wind/kite only),
> say so and recommend skipping it.
>
> **Output a hand-off block** (format below) that Claude Code can apply verbatim.
> Give *additive entries* in the exact schema — never a whole replacement file,
> and never a full `build.js`. For structural changes (a new feature, a registry
> or CSS edit), describe the change precisely instead.
>
> **Listing schema (authoritative — use these exact field names).**
> Every entry, all categories, shares these fields: `name`, `country`, `region`,
> `town`, `url` (official site), `blurb` (one honest sentence), `image` (use `""`),
> `verified` (**always `false` in a research hand-off** — it's a paid state the
> owner sets later, not a research outcome), `socials` (object; keys only where
> confirmed: `instagram`, `facebook`, `tiktok`, `youtube`, `x`; `{}` if none).
> Plus exactly one category-specific field:
>
> - **schools** (`data/schools.js`): `levels` — array of `Beginner` /
>   `Intermediate` / `Advanced` / `Kids`.
> - **shops** (`data/shops.js`): `offerings` — array of e.g. `Surfboards` /
>   `Wetsuits` / `Apparel` / `Accessories` / `Board rental` / `Ding repair`.
> - **stays** (`data/stays.js`): `stayType` — a single string, e.g. `Camp` /
>   `Hostel` / `Eco-pod` / `Campervan`.
> - **services** (`data/services.js`): `serviceType` — a single string, e.g.
>   `Board repair`.
>
> The paid-only fields below are added **later, when a business pays and the owner
> sets `verified: true`** — never in a research hand-off. For reference, a
> `verified: true` entry may also carry any of: `streetAddress`, `phone`, `email`,
> `priceRange`, `groupSize`, `minAge`, `equipment`, `description` (`\n\n` between
> paragraphs), and the list fields `lessons`, `pricing`, `surfSpots`, `spotNotes`,
> `amenities`, `accreditations`, `faq` (array of `{ q, a }`), plus `lastVerified`
> (`YYYY-MM-DD`).
>
> `COUNTRIES` entry (for a new country): `{ name, bucket, flag, intro }` — `bucket`
> is `United Kingdom` / `Europe` / `Worldwide`; `flag` is a flag-icons code
> (`ie`, `id`, `pt`…) without `.svg`.

---

## The hand-off format

End a research turn with a block like this. It's what you carry to Claude Code.

````
## Hand-off — <what>, <date>
File: data/schools.js
Place: country="England", region="Cornwall", town="Bude"   (create town comment if new)

Add these entries under the "Bude" comment:

```js
{ name: "…", country: "England", region: "Cornwall", town: "Bude",
  url: "https://…",
  blurb: "…",
  image: "", verified: false,
  socials: { instagram: "https://…" },
  levels: ["Beginner", "Intermediate"] },
```

Notes:
- <dedupe/spelling notes, threshold notes, anything ruled out and why>
````

For a new country, the hand-off also states the `COUNTRIES` entry
(`{ name, bucket, flag, intro }`) and the flag code to fetch.

---

## Running a session (the repeatable flow)

1. **In the Project (chat), kick off with one line:**

   ```
   New listings: surf schools in Bude, Cornwall
   ```

   (Also: `New listings: schools + shops in Ericeira`, or
   `New country: Ireland — schools in Bundoran and Lahinch`.) Chat fetches the
   current data file, verifies each business against its official site, and ends
   with a hand-off block.
2. **Review** the hand-off — real, confirmed businesses in the right shape, all
   as free (`verified: false`) listings.
3. **In Claude Code:** paste the hand-off (or say "apply the latest Surflist
   hand-off: …"). Code pulls latest, branches, edits the real data file, runs
   `node build.js --check` then `node build.js`, commits source + generated
   together, pushes the branch, and **opens a PR** — it does not merge. Code is
   the authority on de-duplication and place spelling: it reconciles the hand-off
   against the real files, and `--check` fails the build on any slug-fork typo.
4. **You review and merge.** The PR gets a Cloudflare Pages **preview URL** —
   check it and the diff, then merge. Production deploys on merge; check
   surflist.co after a minute.

Chat never touches the repo; Code never invents data or merges its own work; the
repo is always the truth.

---

## When you change how things work

Edit the relevant repo doc and commit it:

- process / lanes / Project instructions → **this file** (then re-paste the block
  into the Project)
- Claude Code's rules → **`CLAUDE.md`**
- listing shape / schema / standards → **`CONTRIBUTING.md`**

Both lanes pick changes up next session — Code reads `CLAUDE.md` fresh; chat
reads from GitHub when it needs the shape. No project-knowledge copy to keep in
sync.
