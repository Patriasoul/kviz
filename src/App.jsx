import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Flag, FileText, RotateCcw, ShieldCheck, Trophy } from "lucide-react";
import Pravilnik from "./pages/Pravilnik";
import QuizPlayer from "./pages/QuizPlayer";
import BraniSvojGrad from "./pages/BraniSvojGrad";
import DailyQuiz from "./pages/DailyQuiz";
import QUESTIONS from "./data/questions";
import { CITY_QUESTIONS } from "./data/cityQuestions";
import { pickQuestions, pickCityQuestions } from "./lib/questionEngine";

const categories = [
  ["opce", "Hrvatsko opće znanje", "Raznoliko znanje o Hrvatskoj."],
  ["povijest", "Povijest Hrvatske", "Ključni događaji i osobe hrvatske povijesti."],
  ["domovinski-rat", "Domovinski rat", "Sjećanje, znanje i povijesne činjenice."],
  ["geografija", "Geografija Hrvatske", "Gradovi, krajevi, otoci, rijeke i planine."],
  ["priroda", "Priroda Hrvatske", "Nacionalni parkovi i životinjski svijet."],
  ["bastina", "Kultura i baština", "Kultura, običaji i hrvatsko nasljeđe."],
  ["glagoljica", "Glagoljica", "Pismo i glagoljska kulturna baština Hrvata."],
  ["vjera", "Vjera i sakralna baština", "Vjera, crkvena baština i sakralna kultura."],
  ["sport", "Sport", "Hrvatski sportaši, klubovi i reprezentacije."],
  ["znanost", "Znanost i izumi", "Hrvatski znanstvenici, izumitelji i otkrića."],
];

const names = Object.fromEntries(categories.map(([id, title]) => [id, title]));

const quizImages = {
  daily: "/images/1765535164250.png",
  city: "/images/brani svoj grad.png",
  croatian: "/images/hrvatski kviz.png",
};

