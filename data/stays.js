/* ============================================================
   SURF ACCOMMODATION  —  edit this file, then run `node build.js`.
   Category facet: `stayType`  (one of: Camp, Hostel, Eco-pod, Campervan)
   Shared + verified-only fields: see README.md
   ============================================================ */
window.LISTINGS = [
  {
    name: "Fistral Surf Camp",
    country: "United Kingdom",
    region: "Cornwall",
    town: "Newquay",
    url: "https://example.com/fistralcamp",
    stayType: "Camp",
    blurb: "Week-long surf-and-stay packages by the beach.",
    description:
      "Fistral Surf Camp bundles accommodation, daily coaching and board hire into week-long packages a few minutes from the beach. Dorm and private rooms, shared kitchen and evening socials make it an easy option for solo travellers and small groups learning to surf.",
    streetAddress: "8 Pentire Avenue",
    lat: 50.4147,
    lng: -5.1002,
    priceRange: "££",
    image: "",
    verified: true,
    socials: {
      instagram: "https://instagram.com/example",
    },
  },
  {
    // FREE LISTING EXAMPLE — a hostel
    name: "Bay Backpackers",
    country: "United Kingdom",
    region: "Cornwall",
    town: "Newquay",
    url: "https://example.com/baybackpackers",
    stayType: "Hostel",
    blurb: "Budget beds a short walk from Towan Beach.",
    image: "",
    verified: false,
    socials: { instagram: "https://instagram.com/example" },
  },
  {
    // FREE LISTING EXAMPLE — eco-pods
    name: "Wild Pods Cornwall",
    country: "United Kingdom",
    region: "Cornwall",
    town: "St Agnes",
    url: "https://example.com/wildpods",
    stayType: "Eco-pod",
    blurb: "Off-grid pods above the St Agnes reefs.",
    image: "",
    verified: false,
    socials: {},
  },
];
