// data/shops.js — Newquay seed (real businesses, Aug 2026)
// Facet field: offerings (array) — e.g. Surfboards / Wetsuits / Apparel / Accessories
window.LISTINGS = [
  {
    name: "'The Temple of Fringe' Surf Shop",
    country: "United Kingdom",
    region: "Cornwall",
    town: "Newquay",
    url: "https://www.instagram.com/fringesurfshop/",
    blurb: "A tucked-away independent shop in Cribbar Yard trading in alternative surfcraft, old-school brands and subculture kit.",
    image: "",
    verified: true,
    socials: {
      instagram: "fringesurfshop"
    },
    offerings: ["Surfboards", "Wetsuits", "Apparel"],
    // verified-only fields below
    description:
      "Run by Stevo, the Temple of Fringe is a small, well-loved independent surf shop tucked into Cribbar Yard on Bank Street, opposite Millets. It specialises in alternative surfcraft, old-school brands and subculture surf and skate gear, and has built a reputation for knowledgeable, unhurried advice — the kind of place regulars travel back to. It trades primarily in-store and through Instagram rather than a full webshop.",
    streetAddress: "Cribbar Yard, Bank St, Newquay TR7 1EP",
    lat: 50.4134771,
    lng: -5.0859907,
    priceRange: "££"
  },
  {
    name: "10 Over Surf Shop",
    country: "United Kingdom",
    region: "Cornwall",
    town: "Newquay",
    url: "https://10oversurf.com",
    blurb: "Newquay-rooted online surf shop with click-and-collect nearby — hardware, wetsuits, apparel and surf-skate.",
    image: "",
    verified: false,
    socials: {
      instagram: "10oversurf",
      youtube: "10OverSurfShop"
    },
    offerings: ["Surfboards", "Wetsuits", "Apparel", "Accessories"]
    // NOTE: online shop, pickup unit is in Zelah (TR4 9JG), ~10 min from Newquay —
    // no Newquay-town storefront. Reclassify or adjust town if needed.
  },
  {
    name: "Ann's Cottage",
    country: "United Kingdom",
    region: "Cornwall",
    town: "Newquay",
    url: "https://www.annscottage.com",
    blurb: "Cornwall's original surf-and-lifestyle retailer since 1978 — wetsuits, hardware and 100-plus brands, with a Fistral Beach store.",
    image: "",
    verified: false,
    socials: {
      instagram: "annscottageofficial",
      facebook: "Annscottagesurf",
      x: "annscottagesurf"
    },
    offerings: ["Surfboards", "Wetsuits", "Apparel", "Accessories"]
    // NOTE: 14-store Cornwall chain; url is the brand site. Swap to the Fistral store
    // page if you'd rather link the specific Newquay location.
  },
  {
    name: "Fat Willy's Surf Shack",
    country: "United Kingdom",
    region: "Cornwall",
    town: "Newquay",
    url: "https://www.fatwillyssurfshack.co.uk",
    blurb: "Iconic Newquay surf-lifestyle brand since 1985 — tees, hoodies and accessories from its Fore Street flagship.",
    image: "",
    verified: false,
    socials: {
      instagram: "fatwillysnewquay",
      facebook: "FatWillysSurfShack",
      tiktok: "fatwillysnewquay"
    },
    offerings: ["Apparel", "Accessories"]
    // NOTE: apparel/lifestyle focus (not hardware). Distinct from the separate
    // "Fat Willy's Surf Shack Cornwall" (fatwillyscornwall.co.uk, East St + Falmouth).
  }
];