export default function App() {
  const [screen, setScreen] = useState("home");
  const [category, setCategory] = useState("sve");
  const [round, setRound] = useState([]);
  const [result, setResult] = useState(null);
  const [city, setCity] = useState(null);
  const [rulesAccepted, setRulesAccepted] = useState(() => localStorage.getItem("patriasoul_rules_accepted") === "1");

  const start = (cat = "sve") => {
    if (!rulesAccepted) { setScreen("rules"); return; }
    const selected = pickQuestions(QUESTIONS, 10, { category: cat === "sve" ? null : cat });
    if (!selected.length) { setCategory(cat); setScreen("unavailable"); return; }
    setCategory(cat); setCity(null); setRound(selected); setResult(null); setScreen("quiz");
  };

  const startCity = (citySlug, cityName) => {
    if (!rulesAccepted) { setScreen("rules"); return; }
    const selected = pickCityQuestions(CITY_QUESTIONS, citySlug, 10);
    if (selected.length < 10) {
      setCity({ slug: citySlug, name: cityName, count: selected.length });
      setScreen("city-unavailable");
      return;
    }
    setCity({ slug: citySlug, name: cityName, count: 75 });
    setCategory("city"); setRound(selected); setResult(null); setScreen("city-quiz");
  };

  const startDaily = () => {
    if (!rulesAccepted) { setScreen("rules"); return; }
    setCity(null); setCategory("daily"); setResult(null); setScreen("daily");
  };

  const acceptRules = () => {
    localStorage.setItem("patriasoul_rules_accepted", "1");
    setRulesAccepted(true);
    setScreen("home");
  };

  const home = () => {
    setScreen("home"); setRound([]); setResult(null); setCity(null); setCategory("sve");
  };

  const cityHome = () => {
    setScreen("cities"); setRound([]); setResult(null);
  };

  const completeQuiz = (quizResult) => { setResult(quizResult); setScreen("result"); };
  const completeCityQuiz = (quizResult) => { setResult(quizResult); setScreen("city-result"); };
  const completeDailyQuiz = (quizResult) => { setResult(quizResult); setScreen("daily-result"); };

  useEffect(() => {
    if (["quiz", "city-quiz", "daily"].includes(screen)) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [screen]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="patria-stripe" />
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="patria-checker">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <button onClick={home} className="flex items-center gap-3 font-display text-2xl font-bold">
              <img src="/images/logo Patriasoul.png" alt="PatriaSoul" className="h-11 w-auto object-contain" />
              <span className="sr-only">PatriaSoul</span>
            </button>
            <nav className="flex gap-4 text-sm">
              <button onClick={home}>Početna</button>
              <button onClick={startDaily}>Dnevni kviz</button>
              <button onClick={() => setScreen("cities")}>Brani svoj grad</button>
              <button onClick={() => setScreen("rules")} className="flex items-center gap-1"><FileText className="h-4 w-4" /> Pravilnik</button>
            </nav>
          </div>
        </div>
      </header>

      {screen === "rules" && <Pravilnik onBack={() => setScreen("home")} onAccept={acceptRules} />}

      {screen === "home" && (
        <main>
          <section className="border-b border-border">
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
              <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
                <div className="max-w-3xl">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-[.16em] text-accent"><Flag className="h-4 w-4" /> Znanje · ponos · nasljeđe</div>
                  <h1 className="font-display text-5xl font-bold leading-tight sm:text-6xl">Hrvatski kviz</h1>
                  <p className="mt-5 max-w-2xl text-lg text-muted-foreground">Provjeri svoje znanje o Hrvatskoj — pitanja se uzimaju iz postojeće PatriaSoul baze i svaki se kviz nasumično razvrtava.</p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button onClick={() => start()} className="patria-button-accent">Započni kviz <ArrowRight className="ml-2 h-4 w-4" /></button>
                    <button onClick={startDaily} className="patria-button"><CalendarDays className="mr-2 h-4 w-4" /> Dnevni kviz</button>
                    <button onClick={() => setScreen("cities")} className="patria-button">Brani svoj grad</button>
                    <a href="#kategorije" className="patria-button">Odaberi kategoriju</a>
                  </div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <img src={quizImages.croatian} alt="Hrvatski kviz PatriaSoul" className="h-64 w-full object-cover sm:h-72" />
                  <div className="border-t border-border p-4">
                    <p className="text-sm font-bold uppercase tracking-[.14em] text-accent">PatriaSoul · Hrvatski kviz</p>
                    <p className="mt-1 text-sm text-muted-foreground">Znanje o Hrvatskoj na jednom mjestu.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="border-b border-border bg-secondary/30">
            <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
              <div className="grid gap-5 md:grid-cols-2">
                <button onClick={startDaily} className="patria-card group overflow-hidden text-left">
                  <img src={quizImages.daily} alt="Dnevni kviz" className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                  <div className="p-6">
                    <p className="text-sm font-bold uppercase tracking-[.16em] text-accent">Svaki dan novi izazov</p>
                    <h2 className="mt-2 text-2xl">Dnevni kviz</h2>
                    <p className="mt-2 text-sm text-muted-foreground">10 pitanja, isti dnevni set za sve igrače i novi izazov svakog dana.</p>
                    <span className="mt-5 inline-flex items-center font-semibold text-accent">Igraj današnji kviz <ArrowRight className="ml-2 h-4 w-4" /></span>
                  </div>
                </button>

                <button onClick={() => setScreen("cities")} className="patria-card group overflow-hidden text-left">
                  <img src={quizImages.city} alt="Brani svoj grad" className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                  <div className="p-6">
                    <p className="text-sm font-bold uppercase tracking-[.16em] text-accent">75 pitanja po gradu</p>
                    <h2 className="mt-2 text-2xl">Brani svoj grad</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Odaberi hrvatski grad i provjeri koliko dobro poznaješ njegovu povijest, baštinu i posebnosti.</p>
                    <span className="mt-5 inline-flex items-center font-semibold text-accent">Odaberi grad <ArrowRight className="ml-2 h-4 w-4" /></span>
                  </div>
                </button>
              </div>
            </div>
          </section>

          <section id="kategorije" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <p className="text-sm font-bold uppercase tracking-[.16em] text-accent">10 područja</p>
            <h2 className="patria-accent-line mt-2 text-3xl">Odaberi kategoriju</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map(([id, title, desc], i) => (
                <button key={id} onClick={() => start(id)} className="patria-card group p-5 text-left">
                  <div className="flex justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-sm font-bold text-primary">{String(i + 1).padStart(2, "0")}</span><ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1" /></div>
                  <h3 className="mt-5 text-xl">{title}</h3><p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="border-y border-border bg-secondary/40">
            <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div><p className="text-sm font-bold uppercase tracking-[.16em] text-accent">PatriaSoul</p><h2 className="mt-2 text-3xl">Postojeća pitanja. Novo razvrtavanje.</h2><p className="mt-3 max-w-2xl text-muted-foreground">Ne stvaramo novu kopiju baze. Kviz koristi postojeća PatriaSoul pitanja, a engine svaki put bira i miješa pitanja i odgovore.</p></div>
              <ShieldCheck className="h-12 w-12 shrink-0 text-accent" />
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-4">
              <input type="checkbox" checked={rulesAccepted} onChange={(e) => { setRulesAccepted(e.target.checked); if (e.target.checked) localStorage.setItem("patriasoul_rules_accepted", "1"); else localStorage.removeItem("patriasoul_rules_accepted"); }} className="mt-1 h-4 w-4 accent-red-700" />
              <span className="text-sm">Prihvaćam <button onClick={(e) => { e.preventDefault(); setScreen("rules"); }} className="font-semibold text-accent underline">Pravilnik o igranju kvizova</button>.</span>
            </label>
          </section>
        </main>
      )}

      {screen === "cities" && <BraniSvojGrad onBack={home} onStart={startCity} />}
      {screen === "daily" && <DailyQuiz onBack={home} onComplete={completeDailyQuiz} />}

      {screen === "quiz" && <QuizPlayer questions={round} title="PatriaSoul Hrvatski kviz" subtitle={category === "sve" ? "Kombinirani kviz" : names[category]} timeLimit={20} onComplete={completeQuiz} onQuit={home} />}
      {screen === "city-quiz" && <QuizPlayer questions={round} title={`Brani svoj grad: ${city?.name || "Grad"}`} subtitle="10 pitanja iz baze od 75" timeLimit={15} onComplete={completeCityQuiz} onQuit={cityHome} />}

      {screen === "result" && result && (
        <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20"><div className="patria-card overflow-hidden text-center"><div className="bg-primary px-6 py-10 text-primary-foreground"><Trophy className="mx-auto h-12 w-12 text-red-300" /><p className="mt-4 text-sm font-bold uppercase tracking-[.16em] text-red-200">Rezultat</p><h1 className="mt-2 font-display text-5xl font-bold">{result.score} / {result.total}</h1><p className="mt-2 opacity-75">Vrijeme: {result.timeSeconds} s</p></div><div className="p-8"><p className="text-lg font-semibold">Bravo na sudjelovanju.</p><p className="mt-2 text-muted-foreground">Pitanja su uzeta iz postojeće PatriaSoul baze.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={() => start(category)} className="patria-button-accent"><RotateCcw className="mr-2 h-4 w-4" /> Igraj ponovno</button><button onClick={home} className="patria-button">Natrag na početak</button></div></div></div></main>
      )}

      {screen === "daily-result" && result && (
        <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20"><div className="patria-card overflow-hidden text-center"><div className="bg-primary px-6 py-10 text-primary-foreground"><CalendarDays className="mx-auto h-12 w-12 text-red-300" /><p className="mt-4 text-sm font-bold uppercase tracking-[.16em] text-red-200">Dnevni rezultat</p><h1 className="mt-2 font-display text-4xl font-bold">Dnevni kviz</h1><p className="mt-4 text-5xl font-bold">{result.score} / {result.total}</p><p className="mt-2 opacity-75">Vrijeme: {result.timeSeconds} s</p></div><div className="p-8"><p className="text-lg font-semibold">Današnji izazov je završen.</p><p className="mt-2 text-muted-foreground">Današnji set ostaje isti do promjene datuma.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={startDaily} className="patria-button-accent"><RotateCcw className="mr-2 h-4 w-4" /> Ponovi današnji kviz</button><button onClick={home} className="patria-button">Natrag na početak</button></div></div></div></main>
      )}

      {screen === "city-result" && result && city && (
        <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20"><div className="patria-card overflow-hidden text-center"><div className="bg-primary px-6 py-10 text-primary-foreground"><ShieldCheck className="mx-auto h-12 w-12 text-red-300" /><p className="mt-4 text-sm font-bold uppercase tracking-[.16em] text-red-200">Brani svoj grad</p><h1 className="mt-2 font-display text-4xl font-bold">{city.name}</h1><p className="mt-4 text-5xl font-bold">{result.score} / {result.total}</p><p className="mt-2 opacity-75">Vrijeme: {result.timeSeconds} s</p></div><div className="p-8"><p className="text-lg font-semibold">Dobro odrađeno.</p><p className="mt-2 text-muted-foreground">Igra koristi 10 pitanja iz provjerene baze od 75 pitanja za ovaj grad.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={() => startCity(city.slug, city.name)} className="patria-button-accent"><RotateCcw className="mr-2 h-4 w-4" /> Igraj ponovno</button><button onClick={cityHome} className="patria-button">Drugi grad</button><button onClick={home} className="patria-button">Početna</button></div></div></div></main>
      )}

      {screen === "city-unavailable" && city && (
        <main className="mx-auto max-w-2xl px-4 py-16 text-center sm:py-24"><div className="patria-card p-8"><h1 className="font-display text-3xl font-bold">Grad još nema dovoljno pitanja</h1><p className="mt-4 text-muted-foreground">Za {city.name} trenutačno je dostupno {city.count} provjerenih pitanja. Igra se ne pokreće dok nema najmanje 10 pitanja.</p><button onClick={cityHome} className="patria-button-accent mt-7">Natrag na gradove</button></div></main>
      )}

      {screen === "unavailable" && <main className="mx-auto max-w-2xl px-4 py-16 text-center sm:py-24"><div className="patria-card p-8"><h1 className="font-display text-3xl font-bold">Kategorija se priprema</h1><p className="mt-4 text-muted-foreground">Za ovu kategoriju trenutačno nema valjanih pitanja u službenoj bazi. Ne prikazujemo izmišljena demo pitanja.</p><button onClick={home} className="patria-button-accent mt-7">Natrag na početak</button></div></main>}

      <footer className="border-t border-border bg-primary text-primary-foreground"><div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-7 text-sm opacity-90 sm:flex-row sm:justify-between sm:px-6"><span>© PatriaSoul</span><button onClick={() => setScreen("rules")} className="underline underline-offset-4">Pravilnik</button></div></footer>
    </div>
  );
}
