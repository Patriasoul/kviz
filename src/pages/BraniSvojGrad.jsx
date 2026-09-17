import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Flag, Search, Shield, Loader2 } from "lucide-react";
import { cityFlagCandidates } from "../data/cityFlags";
import { fetchCityList, fetchCityQuestions } from "../lib/cityQuestions";

function CityFlag({ cityName }) {
  const candidates = cityFlagCandidates(cityName);
  const [index, setIndex] = useState(0);

  if (index >= candidates.length) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red-900 via-white to-blue-950">
        <div className="rounded-xl bg-black/35 px-5 py-3 text-center text-white backdrop-blur-sm">
          <Flag className="mx-auto mb-1 h-7 w-7" />
          <span className="text-sm font-bold">{cityName}</span>
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
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingSlug, setStartingSlug] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const result = await fetchCityList();
      if (cancelled) return;
      setCities(result.data ?? []);
      setError(result.error?.message ?? "");
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const filteredCities = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("hr");
    return cities.filter((city) =>
      !query ||
      city.name.toLocaleLowerCase("hr").includes(query) ||
      city.slug.toLocaleLowerCase("hr").includes(query),
    );
  }, [cities, search]);

  const startCity = async (city) => {
    setStartingSlug(city.slug);
    setError("");
    const result = await fetchCityQuestions(city.slug);
    if (result.error) {
      setError(`Pitanja za ${city.name} nisu dostupna: ${result.error.message}`);
      setStartingSlug("");
      return;
    }
    globalThis.__PATRIA_CITY_QUESTIONS__ = result.data ?? [];
    setStartingSlug("");
    onStart(city.slug, city.name);
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <section className="patria-card overflow-hidden">
        <div className="patria-checker bg-primary px-6 py-10 text-primary-foreground sm:px-10">
          <div className="flex items-center gap-3 text-red-200">
            <Shield className="h-7 w-7" />
            <span className="text-sm font-bold uppercase tracking-[.16em]">Brani svoj grad</span>
          </div>
          <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Odaberi svoj grad</h1>
          <p className="mt-4 max-w-2xl text-primary-foreground/75">
            Pitanja se učitavaju iz Supabase baze. Grad ne mora čekati da bude kompletiran s 75 pitanja — broj pitanja raste kako gradsku bazu nadopunjujemo.
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

        {loading && (
          <div className="flex items-center justify-center gap-3 p-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Učitavam gradove…
          </div>
        )}

        {!loading && error && (
          <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-3">
            {filteredCities.map((city) => (
              <button
                key={city.slug}
                onClick={() => startCity(city)}
                disabled={Boolean(startingSlug)}
                className="patria-card group overflow-hidden text-left transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
              >
                <div className="relative h-32 overflow-hidden bg-white">
                  <CityFlag cityName={city.name} />
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4 flex items-center gap-2 text-white pointer-events-none">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-black/50 backdrop-blur-sm">
                      {startingSlug === city.slug ? <Loader2 className="h-5 w-5 animate-spin" /> : <Flag className="h-5 w-5" />}
                    </span>
                    <span className="font-bold drop-shadow">{city.name}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 p-5">
                  <div>
                    <p className="text-sm font-semibold">Baza pitanja</p>
                    <p className="mt-1 text-xs text-muted-foreground">Učitavanje pitanja pri odabiru</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1" />
                </div>
              </button>
            ))}
          </div>
        )}

        {!loading && !error && !filteredCities.length && (
          <div className="p-10 text-center text-muted-foreground">Nema pronađenog grada s tim nazivom.</div>
        )}

        <div className="border-t border-border p-5 sm:p-7">
          <button onClick={onBack} className="patria-button">Natrag na Hrvatski kviz</button>
        </div>
      </section>
    </main>
  );
}
