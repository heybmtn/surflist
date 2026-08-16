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
     premium             true = pinned to the top + a "Premium" tag.
     socials             only the ones you fill in are shown. Supported:
                         instagram, facebook, tiktok, youtube, x
   ============================================================ */

window.LISTINGS = [
  {
    name: "Ericeira Wave Academy",
    country: "Portugal",
    region: "Lisbon",
    town: "Ericeira",
    url: "https://example.com/ericeira",
    levels: ["Beginner", "Intermediate", "Advanced"],
    blurb: "Coaching in Europe's only World Surfing Reserve.",
    image: "",
    premium: true,
    socials: {
      instagram: "https://instagram.com/example",
      youtube: "https://youtube.com/@example",
      facebook: "https://facebook.com/example",
    },
  },
  {
    name: "Newquay Surf School",
    country: "United Kingdom",
    region: "Cornwall",
    town: "Newquay",
    url: "https://example.com/newquay",
    levels: ["Beginner", "Intermediate", "Kids"],
    blurb: "Fistral Beach lessons in the UK's surf capital.",
    image: "",
    premium: true,
    socials: {
      instagram: "https://instagram.com/example",
      tiktok: "https://tiktok.com/@example",
    },
  },
  {
    name: "Hossegor Surf Club",
    country: "France",
    region: "Landes",
    town: "Hossegor",
    url: "https://example.com/hossegor",
    levels: ["Beginner", "Intermediate", "Kids"],
    blurb: "Beach-break coaching on one of Europe's most consistent stretches of sand.",
    image: "",
    premium: false,
    socials: {
      instagram: "https://instagram.com/example",
    },
  },
  {
    name: "San Sebastián Surf Co.",
    country: "Spain",
    region: "Basque Country",
    town: "San Sebastián",
    url: "https://example.com/sansebastian",
    levels: ["Beginner", "Intermediate"],
    blurb: "City-beach lessons at Zurriola, pintxos optional.",
    image: "",
    premium: false,
    socials: {
      instagram: "https://instagram.com/example",
      facebook: "https://facebook.com/example",
    },
  },
  {
    name: "Peniche Surf Lodge",
    country: "Portugal",
    region: "Leiria",
    town: "Peniche",
    url: "https://example.com/peniche",
    levels: ["Beginner", "Intermediate", "Advanced"],
    blurb: "A break for every wind direction, most days of the year.",
    image: "",
    premium: false,
    socials: {},
  },
  {
    name: "Thurso Surf",
    country: "United Kingdom",
    region: "Scotland",
    town: "Thurso",
    url: "https://example.com/thurso",
    levels: ["Intermediate", "Advanced"],
    blurb: "Cold-water reef surfing at the top of the mainland.",
    image: "",
    premium: false,
    socials: {
      youtube: "https://youtube.com/@example",
    },
  },
  {
    name: "Lahinch Surf Experience",
    country: "Ireland",
    region: "County Clare",
    town: "Lahinch",
    url: "https://example.com/lahinch",
    levels: ["Beginner", "Kids"],
    blurb: "Gentle Atlantic beginner waves on the Wild Atlantic Way.",
    image: "",
    premium: false,
    socials: {
      instagram: "https://instagram.com/example",
      facebook: "https://facebook.com/example",
      tiktok: "https://tiktok.com/@example",
    },
  },
  {
    name: "Bundoran Surf Lodge",
    country: "Ireland",
    region: "County Donegal",
    town: "Bundoran",
    url: "https://example.com/bundoran",
    levels: ["Beginner", "Intermediate", "Advanced"],
    blurb: "Ireland's surf town, with the famous Peak reef on the doorstep.",
    image: "",
    premium: false,
    socials: {
      instagram: "https://instagram.com/example",
    },
  },
];
