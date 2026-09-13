const categories = [
  ["opce", "Hrvatsko opće znanje", "Raznoliko znanje o Hrvatskoj."],
  ["povijest", "Povijest Hrvatske", "Ključni događaji i osobe hrvatske povijesti."],
  ["domovinski-rat", "Domovinski rat", "Sjećanje, znanje i povijesne činjenice."],
  ["geografija", "Geografija Hrvatske", "Gradovi, krajevi, otoci, rijeke i planine."],
  ["priroda", "Priroda Hrvatske", "Nacionalni parkovi, planine i životinjski svijet."],
  ["bastina", "Kultura i baština", "Kultura, običaji i hrvatsko nasljeđe."],
  ["glagoljica", "Glagoljica", "Pismo i glagoljska kulturna baština Hrvata."],
  ["vjera", "Vjera i sakralna baština", "Vjera, crkvena baština i sakralna kultura."],
  ["sport", "Sport", "Hrvatski sportaši, klubovi i reprezentacije."],
  ["znanost", "Znanost i izumi", "Hrvatski znanstvenici, izumitelji i otkrića."],
];

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="patria-stripe" />

      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="patria-checker">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
            <a href="/" className="font-display text-2xl font-bold tracking-tight">
              PATRIA<span className="text-red-300">SOUL</span>
            </a>
            <nav className="flex gap-5 text-sm font-medium">
              <a href="#kvizovi" className="opacity-90 hover:opacity-100">Kvizovi</a>
              <a href="#o-kvizu" className="opacity-90 hover:opacity-100">O kvizu</a>
            </nav>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 pb-16 pt-20">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              🇭🇷 Znanje · ponos · nasljeđe
            </p>
            <h1 className="font-display text-5xl font-bold leading-tight md:text-6xl">
              Hrvatski kviz
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              Provjeri svoje znanje o Hrvatskoj — od povijesti i Domovinskog rata
              do geografije, prirode, baštine, sporta i znanosti.
            </p>
            <a href="#kvizovi" className="patria-button-accent mt-8">
              Započni kviz
            </a>
          </div>
        </section>

        <section id="kvizovi" className="mx-auto max-w-6xl px-6 pb-20">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
              Odaberi područje
            </p>
            <h2 className="patria-accent-line mt-2 text-3xl">Kvizovi</h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map(([id, title, description]) => (
              <a key={id} href={`#${id}`} className="patria-card p-6">
                <h3 className="text-xl">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </a>
            ))}
          </div>
        </section>

        <section id="o-kvizu" className="border-t border-border bg-secondary/50">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="text-3xl">PatriaSoul Hrvatski kviz</h2>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              Nova verzija kviza gradit će se modularno: pitanja, kategorije,
              korisnički računi, rang-lista i ostali sustavi bit će odvojeni i
              spremni za daljnji razvoj.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm opacity-90 sm:flex-row sm:items-center sm:justify-between">
          <span>© PatriaSoul</span>
          <span>Hrvatska · Povijest · Znanje · Identitet</span>
        </div>
      </footer>
    </div>
  );
}
