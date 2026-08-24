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
> **Before curating any region,** fetch the current data file you'll be adding to
> from GitHub raw (e.g.
> `https://raw.githubusercontent.com/heybmtn/surflist/main/data/schools.js`) and
> the current `build.js` if you need the country/region/town lists. Curate
> against the real current state so you match existing spelling exactly and don't
> duplicate listings.
>
> **Verification standard (non-negotiable):** verify every business against its
> official website before including it. Attach socials only where confirmed.
> Default every entry to `verified: false`; only mark `verified: true` and add
> the detail fields when you've fully checked it. Never invent a business or a
> field. Flag thin spots honestly — if a town has fewer than 2 real listings, say
> so rather than padding; if a "beach" folds into an existing town, note it
> rather than creating a near-duplicate. If a destination isn't really wave-surf
> (e.g. wind/kite only), say so and recommend skipping it.
>
> **Output a hand-off block** (format below) that Claude Code can apply verbatim.
> Give *additive entries* in the exact schema — never a whole replacement file,
> and never a full `build.js`. For structural changes (a new feature, a registry
> or CSS edit), describe the change precisely instead.
>
> The listing schema, facet fields, thresholds, registries and flag workflow are
> in the repo's CONTRIBUTING.md — follow it as the source of truth for shape.

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
2. **Review** the hand-off — real, verified businesses in the right shape.
3. **In Claude Code:** paste the hand-off (or say "apply the latest Surflist
   hand-off: …"). Code pulls latest, branches, edits the real data file, runs
   `node build.js --check` then `node build.js`, commits source + generated
   together, pushes the branch, and **opens a PR** — it does not merge.
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
