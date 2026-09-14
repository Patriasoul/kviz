import { useMemo, useState } from "react";
import { ArrowRight, Flag, Search, Shield } from "lucide-react";
import { CITY_QUESTIONS } from "../data/cityQuestions";

export default function BraniSvojGrad({ onBack, onStart }) {
  const [search, setSearch] = useState("");

  const cities = useMemo(() => {
    const grouped = new Map();
    for (const q of CITY_QUESTIONS) {
      const slug = q.citySlug || q.cityId || q.city_id;
      if (!slug) continue;
      if (!grouped.has(slug)) grouped.set(slug, { slug, name: q.cityName || slug, count: 0 });
      grouped.get(slug).count += 1;
    }
    return [...grouped.values()]
      .filter((city) => city.name.toLocaleLowerCase("hr").includes(search.toLocaleLowerCase("hr")) || city.slug.includes(search.toLocaleLowerCase("hr")))
      .sort((a, b) => a.name.localeCompare(b.name, "hr"));
  }, [search]);

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
            Izaberi hrvatski grad i odgovaraj na njegova provjerena pitanja. Cilj igre je 75 pitanja po gradu.
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
              onClick={() => onStart(city.slug, city.name)}
              className="patria-card group p-5 text-left transition hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-primary">
                  <Flag className="h-5 w-5" />
                </span>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1" />
              </div>
              <h2 className="mt-5 text-xl font-bold">{city.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{city.count} pitanja u bazi</p>
            </button>
          ))}
        </div>

        {!cities.length && (
          <div className="p-10 text-center text-muted-foreground">
            Nema pronađenog grada s tim nazivom.
          </div>
        )}

        <div className="border-t border-border p-5 sm:p-7">
          <button onClick={onBack} className="patria-button">Natrag na Hrvatski kviz</button>
        </div>
      </section>
    </main>
  );
}
