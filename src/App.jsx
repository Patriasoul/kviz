import { useEffect, useState } from "react";
import { ArrowRight, Flag, FileText, RotateCcw, ShieldCheck, Trophy } from "lucide-react";
import Pravilnik from "./pages/Pravilnik";
import QuizPlayer from "./pages/QuizPlayer";

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

const questions = [
  { id: "demo-1", category: "geografija", question: "Koji je najveći hrvatski otok prema površini?", answers: ["Krk", "Cres", "Brač", "Hvar"], correctIndex: 1 },
  { id: "demo-2", category: "povijest", question: "Koje godine je Hrvatska međunarodno priznata kao neovisna država?", answers: ["1990.", "1991.", "1992.", "1995."], correctIndex: 2 },
  { id: "demo-3", category: "bastina", question: "Kako se zove poznati hrvatski spomenik pisan glagoljicom iz 1100. godine?", answers: ["Bašćanska ploča", "Vinodolski zakonik", "Šibenska molitva", "Humačka ploča"], correctIndex: 0 },
  { id: "demo-4", category: "priroda", question: "Koji je hrvatski nacionalni park poznat po slapovima rijeke Krke?", answers: ["Risnjak", "Paklenica", "Krka", "Brijuni"], correctIndex: 2 },
  { id: "demo-5", category: "sport", question: "Koje je godine Hrvatska osvojila broncu na Svjetskom prvenstvu u Francuskoj?", answers: ["1994.", "1998.", "2002.", "2006."], correctIndex: 1 },
];

const names = Object.fromEntries(categories.map(([id, title]) => [id, title]));
const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

export default function App() {
  const [screen, setScreen] = useState("home");
  const [category, setCategory] = useState("sve");
  const [round, setRound] = useState([]);
  const [result, setResult] = useState(null);
  const [rulesAccepted, setRulesAccepted] = useState(() => localStorage.getItem("patriasoul_rules_accepted") === "1");

  const start = (cat = "sve") => {
    if (!rulesAccepted) {
      setScreen("rules");
      return;
    }
    const pool = cat === "sve" ? questions : questions.filter((q) => q.category === cat);
    if (!pool.length) {
      setCategory(cat);
      setScreen("unavailable");
      return;
    }
    setCategory(cat);
    setRound(shuffle(pool).slice(0, Math.min(10, pool.length)));
    setResult(null);
    setScreen("quiz");
  };

  const acceptRules = () => {
    localStorage.setItem("patriasoul_rules_accepted", "1");
    setRulesAccepted(true);
    setScreen("home");
  };

  const home = () => {
    setScreen("home");
    setRound([]);
    setResult(null);
  };

  useEffect(() => {
    if (screen !== "quiz") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [screen]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="patria-stripe" />
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="patria-checker">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <button onClick={home} className="font-display text-2xl font-bold">PATRIA<span className="text-red-300">SOUL</span></button>
            <nav className="flex gap-4 text-sm">
              <button onClick={home}>Početna</button>
              <button onClick={() => setScreen("rules")} className="flex items-center gap-1"><FileText className="h-4 w-4" /> Pravilnik</button>
            </nav>
          </div>
        </div>
      </header>

      {screen === "rules" && <Pravilnik onBack={() => setScreen("home")} onAccept={acceptRules} />}

      {screen === "home" && (
        <main>
          <section className="border-b border-border">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
              <div className="max-w-3xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-[.16em] text-accent"><Flag className="h-4 w-4" /> Znanje · ponos · nasljeđe</div>
                <h1 className="font-display text-5xl font-bold leading-tight sm:text-6xl">Hrvatski kviz</h1>
                <p className="mt-5 max-w-2xl text-lg text-muted-foreground">Provjeri svoje znanje o Hrvatskoj — od povijesti i Domovinskog rata do geografije, prirode, baštine, glagoljice, vjere, sporta i znanosti.</p>
                <div className="mt-8 flex flex-wrap gap-3"><button onClick={() => start()} className="patria-button-accent">Započni kviz <ArrowRight className="ml-2 h-4 w-4" /></button><a href="#kategorije" className="patria-button">Odaberi kategoriju</a></div>
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

          <section className="border-y border-border bg-secondary/40"><div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><p className="text-sm font-bold uppercase tracking-[.16em] text-accent">PatriaSoul</p><h2 className="mt-2 text-3xl">Tri načina igranja.</h2><p className="mt-3 max-w-2xl text-muted-foreground">Hrvatski kviz, Brani svoj grad i Dnevni kviz bit će odvojeni sustavi s vlastitim pravilima i rezultatima.</p></div><ShieldCheck className="h-12 w-12 shrink-0 text-accent" /></div></section>

          <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6"><label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-4"><input type="checkbox" checked={rulesAccepted} onChange={(e) => { setRulesAccepted(e.target.checked); if (e.target.checked) localStorage.setItem("patriasoul_rules_accepted", "1"); else localStorage.removeItem("patriasoul_rules_accepted"); }} className="mt-1 h-4 w-4 accent-red-700" /><span className="text-sm">Prihvaćam <button onClick={(e) => { e.preventDefault(); setScreen("rules"); }} className="font-semibold text-accent underline">Pravilnik o igranju kvizova</button>.</span></label></section>
        </main>
      )}

      {screen === "quiz" && <QuizPlayer questions={round} title="PatriaSoul Hrvatski kviz" subtitle={category === "sve" ? "Kombinirani kviz" : names[category]} timeLimit={20} onComplete={setResult} onQuit={home} />}

      {screen === "result" && result && (
        <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20"><div className="patria-card overflow-hidden text-center"><div className="bg-primary px-6 py-10 text-primary-foreground"><Trophy className="mx-auto h-12 w-12 text-red-300" /><p className="mt-4 text-sm font-bold uppercase tracking-[.16em] text-red-200">Rezultat</p><h1 className="mt-2 font-display text-5xl font-bold">{result.score} / {result.total}</h1><p className="mt-2 opacity-75">Vrijeme: {result.timeSeconds} s</p></div><div className="p-8"><p className="text-lg font-semibold">Bravo na sudjelovanju.</p><p className="mt-2 text-muted-foreground">Rezultat je spreman za buduće spremanje u Supabase.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={() => start(category)} className="patria-button-accent"><RotateCcw className="mr-2 h-4 w-4" /> Igraj ponovno</button><button onClick={home} className="patria-button">Natrag na početak</button></div></div></div></main>
      )}

      {screen === "unavailable" && <main className="mx-auto max-w-2xl px-4 py-16 text-center sm:py-24"><div className="patria-card p-8"><h1 className="font-display text-3xl font-bold">Kategorija se priprema</h1><p className="mt-4 text-muted-foreground">Ova kategorija još nije spojena na službenu bazu pitanja. Ne prikazujemo izmišljena demo pitanja.</p><button onClick={home} className="patria-button-accent mt-7">Natrag na početak</button></div></main>}

      <footer className="border-t border-border bg-primary text-primary-foreground"><div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-7 text-sm opacity-90 sm:flex-row sm:justify-between sm:px-6"><span>© PatriaSoul</span><button onClick={() => setScreen("rules")} className="underline underline-offset-4">Pravilnik</button></div></footer>
    </div>
  );
}
