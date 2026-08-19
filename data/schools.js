// data/schools.js — Newquay seed (real businesses, Aug 2026)
// Facet field: levels (array) — Beginner / Intermediate / Advanced / Kids
window.LISTINGS = [
  {
    name: "Cornish Wave Surf School",
    country: "United Kingdom",
    region: "Cornwall",
    town: "Newquay",
    url: "https://cornishwave.com",
    blurb: "Small-group surf coaching on Towan and Fistral from a friendly, long-running local school — plus coasteering and SUP.",
    image: "",
    verified: true,
    socials: {
      instagram: "https://www.instagram.com/cornishwave/",
      facebook: "https://www.facebook.com/cornishwave",
      youtube: "https://www.youtube.com/c/Cornishwave"
    },
    levels: ["Beginner", "Intermediate", "Kids"],
    // verified-only fields below
    description:
      "Cornish Wave has been teaching people to surf in Newquay since 2012. Sessions run in small groups (max eight) with Surfing England–qualified coaches who are also trained beach lifeguards, and the team picks between Towan and Fistral each day depending on conditions. Alongside surf lessons they run coasteering, kayak and paddleboard tours, surf camps and surf-and-yoga retreats, with all wetsuits and boards included. The base is on Fore Street in the centre of town, a short walk from both beaches, with changing rooms, hot showers and secure storage.",
    streetAddress: "40 Fore St, Newquay TR7 1LP",
    lat: 50.4151105,
    lng: -5.0871806,
    priceRange: "££"
  },
  {
    name: "Escape Surf School",
    country: "United Kingdom",
    region: "Cornwall",
    town: "Newquay",
    url: "https://www.escapesurfschool.co.uk",
    blurb: "Specialist surf-only school on the Towan cliff top, with ex-pro head coaches and daily lessons for every level.",
    image: "",
    verified: false,
    socials: {
      instagram: "https://www.instagram.com/escape.surf.school/",
      facebook: "https://www.facebook.com/EscapeSurfSchool"
    },
    levels: ["Beginner", "Intermediate", "Advanced", "Kids"]
  },
  {
    name: "Fistral Beach Surf School",
    country: "United Kingdom",
    region: "Cornwall",
    town: "Newquay",
    url: "https://www.fistralbeachsurfschool.co.uk",
    blurb: "Right on the sand at Fistral with one of the UK's largest surf-hire fleets — lessons for all abilities, open all year.",
    image: "",
    verified: false,
    socials: {
      instagram: "https://www.instagram.com/fistralbeachsurfschool/",
      facebook: "https://www.facebook.com/fistralbeachsurfschool"
    },
    levels: ["Beginner", "Intermediate", "Advanced"]
  },
  {
    name: "NQY Surf School",
    country: "United Kingdom",
    region: "Cornwall",
    town: "Newquay",
    url: "https://www.newquaysurfingschool.com",
    blurb: "Beach-front school on Great Western led by four-time UK champion Adam Griffiths — lessons, hire and coasteering.",
    image: "",
    verified: false,
    socials: {
      instagram: "https://www.instagram.com/nqysurfschool/",
      facebook: "https://www.facebook.com/nqysurfschool"
    },
    levels: ["Beginner", "Intermediate", "Kids"]
  },
  {
    name: "Westcountry Surf School",
    country: "United Kingdom",
    region: "Cornwall",
    town: "Watergate Bay",
    url: "https://surfingschool.co.uk",
    blurb: "Small-group and private lessons from Watergate Bay, with a camper-van shuttle to the break and a café on site.",
    image: "",
    verified: false,
    socials: {},
    levels: ["Beginner", "Intermediate"]
    // NOTE: based at Watergate Bay (TR8), ~4 miles from Newquay town; also runs lessons at Fistral.
  }
];
