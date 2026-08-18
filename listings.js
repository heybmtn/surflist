/* ============================================================
   YOUR LISTINGS  —  this is the only file you edit to add one.
   Copy a block, change the details, save, redeploy. Done.

   Fields:
     name    (required)  the school's name
     country (required)  used to build the country buttons
     region  (required)  used to build the region buttons
     town                shown under the name
     url                 link to their website ("Visit" button)
     levels              any of: Beginner, Intermediate, Advanced, Kids
     blurb               one line about them

     image               photo URL. Leave "" and a placeholder is shown.
     verified            true = a "Surflist verified" tag + pinned to the top.
     socials             only the ones you fill in are shown. Supported:
                         instagram, facebook, tiktok, youtube, x

   Verified-only (these power each verified listing's own /schools/<slug>/
   page and its schema — free listings don't need them):
     description         a fuller paragraph shown on the listing's page
     streetAddress       street line for the address + schema
     lat, lng            coordinates (numbers) for the geo schema
     priceRange          e.g. "€€" or "££" — shown and added to schema
   ============================================================ */


window.LISTINGS = [
  {
    name: "Newquay Surf School",
    country: "United Kingdom",
    region: "Cornwall",
    town: "Newquay",
    url: "https://example.com/newquay",
    levels: ["Beginner", "Intermediate", "Kids"],
    blurb: "Fistral Beach lessons in the UK's surf capital.",
    description:
      "Newquay Surf School teaches on Fistral Beach, the heart of the UK's surf scene. Level-1 group lessons run every morning through the season with all equipment provided and qualified, lifeguard-trained coaches. It's an easy, welcoming first step into cold-water surfing, with progression courses for those ready to move beyond the whitewater.",
    streetAddress: "Fistral Beach, Headland Road",
    lat: 50.4165,
    lng: -5.1004,
    priceRange: "££",
    image: "",
    verified: true,
    socials: {
      instagram: "https://instagram.com/example",
      tiktok: "https://tiktok.com/@example",
    },
  },
];
