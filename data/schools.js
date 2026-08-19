/* ============================================================
   SURF SCHOOLS  —  edit this file, then run `node build.js`.
   Category facet: `levels`  (any of: Beginner, Intermediate, Advanced, Kids)

   Shared fields (every listing): name, country, region, town, url,
     blurb, image ("" = auto placeholder), verified (true/false), socials
     { instagram, facebook, tiktok, youtube, x }.
   Verified-only (adds a /surf-schools/<slug>/ page + schema):
     description, streetAddress, lat, lng, priceRange.
   Full docs: see README.md
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
  {
    // FREE LISTING EXAMPLE — swap for a real school and set your own fields.
    name: "Croyde Bay Surf School",
    country: "United Kingdom",
    region: "Devon",
    town: "Croyde",
    url: "https://example.com/croyde",
    levels: ["Beginner", "Kids"],
    blurb: "Family-friendly beach-break lessons in North Devon.",
    image: "",
    verified: false,
    socials: {
      instagram: "https://instagram.com/example",
      facebook: "https://facebook.com/example",
    },
  },
];
