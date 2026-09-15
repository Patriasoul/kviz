import { useMemo, useState } from "react";
import { ArrowRight, Flag, Search, Shield } from "lucide-react";
import { CITY_QUESTIONS } from "../data/cityQuestions";
import { cityFlagCandidates } from "../data/cityFlags";

const TARGET_QUESTIONS = 75;

function CityFlag({ cityName }) {
  const candidates = cityFlagCandidates(cityName);
  const [index, setIndex] = useState(0);

  if (index >= candidates.length) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red-900 via-white to-blue-950">
        <div className="rounded-xl bg-black/35 px-5 py-3 text-center text-white backdrop-blur-sm">
          <Flag className="mx-auto mb-1 h-7 w-7" />
          <span className="text-sm font-bold">{cityName}</span>
          <span className="mt-1 block text-[10px] uppercase tracking-wider opacity-80">
            zastava se provjerava
          </span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={candidates[index]}
      alt={`Službena zastava grada ${cityName}`}
      className="h-full w-full object-contain bg-white p-5 transition duration-300 group-hover:scale-[1.03]"
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setIndex((current) => current + 1)}
    />
  );
}

export default function BraniSvojGrad({ onBack, onStart }) {
  const [search, setSearch] = useState("");

  const cities = useMemo(() => {
    const grouped = new Map();

    for (const q of CITY_QUESTIONS) {
      const slug = q.citySlug || q.cityId || q.city_id;
      if (!slug) continue;

      if (!grouped.has(slug)) {
        grouped.set(slug, {
          slug,
          name: q.cityName || slug,
          count: 0,
        });
      }

      grouped.get(slug).count += 1;
    }

    const query = search.trim().toLocaleLowerCase("hr");

    return [...grouped.values()]
      .map((city) => ({
        ...city,
        complete: city.count === TARGET_QUESTIONS,
      }))
      .filter(
        (city) =>
          !query ||
          city.name.toLocaleLowerCase("hr").includes(query) ||
          city.slug.toLocaleLowerCase("hr").includes(query),
      )
      .sort((a, b) => a.name.localeCompare(b.name, "hr"));
  }, [search]);

  const completeCities = cities.filter((city) => city.complete).length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <section className="patria-card overflow-hidden">
        <div className="patria-checker bg-primary px-6 py-10 text-primary-foreground sm:px-10">
          <div className="flex items-center gap-3 text-red-200">
            <Shield className="h-7 w-7" />
            <span className="text-sm font-bold uppercase tracking-[.16em]">
              Brani svoj grad
            </span>
          </div>
          <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">
            Odaberi svoj grad
          </h1>
          <p className="mt-4 max-w-2xl text-primary-foreground/75">
            Svaki grad dobiva točno 75 stvarnih pitanja. Grad se označava kao spreman tek kada svih 75 pitanja prođe provjeru.
          </p>
          <p className="mt-4 text-sm font-semibold text-red-200">
            Gradovi s kompletnim paketom: {completeCities} / {cities.length}
          </p>
        </div>

        <div className="border-b border-border bg-card p-5 sm:p-7">
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pretraži grad..."
              className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-3">
          {cities.map((city) => (
            <button
              key={city.slug}
              onClick={() => city.complete && onStart(city.slug, city.name)}
              disabled={!city.complete}
              className={`patria-card group overflow-hidden text-left transition ${
                city.complete ? "hover:-translate-y-0.5" : "cursor-not-allowed opacity-70"
              }`}
            >
              <div className="relative h-32 overflow-hidden bg-white">
                <CityFlag cityName={city.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-4 flex items-center gap-2 text-white pointer-events-none">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-black/50 backdrop-blur-sm">
                    <Flag className="h-5 w-5" />
                  </span>
                  <span className="font-bold drop-shadow">{city.name}</span>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{city.count} / {TARGET_QUESTIONS} pitanja</p>
                    <p className={`mt-2 text-xs font-bold uppercase tracking-wide ${city.complete ? "text-accent" : "text-muted-foreground"}`}>
                      {city.complete ? "Spremno za igru" : "U pripremi"}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {!cities.length && (
          <div className="p-10 text-center text-muted-foreground">
            Nema pronađenog grada s tim nazivom.
          </div>
        )}

        <div className="border-t border-border p-5 sm:p-7">
          <button onClick={onBack} className="patria-button">
            Natrag na Hrvatski kviz
          </button>
        </div>
      </section>
    </main>
  );
}
