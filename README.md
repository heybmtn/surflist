# surflist

A simple, static surf-school directory. Pick a country, then a region, and the
matching listings show underneath. No framework, no build step — just three
files that Cloudflare Pages serves as-is.

```
index.html     the page (markup, styles, and filter logic — all in one file)
listings.js    your listings — THIS is the only file you edit day to day
favicon.svg    the little wave icon
```

## Add or edit a listing

Open `listings.js` and copy one block inside the list, then change the details:

```js
{
  name: "Your Surf School",
  country: "Portugal",          // becomes a country button
  region: "Algarve",            // becomes a region button under that country
  town: "Sagres",
  url: "https://theirsite.com",
  levels: ["Beginner", "Intermediate"],   // any of: Beginner, Intermediate, Advanced, Kids
  blurb: "One friendly line about them.",
},
```

Save the file. The country and region buttons build themselves from whatever is
in the list — add a school in a new country and its button just appears. Then
redeploy (below). That's the whole workflow.

## Preview it locally

Because the page loads `listings.js`, open it through a tiny local server rather
than double-clicking the file:

```bash
cd surflist-pages
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy to Cloudflare Pages

**Option A — drag and drop (fastest)**
1. Go to the Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
2. Name the project (e.g. `surflist`), drag in the `surflist-pages` folder, and **Deploy**.
3. To update later, edit `listings.js` and upload the folder again.

**Option B — connect a Git repo (auto-deploys on every push)**
1. Push this folder to a GitHub/GitLab repo.
2. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Pick the repo. Leave **Build command** empty and **Build output directory** as `/` (it's already static).
4. Every time you commit a change to `listings.js`, Cloudflare rebuilds and publishes automatically.

## Point surflist.co at it

In the Pages project: **Custom domains** → **Set up a domain** → enter `surflist.co`.
If the domain's DNS is already on Cloudflare, it's wired up automatically with a
free SSL certificate.

## Where to go next (only if you want to)

- **Photos:** add an `image` URL per listing and drop an `<img>` into the item template.
- **Search box:** the data's already in the page — a text filter is ~15 lines.
- **Spreadsheet editing:** if hand-editing `listings.js` gets old, the list can be
  generated from Airtable or a Google Sheet at deploy time without changing the page itself.
