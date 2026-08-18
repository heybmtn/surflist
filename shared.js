/* Shared helpers used by BOTH the site (in the browser) and build.js (in Node).
   Keeping them here means a verified card's link and its generated page always
   agree on the same URL slug. */
(function () {
  function slugify(s) {
    return String(s == null ? "" : s)
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // strip accents
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }

  // Country name -> ISO 3166-1 alpha-2, for the schema's addressCountry.
  var COUNTRY_CODES = {
    "united kingdom": "GB", "uk": "GB", "england": "GB", "scotland": "GB", "wales": "GB",
    "ireland": "IE", "france": "FR", "spain": "ES", "portugal": "PT", "germany": "DE",
    "netherlands": "NL", "italy": "IT", "morocco": "MA", "united states": "US", "usa": "US",
    "australia": "AU", "new zealand": "NZ", "south africa": "ZA", "indonesia": "ID",
    "mexico": "MX", "costa rica": "CR", "brazil": "BR", "canada": "CA", "norway": "NO",
    "sweden": "SE", "denmark": "DK", "iceland": "IS", "el salvador": "SV", "sri lanka": "LK",
  };
  function countryCode(name) {
    return COUNTRY_CODES[String(name == null ? "" : name).toLowerCase().trim()] || "";
  }

  var api = { slugify: slugify, countryCode: countryCode };
  if (typeof module !== "undefined" && module.exports) module.exports = api; // Node
  if (typeof window !== "undefined") window.SurfShared = api;                 // browser
})();
