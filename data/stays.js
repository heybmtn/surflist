// data/stays.js — Newquay seed (real businesses, Aug 2026)
// Facet field: stayType (string) — Camp / Hostel / Eco-pod / Campervan
window.LISTINGS = [
  {
    name: "Base Surf Lodge",
    country: "United Kingdom",
    region: "Cornwall",
    town: "Newquay",
    url: "https://basesurflodge.co.uk",
    blurb: "Hosted surf camp overlooking Fistral — small groups, daily coaching with video analysis, breakfast and a garden BBQ.",
    image: "",
    verified: true,
    socials: {
      instagram: "basesurflodge_newquay",
      facebook: "basesurflodge"
    },
    stayType: "Camp",
    // verified-only fields below
    description:
      "Run by hosts Rob and Lou, Base Surf Lodge has been offering the surfer's life in Newquay since 2009. It sits a five-minute walk from both Fistral and Towan, with dorm-style rooms sleeping two to six and panoramic views over the bay. Camps combine daily two-hour lessons — with video analysis and a strong focus on individual progression — a healthy breakfast each morning and a communal garden barbecue, making it a sociable, welcoming base for beginners through to improving intermediates. Boards and wetsuits are yours to use for the length of your stay.",
    streetAddress: "20 Tower Rd, Newquay TR7 1LR",
    lat: 50.4163556,
    lng: -5.0897429,
    priceRange: "££"
  },
  {
    name: "Newquay International Backpackers",
    country: "United Kingdom",
    region: "Cornwall",
    town: "Newquay",
    url: "https://backpackers.co.uk",
    blurb: "Long-established, homely hostel in the heart of town with secure board storage, free breakfast and a sociable vibe.",
    image: "",
    verified: false,
    socials: {
      facebook: "NewquayBackpackers"
    },
    stayType: "Hostel"
  },
  {
    name: "Breakwater Hostel",
    country: "United Kingdom",
    region: "Cornwall",
    town: "Newquay",
    url: "https://www.breakwaterhostel.com",
    blurb: "Friendly budget backpackers near Fistral with cheap board hire, comfy dorms and good communal space.",
    image: "",
    verified: false,
    socials: {},
    stayType: "Hostel"
    // NOTE: Google lists Breakwater at the same Tower Rd address/phone as Newquay
    // International Backpackers, but they run separate sites. Confirm they're distinct
    // before publishing both.
  },
  {
    name: "Elemental Surf Lodge",
    country: "United Kingdom",
    region: "Cornwall",
    town: "Newquay",
    url: "https://elementalsurflodge.com",
    blurb: "Budget surf lodge between Towan and Fistral with its own on-site surf academy and rooms sleeping one to eight.",
    image: "",
    verified: false,
    socials: {
      instagram: "elementalsurflodge"
    },
    stayType: "Hostel"
  }
];
