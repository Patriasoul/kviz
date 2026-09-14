const COMMONS = "https://commons.wikimedia.org/wiki/Special:FilePath/";

function file(name) {
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

export function cityFlagCandidates(cityName) {
  const name = String(cityName || "").trim();
  const plain = normalize(name);
  const candidates = [
    `Flag of ${name}.svg`,
    `Flag of the City of ${name}.svg`,
    `Zastava ${name}.svg`,
    `Zastava Grada ${name}.svg`,
    `Flag of ${plain}.svg`,
    `Zastava ${plain}.svg`,
  ];

  return [...new Set(candidates)].map(file);
}

export function cityFlagSource(cityName) {
  const name = String(cityName || "").trim();
  return `https://commons.wikimedia.org/wiki/Category:Flags_of_cities_of_Croatia#${encodeURIComponent(name)}`;
}

export function CityFlag({ cityName, className = "" }) {
  const candidates = cityFlagCandidates(cityName);

  return {
    candidates,
    source: cityFlagSource(cityName),
    className,
  };
}

export const CITY_FLAG_SYSTEM = {
  country: "Hrvatska",
  scope: "gradovi",
  source: "Wikimedia Commons / gradska heraldika",
  note: "Kandidatne datoteke koriste službene nazive zastava kada su dostupni; pojedinačne zastave treba provjeriti prema službenom gradskom izvoru prije trajnog lokalnog arhiviranja.",
};
