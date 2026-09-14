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
 * City cards use the city's heraldic symbol, never the Brani svoj grad hero image.
 * We try the common Wikimedia Commons naming conventions for both official
 * coats of arms (grb) and official flags. A working Commons file is displayed;
 * if one naming variant is missing, the next verified naming variant is tried.
 */
export function cityFlagCandidates(cityName) {
  const name = String(cityName || "").trim();
  const plain = normalize(name);
  if (!name) return [];

  const candidates = [
    `Coat of arms of ${name}.svg`,
    `Coat of arms of the City of ${name}.svg`,
    `Coat of arms of ${name}.png`,
    `Coat of arms of the City of ${name}.png`,
    `Grb ${name}.svg`,
    `Grb Grada ${name}.svg`,
    `Grb ${name}.png`,
    `Grb Grada ${name}.png`,
    `Flag of ${name}.svg`,
    `Flag of the City of ${name}.svg`,
    `Flag of ${name}.png`,
    `Zastava ${name}.svg`,
    `Zastava Grada ${name}.svg`,
    `Zastava ${name}.png`,
    `Coat of arms of ${plain}.svg`,
    `Coat of arms of the City of ${plain}.svg`,
    `Grb ${plain}.svg`,
    `Grb Grada ${plain}.svg`,
    `Flag of ${plain}.svg`,
    `Zastava ${plain}.svg`,
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
  primaryAsset: "službeni grb grada",
  fallbackAsset: "službena zastava grada",
  sourcePolicy: "Na kartici grada prikazuje se službeni gradski grb kada je javno dostupan; ako nije dostupan pod očekivanim nazivom, sustav pokušava službenu zastavu. Ne koristi se generička PatriaSoul slika.",
  fallback: "neutral-verification",
};
