import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Flag, FileText, Loader2, LogIn, LogOut, MapPin, RotateCcw, ShieldCheck, Trophy, UserRound, Medal } from "lucide-react";
import Pravilnik from "./pages/Pravilnik";
import QuizPlayer from "./pages/QuizPlayer";
import { fetchCities, fetchCityQuestions, shuffle } from "./lib/cityQuiz";
import { getLeaderboard, saveQuizResult } from "./lib/results";
import { supabase } from "./lib/supabase";

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

export default function App() {
  const [screen, setScreen] = useState("home");
  const [round, setRound] = useState([]);
  const [result, setResult] = useState(null);
  const [cities, setCities] = useState([]);
  const [city, setCity] = useState(null);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardType, setLeaderboardType] = useState(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(() => localStorage.getItem("patriasoul_rules_accepted") === "1");

  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  const acceptRules = () => {
    localStorage.setItem("patriasoul_rules_accepted", "1");
    setRulesAccepted(true);
    setScreen("home");
  };

  const signIn = async () => {
    setError("");
    if (!supabase) { setError("Supabase nije konfiguriran. Dodaj VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY."); return; }
    const email = window.prompt("Upiši svoju e-mail adresu:");
    if (!email) return;
    const { error: authError } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    if (authError) setError(authError.message); else setError("Provjeri e-mail i otvori poveznicu za prijavu.");
  };

  const signOut = async () => { await supabase?.auth.signOut(); setUser(null); };

  const openCities = async () => {
    if (!rulesAccepted) { setScreen("rules"); return; }
    setError(""); setScreen("cities");
    if (cities.length) return;
    setLoadingCities(true);
    try { setCities(await fetchCities()); } catch (e) { setError(e.message || "Gradovi se trenutno ne mogu učitati."); } finally { setLoadingCities(false); }
  };

  const openLeaderboard = async (type = null) => {
    setError(""); setScreen("leaderboard"); setLeaderboardType(type); setLoadingLeaderboard(true);
    try { setLeaderboard(await getLeaderboard(type, 50)); } catch (e) { setError(e.message || "Rang-lista se trenutno ne može učitati."); setLeaderboard([]); } finally { setLoadingLeaderboard(false); }
  };

  const startCity = async (selectedCity) => {
    setError(""); setLoadingQuiz(true);
    try {
      const questions = await fetchCityQuestions(selectedCity.id);
      if (questions.length < 10) throw new Error(`Za ${selectedCity.name} trenutno nije dostupno dovoljno aktivnih pitanja.`);
      setCity(selectedCity); setRound(shuffle(questions).slice(0, 10)); setResult(null); setScreen("quiz");
    } catch (e) { setError(e.message || "Pitanja se trenutno ne mogu učitati."); } finally { setLoadingQuiz(false); }
  };

  const home = () => { setScreen("home"); setRound([]); setResult(null); setError(""); };

  const completeQuiz = async (quizResult) => {
    setResult({ ...quizResult, saving: Boolean(user) });
    setScreen("result");
    if (user && city) {
      try {
        const saved = await saveQuizResult({ quizType: "city", citySlug: city.slug, ...quizResult });
        setResult((current) => ({ ...current, saved: saved.saved, saving: false }));
      } catch (e) {
        setResult((current) => ({ ...current, saving: false, saveError: e.message }));
      }
    }
  };

  useEffect(() => { if (screen === "quiz") window.scrollTo({ top: 0, behavior: "smooth" }); }, [screen]);

  return <div className="min-h-screen bg-background text-foreground">
    <div className="patria-stripe" />
    <header className="border-b border-border bg-primary text-primary-foreground">
      <div className="patria-checker"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <button onClick={home} className="font-display text-2xl font-bold">PATRIA<span className="text-red-300">SOUL</span></button>
        <nav className="flex items-center gap-4 text-sm"><button onClick={home}>Početna</button><button onClick={() => openLeaderboard()} className="hidden items-center gap-1 sm:flex"><Medal className="h-4 w-4" /> Rang-lista</button><button onClick={() => setScreen("rules")} className="hidden items-center gap-1 sm:flex"><FileText className="h-4 w-4" /> Pravilnik</button>{user ? <button onClick={signOut} className="flex items-center gap-1"><LogOut className="h-4 w-4" /> Odjava</button> : <button onClick={signIn} className="flex items-center gap-1"><LogIn className="h-4 w-4" /> Prijava</button>}</nav>
      </div></div>
    </header>

    {screen === "rules" && <Pravilnik onBack={() => setScreen("home")} />}

    {screen === "home" && <main>
      <section className="border-b border-border"><div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20"><div className="max-w-3xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-[.16em] text-accent"><Flag className="h-4 w-4" /> Znanje · ponos · nasljeđe</div>
        <h1 className="font-display text-5xl font-bold leading-tight sm:text-6xl">Hrvatski kviz</h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">Provjeri svoje znanje o Hrvatskoj — od povijesti i Domovinskog rata do geografije, prirode, baštine, glagoljice, vjere, sporta i znanosti.</p>
        <div className="mt-8 flex flex-wrap gap-3"><button onClick={openCities} className="patria-button-accent"><MapPin className="mr-2 h-4 w-4" /> Brani svoj grad</button><button onClick={() => openLeaderboard()} className="patria-button"><Medal className="mr-2 h-4 w-4" /> Rang-lista</button><a href="#kategorije" className="patria-button">Odaberi kategoriju</a></div>
        {user && <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm"><UserRound className="h-4 w-4 text-accent" /> Prijavljen korisnik</div>}
      </div></div></section>

      <section id="kategorije" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20"><p className="text-sm font-bold uppercase tracking-[.16em] text-accent">10 područja</p><h2 className="patria-accent-line mt-2 text-3xl">Hrvatski kviz</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{categories.map(([id, title, desc], i) => <button key={id} onClick={() => setError(`Kategorija „${title}” još čeka povezivanje s glavnom bazom pitanja.`)} className="patria-card p-5 text-left"><span className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-sm font-bold text-primary">{String(i + 1).padStart(2, "0")}</span><h3 className="mt-5 text-xl">{title}</h3><p className="mt-2 text-sm text-muted-foreground">{desc}</p><p className="mt-4 text-xs font-semibold text-muted-foreground">Glavna baza pitanja je sljedeći blok povezivanja.</p></button>)}</div>
        {error && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      </section>

      <section className="border-y border-border bg-secondary/40"><div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><p className="text-sm font-bold uppercase tracking-[.16em] text-accent">PatriaSoul</p><h2 className="mt-2 text-3xl">Tri načina igranja.</h2><p className="mt-3 max-w-2xl text-muted-foreground">Hrvatski kviz, Brani svoj grad i Dnevni kviz odvojeni su sustavi s vlastitim pravilima i rezultatima.</p></div><ShieldCheck className="h-12 w-12 shrink-0 text-accent" /></div></section>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6"><label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-4"><input type="checkbox" checked={rulesAccepted} onChange={(e) => { setRulesAccepted(e.target.checked); if (e.target.checked) localStorage.setItem("patriasoul_rules_accepted", "1"); else localStorage.removeItem("patriasoul_rules_accepted"); }} className="mt-1 h-4 w-4 accent-red-700" /><span className="text-sm">Prihvaćam <button onClick={(e) => { e.preventDefault(); setScreen("rules"); }} className="font-semibold text-accent underline">Pravilnik o igranju kvizova</button>.</span></label></section>
    </main>}

    {screen === "cities" && <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16"><div className="mb-8 flex items-center justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[.16em] text-accent">Brani svoj grad</p><h1 className="mt-2 font-display text-4xl font-bold">Odaberi grad</h1><p className="mt-2 text-muted-foreground">Svaki grad ima vlastiti paket od 75 pitanja.</p></div><button onClick={home} className="patria-button"><ArrowLeft className="mr-2 h-4 w-4" /> Natrag</button></div>
      {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      {loadingCities ? <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Učitavam gradove...</div> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cities.map((item) => <button key={item.id} disabled={loadingQuiz} onClick={() => startCity(item)} className="patria-card group p-4 text-left disabled:opacity-60"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold">{item.name}</h2><p className="mt-1 text-xs text-muted-foreground">{item.county || "Hrvatska"}</p></div><ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1" /></div></button>)}</div>}
      {loadingQuiz && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"><div className="rounded-xl bg-card px-6 py-5 shadow-xl"><div className="flex items-center gap-3"><Loader2 className="h-5 w-5 animate-spin" /> Učitavam pitanja...</div></div></div>}
    </main>}

    {screen === "quiz" && <QuizPlayer questions={round} title={`Brani svoj grad: ${city?.name ?? ""}`} subtitle="75 pitanja u bazi · 10 pitanja po rundi" timeLimit={20} onComplete={completeQuiz} onQuit={() => setScreen("cities")} />}

    {screen === "result" && result && <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20"><div className="patria-card overflow-hidden text-center"><div className="bg-primary px-6 py-10 text-primary-foreground"><Trophy className="mx-auto h-12 w-12 text-red-300" /><p className="mt-4 text-sm font-bold uppercase tracking-[.16em] text-red-200">Rezultat</p><h1 className="mt-2 font-display text-5xl font-bold">{result.score} / {result.total}</h1><p className="mt-2 opacity-75">Vrijeme: {result.timeSeconds} s</p></div><div className="p-8"><p className="text-lg font-semibold">{result.saved ? "Rezultat je spremljen." : user ? "Rezultat se obrađuje." : "Rezultat je prikazan."}</p><p className="mt-2 text-muted-foreground">{result.saveError || (user ? "Tvoj rezultat je povezan s tvojim profilom." : "Prijavi se kako bi se rezultat mogao spremiti u tvoj račun.")}</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={() => startCity(city)} className="patria-button-accent"><RotateCcw className="mr-2 h-4 w-4" /> Igraj ponovno</button><button onClick={() => setScreen("cities")} className="patria-button">Odaberi drugi grad</button><button onClick={() => openLeaderboard("city")} className="patria-button">Rang-lista</button></div></div></div></main>}

    {screen === "leaderboard" && <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16"><div className="mb-8 flex items-center justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[.16em] text-accent">PatriaSoul</p><h1 className="mt-2 font-display text-4xl font-bold">Rang-lista</h1><p className="mt-2 text-muted-foreground">Rezultati igrača koji su svoje rezultate spremili u PatriaSoul.</p></div><button onClick={home} className="patria-button"><ArrowLeft className="mr-2 h-4 w-4" /> Natrag</button></div>
      <div className="mb-6 flex flex-wrap gap-2"><button onClick={() => openLeaderboard(null)} className={leaderboardType === null ? "patria-button-accent" : "patria-button"}>Sve</button><button onClick={() => openLeaderboard("city")} className={leaderboardType === "city" ? "patria-button-accent" : "patria-button"}>Brani svoj grad</button><button onClick={() => openLeaderboard("croatian")} className={leaderboardType === "croatian" ? "patria-button-accent" : "patria-button"}>Hrvatski kviz</button><button onClick={() => openLeaderboard("daily")} className={leaderboardType === "daily" ? "patria-button-accent" : "patria-button"}>Dnevni kviz</button></div>
      {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      {loadingLeaderboard ? <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Učitavam rang-listu...</div> : leaderboard.length === 0 ? <div className="patria-card p-10 text-center"><Medal className="mx-auto h-10 w-10 text-accent" /><h2 className="mt-4 text-2xl font-bold">Još nema rezultata</h2><p className="mt-2 text-muted-foreground">Prvi spremljeni rezultati pojavit će se ovdje.</p></div> : <div className="overflow-hidden rounded-xl border border-border bg-card"><div className="grid grid-cols-[48px_1fr_90px_110px] gap-3 border-b border-border bg-secondary/60 px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground"><span>#</span><span>Igrač</span><span>Najbolje</span><span>Odigrano</span></div>{leaderboard.map((player, index) => <div key={`${player.display_name}-${index}`} className="grid grid-cols-[48px_1fr_90px_110px] items-center gap-3 border-b border-border px-4 py-4 last:border-0"><span className="font-bold text-muted-foreground">{index + 1}</span><div><p className="font-semibold">{player.display_name}</p><p className="text-xs text-muted-foreground">Prosjek {Number(player.average_percentage).toFixed(1)}%</p></div><span className="font-bold text-accent">{Number(player.best_percentage).toFixed(0)}%</span><span className="text-sm">{player.quizzes_played}</span></div>)}</div>}
    </main>}

    <footer className="border-t border-border bg-primary text-primary-foreground"><div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-7 text-sm opacity-90 sm:flex-row sm:justify-between sm:px-6"><span>© PatriaSoul</span><button onClick={() => setScreen("rules")} className="underline underline-offset-4">Pravilnik</button></div></footer>
  </div>;
}
