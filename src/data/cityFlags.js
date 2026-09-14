const COMMONS = "https://commons.wikimedia.org/wiki/Special:FilePath/";

function commonsFile(name) {
  return `${COMMONS}${encodeURIComponent(name)}`;
}

function normalize(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim();
}

/*
 * The city card must never use the Brani svoj grad hero image as a city flag.
 * We resolve only real flag media candidates from Wikimedia Commons.  The
 * component tries candidates in order and shows a neutral verification state
 * if Commons does not have the expected media file.
 *
 * The government currently lists 127 Croatian cities. The question catalog is
 * the source of the cards; this module is deliberately independent from the
 * question count so flags can be attached to every city as the catalog grows.
 */
export function cityFlagCandidates(cityName) {
  const name = String(cityName || "").trim();
  const plain = normalize(name);

  if (!name) return [];

  const candidates = [
    `Flag of ${name}.svg`,
    `Flag of the City of ${name}.svg`,
    `Flag of ${name}.png`,
    `Zastava ${name}.svg`,
    `Zastava Grada ${name}.svg`,
    `Zastava ${name}.png`,
    `Flag of ${plain}.svg`,
    `Flag of ${plain}.png`,
    `Zastava ${plain}.svg`,
    `Zastava ${plain}.png`,
  ];

  return [...new Set(candidates)].map(commonsFile);
}

export function cityFlagSource(cityName) {
  const name = String(cityName || "").trim();
  return `https://commons.wikimedia.org/wiki/Category:Flags_of_cities_of_Croatia#${encodeURIComponent(name)}`;
}

export const CITY_FLAG_SYSTEM = {
  country: "Hrvatska",
  scope: "gradovi",
  source: "Wikimedia Commons / gradska heraldika",
  sourcePolicy: "Stvarna gradska zastava ima prednost pred fotografijom ili generičkom grafikom. Commons se koristi kao javno dostupno spremište zastava; pojedinačni izvor ostaje provjerljiv kroz gradski naziv i Commons kategoriju.",
  fallback: "neutral-verification",
};
