import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Flag, FileText, Loader2, LogIn, LogOut, MapPin, RotateCcw, ShieldCheck, Trophy, UserRound, Medal, BookOpen } from "lucide-react";
import Pravilnik from "./pages/Pravilnik";
import QuizPlayer from "./pages/QuizPlayer";
import { fetchCities, fetchCityQuestions, shuffle } from "./lib/cityQuiz";
import { fetchMainQuizQuestions, getMainQuizCount } from "./lib/mainQuiz";
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
  const [activeQuizType, setActiveQuizType] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [loadingMainCount, setLoadingMainCount] = useState(true);
  const [mainCount, setMainCount] = useState(0);
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

  useEffect(() => {
    let cancelled = false;
    getMainQuizCount().then((count) => {
      if (!cancelled) setMainCount(count);
    }).catch(() => {
      if (!cancelled) setMainCount(0);
    }).finally(() => {
      if (!cancelled) setLoadingMainCount(false);
    });
    return () => { cancelled = true; };
  }, []);

  const acceptRules = () => {
    localStorage.setItem("patriasoul_rules_accepted", "1");
    setRulesAccepted(true);
    setScreen("home");
  };

  const signIn = async () => {
    setError("");
    if (!supabase) {
      setError("Supabase nije konfiguriran. Dodaj VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY.");
      return;
    }
    const email = window.prompt("Upiši svoju e-mail adresu:");
    if (!email) return;
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (authError) setError(authError.message);
    else setError("Provjeri e-mail i otvori poveznicu za prijavu.");
  };

  const signOut = async () => {
    await supabase?.auth.signOut();
    setUser(null);
  };

  const openCities = async () => {
    if (!rulesAccepted) {
      setScreen("rules");
      return;
    }
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

  const openLeaderboard = async (type = null) => {
    setError("");
    setScreen("leaderboard");
    setLeaderboardType(type);
    setLoadingLeaderboard(true);
    try {
      setLeaderboard(await getLeaderboard(type, 50));
    } catch (e) {
      setError(e.message || "Rang-lista se trenutno ne može učitati.");
      setLeaderboard([]);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const startCity = async (selectedCity) => {
    if (!rulesAccepted) {
      setScreen("rules");
      return;
    }
    setError("");
    setLoadingQuiz(true);
    try {
      const questions = await fetchCityQuestions(selectedCity.id);
      if (questions.length < 10) {
        throw new Error(`Za ${selectedCity.name} trenutno nije dostupno dovoljno aktivnih pitanja.`);
      }
      setCity(selectedCity);
      setActiveQuizType("city");
      setActiveCategory(null);
      setRound(shuffle(questions).slice(0, 10));
      setResult(null);
      setScreen("quiz");
    } catch (e) {
      setError(e.message || "Pitanja se trenutno ne mogu učitati.");
    } finally {
      setLoadingQuiz(false);
    }
  };

  const startMainCategory = async (category) => {
    if (!rulesAccepted) {
      setScreen("rules");
      return;
    }
    setError("");
    setLoadingQuiz(true);
    try {
      const questions = await fetchMainQuizQuestions(category[0]);
      if (questions.length < 10) {
        throw new Error(`Kategorija „${category[1]}” trenutno ima samo ${questions.length} aktivnih pitanja. Potrebno je najmanje 10.`);
      }
      setCity(null);
      setActiveQuizType("croatian");
      setActiveCategory(category[0]);
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
    setActiveQuizType(null);
    setActiveCategory(null);
    setCity(null);
  };

  const completeQuiz = async (quizResult) => {
    setResult({ ...quizResult, saving: Boolean(user) });
    setScreen("result");

    if (!user) return;

    try {
      const saved = await saveQuizResult({
        quizType: activeQuizType,
        category: activeQuizType === "croatian" ? activeCategory : null,
        citySlug: activeQuizType === "city" ? city?.slug : null,
        ...quizResult,
      });
      setResult((current) => ({ ...current, saved: saved.saved, saving: false }));
    } catch (e) {
      setResult((current) => ({ ...current, saving: false, saveError: e.message }));
    }
  };

  const restartQuiz = () => {
    if (activeQuizType === "city" && city) {
      startCity(city);
      return;
    }
    const selected = categories.find(([id]) => id === activeCategory);
    if (selected) startMainCategory(selected);
  };

  useEffect(() => {
    if (screen === "quiz") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [screen]);

  const activeCategoryTitle = categories.find(([id]) => id === activeCategory)?.[1] ?? "Hrvatski kviz";
  const quizTitle = activeQuizType === "city" ? `Brani svoj grad: ${city?.name ?? ""}` : activeCategoryTitle;
  const quizSubtitle = activeQuizType === "city" ? "75 pitanja u bazi · 10 pitanja po rundi" : `${mainCount.toLocaleString("hr-HR")} pitanja u glavnoj bazi · 10 pitanja po rundi`;

  return <div className="min-h-screen bg-background text-foreground">
    <div className="patria-stripe" />
    <header className="patria-header text-primary-foreground">
      <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-3 sm:px-6">
        <button onClick={home} className="flex shrink-0 items-center gap-3 text-left" aria-label="PatriaSoul početna"><span className="patria-brand-mark"><Flag className="relative z-10 h-5 w-5 text-white" /></span><span className="patria-brand-wordmark"><span className="block font-display text-2xl font-bold leading-none tracking-wide">PATRIA <span className="text-[#f1d078]">SOUL</span></span><span className="mt-1 block text-[10px] font-semibold uppercase tracking-[.22em] text-white/60">Znanje · Ponos · Nasljeđe</span></span></button>
        <nav className="patria-nav-scroll ml-auto flex items-center gap-1"><button onClick={home} className="patria-nav-link">⌂ Početna</button><button onClick={() => document.getElementById("kategorije")?.scrollIntoView({ behavior: "smooth" })} className="patria-nav-link"><BookOpen className="h-4 w-4" /> Hrvatski kviz</button><button onClick={() => startMainCategory(categories.find(([id]) => id === "povijest"))} className="patria-nav-link"><FileText className="h-4 w-4" /> Povijest</button><button onClick={openCities} className="patria-nav-link"><MapPin className="h-4 w-4" /> Gradovi</button><button onClick={() => startMainCategory(categories.find(([id]) => id === "vjera"))} className="patria-nav-link">✝ Vjera</button><button onClick={() => startMainCategory(categories.find(([id]) => id === "bastina"))} className="patria-nav-link">◈ Baština</button><button onClick={() => document.getElementById("nasljede")?.scrollIntoView({ behavior: "smooth" })} className="patria-nav-link"><ShieldCheck className="h-4 w-4" /> Nasljeđe</button><button onClick={() => openLeaderboard()} className="patria-nav-link"><Medal className="h-4 w-4" /> Rang-lista</button>{user ? <button onClick={signOut} className="patria-nav-link"><LogOut className="h-4 w-4" /> Odjava</button> : <button onClick={signIn} className="patria-nav-link"><LogIn className="h-4 w-4" /> Prijava</button>}</nav>
      </div>
    </header>

    {screen === "rules" && <Pravilnik onBack={() => setScreen("home")} />}

    {screen === "home" && <main>
      <section className="patria-hero"><div className="patria-hero-content mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24"><div className="max-w-4xl">
        <div className="patria-kicker mb-5"><Flag className="h-4 w-4" /> Znanje · ponos · nasljeđe</div>
        <h1 className="font-display text-5xl font-bold leading-tight sm:text-6xl">Hrvatski kviz</h1>
        <p className="mt-6 max-w-3xl text-lg text-white/80">Provjeri svoje znanje o Hrvatskoj — od povijesti i Domovinskog rata do geografije, prirode, baštine, glagoljice, vjere, sporta i znanosti.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#kategorije" className="patria-button-accent"><BookOpen className="mr-2 h-4 w-4" /> Testiraj svoje znanje</a>
          <button onClick={openCities} className="patria-button"><MapPin className="mr-2 h-4 w-4" /> Brani svoj grad</button>
          <button onClick={() => openLeaderboard()} className="patria-button"><Medal className="mr-2 h-4 w-4" /> Rang-lista</button>
        </div>
        <div className="mt-7 flex flex-wrap gap-2 text-sm text-white/70">
          <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1.5">{loadingMainCount ? "Učitavam bazu…" : `${mainCount.toLocaleString("hr-HR")} pitanja`}</span>
          <span className="rounded-full border border-border bg-card px-3 py-1.5">10 kategorija</span>
          <span className="rounded-full border border-border bg-card px-3 py-1.5">10 pitanja po rundi</span>
        </div>
        {user && <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm"><UserRound className="h-4 w-4 text-accent" /> Prijavljen korisnik</div>}
      </div></div></section>

<section id="nasljede" className="patria-section-dark border-b border-white/10"><div className="mx-auto max-w-6xl px-4 py-12 sm:px-6"><div className="mb-7"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#f1d078]">Zašto PatriaSoul?</p><h2 className="mt-2 text-3xl text-white sm:text-4xl">Testiraj. Čuvaj. Nauči. Prenesi.</h2></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><button onClick={() => document.getElementById("kategorije")?.scrollIntoView({ behavior: "smooth" })} className="patria-feature text-left"><span className="patria-icon-ring"><BookOpen className="h-5 w-5" /></span><h3 className="mt-4 text-lg text-white">TESTIRAJ SVOJE ZNANJE</h3><p className="mt-2 text-sm text-white/60">Provjeri koliko znaš o Hrvatskoj i njezinoj povijesti.</p></button><button onClick={() => document.getElementById("kategorije")?.scrollIntoView({ behavior: "smooth" })} className="patria-feature text-left"><span className="patria-icon-ring"><ShieldCheck className="h-5 w-5" /></span><h3 className="mt-4 text-lg text-white">ČUVAJ NASLJEĐE</h3><p className="mt-2 text-sm text-white/60">Upoznaj priče, mjesta, običaje i vrijednosti koje vrijedi sačuvati.</p></button><button onClick={() => startMainCategory(categories.find(([id]) => id === "povijest"))} className="patria-feature text-left"><span className="patria-icon-ring"><FileText className="h-5 w-5" /></span><h3 className="mt-4 text-lg text-white">NAUČI ŠTO JE I KAKO JE BILO</h3><p className="mt-2 text-sm text-white/60">Povijest nam pomaže razumjeti Hrvatsku danas.</p></button><button onClick={openCities} className="patria-feature text-left"><span className="patria-icon-ring"><MapPin className="h-5 w-5" /></span><h3 className="mt-4 text-lg text-white">BUDI DIO PRIČE</h3><p className="mt-2 text-sm text-white/60">Istražuj gradove, upoznaj Hrvatsku i ostavi svoj rezultat.</p></button></div></div></section>

      <section id="kategorije" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20"><p className="text-sm font-bold uppercase tracking-[.16em] text-accent">10 područja</p><h2 className="patria-accent-line mt-2 text-3xl">Odaberi kategoriju</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{categories.map(([id, title, desc], i) => <button key={id} disabled={loadingQuiz} onClick={() => startMainCategory([id, title, desc])} className="patria-card group p-5 text-left disabled:opacity-60"><div className="flex items-start justify-between gap-4"><span className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-sm font-bold text-primary">{String(i + 1).padStart(2, "0")}</span><ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" /></div><h3 className="mt-5 text-xl">{title}</h3><p className="mt-2 text-sm text-muted-foreground">{desc}</p><p className="mt-4 text-xs font-semibold text-accent">Pokreni 10 pitanja →</p></button>)}</div>
        {error && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
        {loadingQuiz && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"><div className="rounded-xl bg-card px-6 py-5 shadow-xl"><div className="flex items-center gap-3"><Loader2 className="h-5 w-5 animate-spin" /> Učitavam pitanja...</div></div></div>}
      </section>

      <section className="border-y border-border bg-secondary/40"><div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><p className="text-sm font-bold uppercase tracking-[.16em] text-accent">PatriaSoul</p><h2 className="mt-2 text-3xl">Tri načina igranja.</h2><p className="mt-3 max-w-2xl text-muted-foreground">Hrvatski kviz, Brani svoj grad i Dnevni kviz odvojeni su sustavi s vlastitim pravilima i rezultatima.</p></div><ShieldCheck className="h-12 w-12 shrink-0 text-accent" /></div></section>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6"><label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-4"><input type="checkbox" checked={rulesAccepted} onChange={(e) => { setRulesAccepted(e.target.checked); if (e.target.checked) localStorage.setItem("patriasoul_rules_accepted", "1"); else localStorage.removeItem("patriasoul_rules_accepted"); }} className="mt-1 h-4 w-4 accent-red-700" /><span className="text-sm">Prihvaćam <button onClick={(e) => { e.preventDefault(); setScreen("rules"); }} className="font-semibold text-accent underline">Pravilnik o igranju kvizova</button>.</span></label></section>
    </main>}

    {screen === "cities" && <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16"><div className="mb-8 flex items-center justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[.16em] text-accent">Brani svoj grad</p><h1 className="mt-2 font-display text-4xl font-bold">Odaberi grad</h1><p className="mt-2 text-muted-foreground">Svaki grad ima vlastiti paket od 75 pitanja.</p></div><button onClick={home} className="patria-button"><ArrowLeft className="mr-2 h-4 w-4" /> Natrag</button></div>
      {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      {loadingCities ? <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Učitavam gradove...</div> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cities.map((item) => <button key={item.id} disabled={loadingQuiz} onClick={() => startCity(item)} className="patria-card group p-4 text-left disabled:opacity-60"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold">{item.name}</h2><p className="mt-1 text-xs text-muted-foreground">{item.county || "Hrvatska"}</p></div><ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1" /></div></button>)}</div>}
      {loadingQuiz && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"><div className="rounded-xl bg-card px-6 py-5 shadow-xl"><div className="flex items-center gap-3"><Loader2 className="h-5 w-5 animate-spin" /> Učitavam pitanja...</div></div></div>}
    </main>}

    {screen === "quiz" && <QuizPlayer questions={round} title={quizTitle} subtitle={quizSubtitle} timeLimit={20} onComplete={completeQuiz} onQuit={() => activeQuizType === "city" ? setScreen("cities") : setScreen("home")} />}

    {screen === "result" && result && <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20"><div className="patria-card overflow-hidden text-center"><div className="bg-primary px-6 py-10 text-primary-foreground"><Trophy className="mx-auto h-12 w-12 text-red-300" /><p className="mt-4 text-sm font-bold uppercase tracking-[.16em] text-red-200">Rezultat</p><h1 className="mt-2 font-display text-5xl font-bold">{result.score} / {result.total}</h1><p className="mt-2 opacity-75">Vrijeme: {result.timeSeconds} s</p></div><div className="p-8"><p className="text-lg font-semibold">{result.saved ? "Rezultat je spremljen." : user ? "Rezultat se obrađuje." : "Rezultat je prikazan."}</p><p className="mt-2 text-muted-foreground">{result.saveError || (user ? "Tvoj rezultat je povezan s tvojim profilom." : "Prijavi se kako bi se rezultat mogao spremiti u tvoj račun.")}</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={restartQuiz} className="patria-button-accent"><RotateCcw className="mr-2 h-4 w-4" /> Igraj ponovno</button><button onClick={activeQuizType === "city" ? () => setScreen("cities") : home} className="patria-button">{activeQuizType === "city" ? "Odaberi drugi grad" : "Odaberi kategoriju"}</button><button onClick={() => openLeaderboard(activeQuizType)} className="patria-button">Rang-lista</button></div></div></div></main>}

    {screen === "leaderboard" && <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16"><div className="mb-8 flex items-center justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[.16em] text-accent">PatriaSoul</p><h1 className="mt-2 font-display text-4xl font-bold">Rang-lista</h1><p className="mt-2 text-muted-foreground">Rezultati igrača koji su svoje rezultate spremili u PatriaSoul.</p></div><button onClick={home} className="patria-button"><ArrowLeft className="mr-2 h-4 w-4" /> Natrag</button></div>
      <div className="mb-6 flex flex-wrap gap-2"><button onClick={() => openLeaderboard(null)} className={leaderboardType === null ? "patria-button-accent" : "patria-button"}>Sve</button><button onClick={() => openLeaderboard("city")} className={leaderboardType === "city" ? "patria-button-accent" : "patria-button"}>Brani svoj grad</button><button onClick={() => openLeaderboard("croatian")} className={leaderboardType === "croatian" ? "patria-button-accent" : "patria-button"}>Hrvatski kviz</button><button onClick={() => openLeaderboard("daily")} className={leaderboardType === "daily" ? "patria-button-accent" : "patria-button"}>Dnevni kviz</button></div>
      {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      {loadingLeaderboard ? <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Učitavam rang-listu...</div> : leaderboard.length === 0 ? <div className="patria-card p-10 text-center"><Medal className="mx-auto h-10 w-10 text-accent" /><h2 className="mt-4 text-2xl font-bold">Još nema rezultata</h2><p className="mt-2 text-muted-foreground">Prvi spremljeni rezultati pojavit će se ovdje.</p></div> : <div className="overflow-hidden rounded-xl border border-border bg-card"><div className="grid grid-cols-[48px_1fr_90px_110px] gap-3 border-b border-border bg-secondary/60 px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground"><span>#</span><span>Igrač</span><span>Najbolje</span><span>Odigrano</span></div>{leaderboard.map((player, index) => <div key={`${player.display_name}-${index}`} className="grid grid-cols-[48px_1fr_90px_110px] items-center gap-3 border-b border-border px-4 py-4 last:border-0"><span className="font-bold text-muted-foreground">{index + 1}</span><div><p className="font-semibold">{player.display_name}</p><p className="text-xs text-muted-foreground">Prosjek {Number(player.average_percentage).toFixed(1)}%</p></div><span className="font-bold text-accent">{Number(player.best_percentage).toFixed(0)}%</span><span className="text-sm">{player.quizzes_played}</span></div>)}</div>}
    </main>}

    <footer className="patria-footer"><div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12"><div className="grid gap-8 md:grid-cols-[1.3fr_1fr_1fr]"><div><div className="flex items-center gap-3"><span className="patria-brand-mark"><Flag className="relative z-10 h-5 w-5 text-white" /></span><div><div className="font-display text-2xl font-bold text-white">PATRIA <span className="text-[#f1d078]">SOUL</span></div><div className="text-[10px] font-semibold uppercase tracking-[.2em] text-white/50">Znanje · Ponos · Nasljeđe</div></div></div><p className="mt-5 max-w-md text-sm text-white/55">Hrvatska · povijest · znanje · identitet. Prostor za učenje, igru i čuvanje priča koje čine naše nasljeđe.</p></div><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#f1d078]">Brzi pristup</p><div className="mt-4 grid gap-2 text-sm text-white/70"><button onClick={home} className="text-left hover:text-white">Početna</button><button onClick={() => document.getElementById("kategorije")?.scrollIntoView({ behavior: "smooth" })} className="text-left hover:text-white">Hrvatski kviz</button><button onClick={openCities} className="text-left hover:text-white">Brani svoj grad</button><button onClick={() => openLeaderboard()} className="text-left hover:text-white">Rang-lista</button></div></div><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#f1d078]">PatriaSoul</p><div className="mt-4 grid gap-2 text-sm text-white/70"><button onClick={() => setScreen("rules")} className="text-left hover:text-white">Pravilnik o igranju</button><button onClick={signIn} className="text-left hover:text-white">{user ? "Moj račun" : "Prijava"}</button></div><p className="mt-5 font-display text-lg italic text-white/75">„Znanje čuva ono što pamtimo.”</p></div></div><div className="patria-divider mt-9" /><div className="flex flex-col gap-2 pt-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between"><span>© 2026 PatriaSoul. Sva prava pridržana.</span><span>Hrvatska · Povijest · Znanje · Identitet</span></div></div></footer>
  </div>;
}
