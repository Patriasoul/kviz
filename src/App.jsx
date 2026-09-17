import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Flag, FileText, Loader2, MapPin, RotateCcw, ShieldCheck, Trophy } from "lucide-react";
import Pravilnik from "./pages/Pravilnik";
import QuizPlayer from "./pages/QuizPlayer";
import { fetchCities, fetchCityQuestions, shuffle } from "./lib/cityQuiz";

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

export default function App() {
  const [screen, setScreen] = useState("home");
  const [category, setCategory] = useState("sve");
  const [round, setRound] = useState([]);
  const [result, setResult] = useState(null);
  const [cities, setCities] = useState([]);
  const [city, setCity] = useState(null);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [error, setError] = useState("");
  const [rulesAccepted, setRulesAccepted] = useState(() => localStorage.getItem("patriasoul_rules_accepted") === "1");

  const acceptRules = () => {
    localStorage.setItem("patriasoul_rules_accepted", "1");
    setRulesAccepted(true);
    setScreen("home");
  };

  const openCities = async () => {
    if (!rulesAccepted) { setScreen("rules"); return; }
    setError("");
    setScreen("cities");
    if (cities.length) return;
    setLoadingCities(true);
    try {
      setCities(await fetchCities());
    } catch (e) {
      setError(e.message || "Gradovi se trenutno ne mogu učitati.");
    } finally {
      setLoadingCities(false);
    }
  };

  const startCity = async (selectedCity) => {
    setError("");
    setLoadingQuiz(true);
    try {
      const questions = await fetchCityQuestions(selectedCity.id);
      if (questions.length < 10) throw new Error(`Za ${selectedCity.name} trenutno nije dostupno dovoljno aktivnih pitanja.`);
      setCity(selectedCity);
      setCategory("grad");
      setRound(shuffle(questions).slice(0, 10));
      setResult(null);
      setScreen("quiz");
    } catch (e) {
      setError(e.message || "Pitanja se trenutno ne mogu učitati.");
    } finally {
      setLoadingQuiz(false);
    }
  };

  const home = () => {
    setScreen("home");
    setRound([]);
    setResult(null);
    setError("");
  };

  const completeQuiz = (quizResult) => {
    setResult(quizResult);
    setScreen("result");
  };

  useEffect(() => {
    if (screen === "quiz") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [screen]);

  return <div className="min-h-screen bg-background text-foreground">
    <div className="patria-stripe" />
    <header className="border-b border-border bg-primary text-primary-foreground">
      <div className="patria-checker"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <button onClick={home} className="font-display text-2xl font-bold">PATRIA<span className="text-red-300">SOUL</span></button>
        <nav className="flex gap-4 text-sm"><button onClick={home}>Početna</button><button onClick={() => setScreen("rules")} className="flex items-center gap-1"><FileText className="h-4 w-4" /> Pravilnik</button></nav>
      </div></div>
    </header>

    {screen === "rules" && <Pravilnik onBack={() => setScreen("home")} />}

    {screen === "home" && <main>
      <section className="border-b border-border"><div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20"><div className="max-w-3xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-[.16em] text-accent"><Flag className="h-4 w-4" /> Znanje · ponos · nasljeđe</div>
        <h1 className="font-display text-5xl font-bold leading-tight sm:text-6xl">Hrvatski kviz</h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">Provjeri svoje znanje o Hrvatskoj — od povijesti i Domovinskog rata do geografije, prirode, baštine, glagoljice, vjere, sporta i znanosti.</p>
        <div className="mt-8 flex flex-wrap gap-3"><button onClick={openCities} className="patria-button-accent"><MapPin className="mr-2 h-4 w-4" /> Brani svoj grad</button><a href="#kategorije" className="patria-button">Odaberi kategoriju</a></div>
      </div></div></section>

      <section id="kategorije" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20"><p className="text-sm font-bold uppercase tracking-[.16em] text-accent">10 područja</p><h2 className="patria-accent-line mt-2 text-3xl">Hrvatski kviz</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{categories.map(([id, title, desc], i) => <div key={id} className="patria-card p-5 text-left"><div className="flex justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-sm font-bold text-primary">{String(i + 1).padStart(2, "0")}</span></div><h3 className="mt-5 text-xl">{title}</h3><p className="mt-2 text-sm text-muted-foreground">{desc}</p><p className="mt-4 text-xs font-semibold text-muted-foreground">Uskoro spojeno s glavnom bazom pitanja.</p></div>)}</div>
      </section>

      <section className="border-y border-border bg-secondary/40"><div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><p className="text-sm font-bold uppercase tracking-[.16em] text-accent">PatriaSoul</p><h2 className="mt-2 text-3xl">Tri načina igranja.</h2><p className="mt-3 max-w-2xl text-muted-foreground">Hrvatski kviz, Brani svoj grad i Dnevni kviz odvojeni su sustavi s vlastitim pravilima i rezultatima.</p></div><ShieldCheck className="h-12 w-12 shrink-0 text-accent" /></div></section>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6"><label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-4"><input type="checkbox" checked={rulesAccepted} onChange={(e) => { setRulesAccepted(e.target.checked); if (e.target.checked) localStorage.setItem("patriasoul_rules_accepted", "1"); else localStorage.removeItem("patriasoul_rules_accepted"); }} className="mt-1 h-4 w-4 accent-red-700" /><span className="text-sm">Prihvaćam <button onClick={(e) => { e.preventDefault(); setScreen("rules"); }} className="font-semibold text-accent underline">Pravilnik o igranju kvizova</button>.</span></label></section>
    </main>}

    {screen === "cities" && <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16"><div className="mb-8 flex items-center justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[.16em] text-accent">Brani svoj grad</p><h1 className="mt-2 font-display text-4xl font-bold">Odaberi grad</h1><p className="mt-2 text-muted-foreground">Svaki grad ima vlastiti paket od 75 provjerenih pitanja.</p></div><button onClick={home} className="patria-button"><ArrowLeft className="mr-2 h-4 w-4" /> Natrag</button></div>
      {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      {loadingCities ? <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Učitavam gradove...</div> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cities.map((item) => <button key={item.id} disabled={loadingQuiz} onClick={() => startCity(item)} className="patria-card group p-4 text-left disabled:opacity-60"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold">{item.name}</h2><p className="mt-1 text-xs text-muted-foreground">{item.county || "Hrvatska"}</p></div><ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1" /></div></button>)}</div>}
      {loadingQuiz && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"><div className="rounded-xl bg-card px-6 py-5 shadow-xl"><div className="flex items-center gap-3"><Loader2 className="h-5 w-5 animate-spin" /> Učitavam pitanja...</div></div></div>}
    </main>}

    {screen === "quiz" && <QuizPlayer questions={round} title={city ? `Brani svoj grad: ${city.name}` : "PatriaSoul Hrvatski kviz"} subtitle={city ? "75 pitanja u bazi · 10 pitanja po rundi" : names[category]} timeLimit={20} onComplete={completeQuiz} onQuit={city ? () => setScreen("cities") : home} />}

    {screen === "result" && result && <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20"><div className="patria-card overflow-hidden text-center"><div className="bg-primary px-6 py-10 text-primary-foreground"><Trophy className="mx-auto h-12 w-12 text-red-300" /><p className="mt-4 text-sm font-bold uppercase tracking-[.16em] text-red-200">Rezultat</p><h1 className="mt-2 font-display text-5xl font-bold">{result.score} / {result.total}</h1><p className="mt-2 opacity-75">Vrijeme: {result.timeSeconds} s</p></div><div className="p-8"><p className="text-lg font-semibold">Bravo na sudjelovanju.</p><p className="mt-2 text-muted-foreground">Rezultat je prikazan. Spremanje rezultata i rang-lista slijede u sljedećem koraku.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={() => city ? startCity(city) : home()} className="patria-button-accent"><RotateCcw className="mr-2 h-4 w-4" /> Igraj ponovno</button><button onClick={city ? () => setScreen("cities") : home} className="patria-button">Natrag</button></div></div></div></main>}

    <footer className="border-t border-border bg-primary text-primary-foreground"><div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-7 text-sm opacity-90 sm:flex-row sm:justify-between sm:px-6"><span>© PatriaSoul</span><button onClick={() => setScreen("rules")} className="underline underline-offset-4">Pravilnik</button></div></footer>
  </div>;
}
