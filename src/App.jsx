import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Flag, FileText, Loader2, LogIn, LogOut, MapPin, RotateCcw, ShieldCheck, Trophy, UserRound, Medal, BookOpen } from "lucide-react";
import Pravilnik from "./pages/Pravilnik";
import QuizPlayer from "./pages/QuizPlayer";
import { fetchCities, fetchCityQuestions, shuffle } from "./lib/cityQuiz";
import { fetchMainQuizQuestions, getMainQuizCount } from "./lib/mainQuiz";
import { fetchDailyQuizQuestions, getDailyQuizKey } from "./lib/dailyQuiz";
import { getLeaderboard, hasPlayedDailyQuiz, saveQuizResult } from "./lib/results";
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
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authName, setAuthName] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authPasswordConfirm, setAuthPasswordConfirm] = useState("");
  const [authRulesAccepted, setAuthRulesAccepted] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [dailyPlayed, setDailyPlayed] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(false);

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

  const requireAuth = (action) => {
    if (user) {
      action();
      return true;
    }
    setAuthMode("login");
    setAuthRulesAccepted(false);
    setAuthName("");
    setAuthUsername("");
    setAuthEmail("");
    setAuthPassword("");
    setAuthPasswordConfirm("");
    setError("");
    setAuthOpen(true);
    return false;
  };

  const signIn = () => {
    setAuthRulesAccepted(false);
    setAuthEmail("");
    setError("");
    setAuthOpen(true);
  };

  const getAuthRedirectUrl = () => {
    const baseUrl = import.meta.env.BASE_URL || "/";
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (isLocal) return new URL(baseUrl, window.location.origin).toString();
    return "https://patriasoul.github.io/kviz/";
  };

  const validateAuth = () => {
    if (!authRulesAccepted) {
      setError("Za nastavak moraš prihvatiti Pravilnik o igranju kvizova.");
      return false;
    }
    if (!supabase) {
      setError("Supabase nije konfiguriran.");
      return false;
    }
    if (!authEmail.trim()) {
      setError("Upiši svoju e-mail adresu.");
      return false;
    }
    if (authPassword.length < 6) {
      setError("Lozinka mora imati najmanje 6 znakova.");
      return false;
    }
    return true;
  };

  const submitAuth = async () => {
    setError("");
    if (!validateAuth()) return;
    if (authMode === "register") {
      if (!authName.trim() || !authUsername.trim()) {
        setError("Upiši ime i prezime te korisničko ime.");
        return;
      }
      if (authPassword !== authPasswordConfirm) {
        setError("Lozinke se ne podudaraju.");
        return;
      }
    }

    setAuthLoading(true);
    const result = authMode === "register"
      ? await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
          options: {
            emailRedirectTo: getAuthRedirectUrl(),
            data: { full_name: authName.trim(), username: authUsername.trim() },
          },
        })
      : await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword,
        });
    setAuthLoading(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (authMode === "register" && !result.data.session) {
      setAuthOpen(false);
      setError("Račun je napravljen. Provjeri e-mail i potvrdi adresu prije prve prijave.");
      return;
    }

    setAuthOpen(false);
    setError("");
  };

  const signInWithProvider = async (provider) => {
    setError("");
    if (!authRulesAccepted) {
      setError("Za nastavak moraš prihvatiti Pravilnik o igranju kvizova.");
      return;
    }
    if (!supabase) {
      setError("Supabase nije konfiguriran.");
      return;
    }
    setAuthLoading(true);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: getAuthRedirectUrl() },
    });
    setAuthLoading(false);
    if (authError) setError(authError.message);
  };

  const resetPassword = async () => {
    setError("");
    if (!supabase || !authEmail.trim()) {
      setError("Upiši e-mail adresu za obnovu lozinke.");
      return;
    }
    setAuthLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(authEmail.trim(), {
      redirectTo: getAuthRedirectUrl(),
    });
    setAuthLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setError("Poslan je e-mail za obnovu lozinke.");
  };

  const signOut = async () => {
    await supabase?.auth.signOut();
    setUser(null);
  };

  const openCities = async () => {
    if (!user) {
      requireAuth(openCities);
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

  const openDaily = async () => {
    if (!user) {
      requireAuth(openDaily);
      return;
    }
    setError("");
    setScreen("daily");
    setLoadingDaily(true);
    try {
      setDailyPlayed(await hasPlayedDailyQuiz(user.id));
    } catch (e) {
      setError(e.message || "Dnevni kviz trenutno nije moguće provjeriti.");
    } finally {
      setLoadingDaily(false);
    }
  };

  const startDaily = async () => {
    if (!user) {
      requireAuth(startDaily);
      return;
    }
    setError("");
    setLoadingQuiz(true);
    try {
      const alreadyPlayed = await hasPlayedDailyQuiz(user.id);
      setDailyPlayed(alreadyPlayed);
      if (alreadyPlayed) {
        setScreen("daily");
        throw new Error("Današnji Dnevni kviz već je odigran. Novi kviz bit će dostupan sutra.");
      }
      const questions = await fetchDailyQuizQuestions();
      setCity(null);
      setActiveQuizType("daily");
      setActiveCategory(null);
      setRound(questions);
      setResult(null);
      setScreen("quiz");
    } catch (e) {
      setError(e.message || "Dnevni kviz trenutno nije moguće pokrenuti.");
    } finally {
      setLoadingQuiz(false);
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
    if (!user) {
      requireAuth(() => startCity(selectedCity));
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
    if (!user) {
      requireAuth(() => startMainCategory(category));
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
    if (activeQuizType === "daily") {
      setScreen("daily");
      return;
    }
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
  const quizTitle = activeQuizType === "city"
    ? `Brani svoj grad: ${city?.name ?? ""}`
    : activeQuizType === "daily"
      ? "Dnevni kviz"
      : activeCategoryTitle;
  const quizSubtitle = activeQuizType === "city"
    ? "75 pitanja u bazi · 10 pitanja po rundi"
    : activeQuizType === "daily"
      ? `10 pomiješanih pitanja · ${getDailyQuizKey()}`
      : `${mainCount.toLocaleString("hr-HR")} pitanja u glavnoj bazi · 10 pitanja po rundi`;

  return <div className="min-h-screen bg-background text-foreground">
    <div className="patria-stripe" />
    <header className="patria-header text-primary-foreground">
      <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-3 sm:px-6">
        <button onClick={home} className="flex shrink-0 items-center gap-3 text-left" aria-label="PatriaSoul početna"><span className="patria-brand-mark flex items-center"><img src="https://raw.githubusercontent.com/Patriasoul/patriasoul/main/images/file_0000000082ec81f4a6fc17bdbd959622_114540.png" alt="PatriaSoul" className="h-10 w-auto object-contain" /></span></button>
        <nav className="patria-nav-scroll ml-auto flex items-center gap-1"><button onClick={home} className="patria-nav-link">⌂ Početna</button><button onClick={() => document.getElementById("kategorije")?.scrollIntoView({ behavior: "smooth" })} className="patria-nav-link"><BookOpen className="h-4 w-4" /> Hrvatski kviz</button><button onClick={openCities} className="patria-nav-link"><MapPin className="h-4 w-4" /> Brani svoj grad</button><button onClick={openDaily} className="patria-nav-link">📅 Dnevni kviz</button><button onClick={() => openLeaderboard()} className="patria-nav-link"><Medal className="h-4 w-4" /> Rang-lista</button>{user ? <button onClick={signOut} className="patria-nav-link"><LogOut className="h-4 w-4" /> Moj račun</button> : <button onClick={signIn} className="patria-nav-link"><LogIn className="h-4 w-4" /> Moj račun</button>}</nav>
      </div>
    </header>

    <div className="patria-portal-bar"><div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6"><div className="flex items-center gap-2 text-sm text-white/70"><span className="hidden sm:inline">PatriaSoul Kviz</span><span className="hidden sm:inline text-white/30">·</span><span>Povratak na glavni portal</span></div><a href="https://patriasoul.github.io/" className="patria-portal-button" aria-label="Povratak na PatriaSoul portal"><ArrowLeft className="h-5 w-5" /> Povratak na PatriaSoul portal</a></div></div>
    {authOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4" onClick={() => !authLoading && setAuthOpen(false)}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">PatriaSoul račun</p>
          <h2 className="mt-2 font-display text-3xl font-bold">{authMode === "login" ? "Prijava" : "Registracija"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {authMode === "login" ? "Prijavi se i nastavi igrati PatriaSoul." : "Izradi svoj PatriaSoul račun."}
          </p>
        </div>

        <div className="grid gap-2">
          <button disabled={authLoading} onClick={() => signInWithProvider("google")} className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-background px-4 py-3 font-semibold transition hover:bg-secondary disabled:opacity-60">
            <span className="flex h-5 w-5 items-center justify-center" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="#4285F4" d="M21.35 12.23c0-.79-.07-1.55-.22-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.42Z"/><path fill="#34A853" d="M12 21.5c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.5Z"/><path fill="#FBBC05" d="M6.54 13.59A5.85 5.85 0 0 1 6.24 12c0-.55.1-1.09.3-1.59V7.88H3.3A9.74 9.74 0 0 0 2.25 12c0 1.57.38 3.06 1.05 4.12l3.24-2.53Z"/><path fill="#EA4335" d="M12 6.38c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.84 3.35 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.7 5.38l3.24 2.53C7.31 8.1 9.46 6.38 12 6.38Z"/></svg>
            </span>
            Nastavi s Googleom
          </button>

        </div>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" /> ili <span className="h-px flex-1 bg-border" /></div>

        {authMode === "register" && <>
          <label className="block text-sm font-semibold">
            Ime i prezime
            <input value={authName} onChange={(e) => setAuthName(e.target.value)} type="text" autoComplete="name" placeholder="Ime i prezime" className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
          </label>
          <label className="mt-4 block text-sm font-semibold">
            Korisničko ime
            <input value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} type="text" autoComplete="username" placeholder="npr. patriasoul123" className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
          </label>
        </>}

        <label className="mt-4 block text-sm font-semibold">
          E-mail adresa
          <input value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} type="email" autoComplete="email" placeholder="tvoj@email.com" className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
        </label>

        <label className="mt-4 block text-sm font-semibold">
          Lozinka
          <input value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} type="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} placeholder="Najmanje 6 znakova" className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
        </label>

        {authMode === "register" && <label className="mt-4 block text-sm font-semibold">
          Potvrda lozinke
          <input value={authPasswordConfirm} onChange={(e) => setAuthPasswordConfirm(e.target.value)} type="password" autoComplete="new-password" placeholder="Ponovi lozinku" className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
        </label>}

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-secondary/40 p-4">
          <input type="checkbox" checked={authRulesAccepted} onChange={(e) => setAuthRulesAccepted(e.target.checked)} className="mt-1 h-4 w-4 accent-red-700" />
          <span className="text-sm">Prihvaćam <button type="button" onClick={() => setScreen("rules")} className="font-semibold text-accent underline">Pravilnik o igranju kvizova</button>.</span>
        </label>

        {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

        <button disabled={authLoading} onClick={submitAuth} className="patria-button-accent mt-5 w-full">
          {authLoading ? "Obrađujem..." : authMode === "login" ? "Prijavi se" : "Registriraj se"}
        </button>

        {authMode === "login" && <button disabled={authLoading} onClick={resetPassword} className="mt-3 w-full text-center text-sm font-semibold text-accent hover:underline">Zaboravili ste lozinku?</button>}

        <div className="mt-5 text-center text-sm text-muted-foreground">
          {authMode === "login" ? "Nemate račun?" : "Već imate račun?"}{" "}
          <button type="button" onClick={() => { setError(""); setAuthMode(authMode === "login" ? "register" : "login"); }} className="font-semibold text-accent hover:underline">
            {authMode === "login" ? "Registrirajte se" : "Prijavite se"}
          </button>
        </div>
      </div>
    </div>}

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

      <section id="dnevni-kviz" className="border-y border-border bg-secondary/40">
  <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-sm font-bold uppercase tracking-[.16em] text-accent">Dnevni izazov</p>
        <h2 className="mt-2 text-3xl">10 pomiješanih pitanja svaki dan.</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">Svi sudionici na isti dan dobivaju isti skup od 10 pitanja iz glavne baze. Jedan službeni pokušaj vrijedi za taj dan.</p>
      </div>
      <button onClick={openDaily} className="patria-button-accent shrink-0">Otvori Dnevni kviz</button>
    </div>
  </div>
</section>

<section className="border-b border-border bg-background">
  <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6">
    <div>
      <p className="text-sm font-bold uppercase tracking-[.16em] text-accent">PatriaSoul</p>
      <h2 className="mt-2 text-3xl">Tri načina igranja.</h2>
      <p className="mt-3 max-w-2xl text-muted-foreground">Hrvatski kviz, Brani svoj grad i Dnevni kviz odvojeni su sustavi s vlastitim pravilima i rezultatima.</p>
    </div>
    <ShieldCheck className="h-12 w-12 shrink-0 text-accent" />
  </div>
</section>

    </main>}

    {screen === "cities" && <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16"><div className="mb-8 flex items-center justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[.16em] text-accent">Brani svoj grad</p><h1 className="mt-2 font-display text-4xl font-bold">Odaberi grad</h1><p className="mt-2 text-muted-foreground">Svaki grad ima vlastiti paket od 75 pitanja.</p></div><button onClick={home} className="patria-button"><ArrowLeft className="mr-2 h-4 w-4" /> Natrag</button></div>
      {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      {loadingCities ? <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Učitavam gradove...</div> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cities.map((item) => <button key={item.id} disabled={loadingQuiz} onClick={() => startCity(item)} className="patria-card group p-4 text-left disabled:opacity-60"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold">{item.name}</h2><p className="mt-1 text-xs text-muted-foreground">{item.county || "Hrvatska"}</p></div><ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1" /></div></button>)}</div>}
      {loadingQuiz && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"><div className="rounded-xl bg-card px-6 py-5 shadow-xl"><div className="flex items-center gap-3"><Loader2 className="h-5 w-5 animate-spin" /> Učitavam pitanja...</div></div></div>}
    </main>}

    {screen === "daily" && <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="patria-card overflow-hidden">
        <div className="bg-primary px-6 py-10 text-primary-foreground">
          <p className="text-sm font-bold uppercase tracking-[.16em] text-red-200">Dnevni kviz</p>
          <h1 className="mt-2 font-display text-4xl font-bold">Današnji izazov</h1>
          <p className="mt-3 text-white/75">{getDailyQuizKey()} · 10 pomiješanih pitanja</p>
        </div>
        <div className="p-8">
          {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
          {loadingDaily ? <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Provjeravam današnji pokušaj...</div> : dailyPlayed ? (
            <div className="text-center">
              <Trophy className="mx-auto h-10 w-10 text-accent" />
              <h2 className="mt-4 text-2xl font-bold">Današnji kviz je već odigran.</h2>
              <p className="mt-2 text-muted-foreground">Za svakog igrača vrijedi jedan službeni pokušaj dnevno. Novi skup pitanja bit će dostupan sutra.</p>
              <button onClick={() => openLeaderboard("daily")} className="patria-button-accent mt-6">Pogledaj rang-listu</button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-lg font-semibold">Isti skup pitanja vrijedi za sve sudionike danas.</p>
              <p className="mt-2 text-muted-foreground">Pitanja su deterministički odabrana iz svih aktivnih pitanja glavnog kviza i pomiješana kroz glavne kategorije.</p>
              <button onClick={startDaily} className="patria-button-accent mt-6">Započni današnji kviz</button>
            </div>
          )}
          <button onClick={home} className="patria-button mt-4 w-full sm:w-auto"><ArrowLeft className="mr-2 h-4 w-4" /> Natrag</button>
        </div>
      </div>
    </main>}

    {screen === "quiz" && <QuizPlayer questions={round} title={quizTitle} subtitle={quizSubtitle} timeLimit={20} onComplete={completeQuiz} onQuit={() => activeQuizType === "city" ? setScreen("cities") : activeQuizType === "daily" ? setScreen("daily") : setScreen("home")} />}

    {screen === "result" && result && <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20"><div className="patria-card overflow-hidden text-center"><div className="bg-primary px-6 py-10 text-primary-foreground"><Trophy className="mx-auto h-12 w-12 text-red-300" /><p className="mt-4 text-sm font-bold uppercase tracking-[.16em] text-red-200">Rezultat</p><h1 className="mt-2 font-display text-5xl font-bold">{result.score} / {result.total}</h1><p className="mt-2 opacity-75">Vrijeme: {result.timeSeconds} s</p></div><div className="p-8"><p className="text-lg font-semibold">{result.saved ? "Rezultat je spremljen." : user ? "Rezultat se obrađuje." : "Rezultat je prikazan."}</p><p className="mt-2 text-muted-foreground">{result.saveError || (user ? "Tvoj rezultat je povezan s tvojim profilom." : "Prijavi se kako bi se rezultat mogao spremiti u tvoj račun.")}</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">{activeQuizType !== "daily" && <button onClick={restartQuiz} className="patria-button-accent"><RotateCcw className="mr-2 h-4 w-4" /> Igraj ponovno</button>}
          {activeQuizType === "daily" && <button onClick={() => setScreen("daily")} className="patria-button-accent">Dnevni kviz</button>}<button onClick={activeQuizType === "city" ? () => setScreen("cities") : home} className="patria-button">{activeQuizType === "city" ? "Odaberi drugi grad" : "Odaberi kategoriju"}</button><button onClick={() => openLeaderboard(activeQuizType)} className="patria-button">Rang-lista</button></div></div></div></main>}

    {screen === "leaderboard" && <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16"><div className="mb-8 flex items-center justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[.16em] text-accent">PatriaSoul</p><h1 className="mt-2 font-display text-4xl font-bold">Rang-lista</h1><p className="mt-2 text-muted-foreground">Rezultati igrača koji su svoje rezultate spremili u PatriaSoul.</p></div><button onClick={home} className="patria-button"><ArrowLeft className="mr-2 h-4 w-4" /> Natrag</button></div>
      <div className="mb-6 flex flex-wrap gap-2"><button onClick={() => openLeaderboard(null)} className={leaderboardType === null ? "patria-button-accent" : "patria-button"}>Sve</button><button onClick={() => openLeaderboard("city")} className={leaderboardType === "city" ? "patria-button-accent" : "patria-button"}>Brani svoj grad</button><button onClick={() => openLeaderboard("croatian")} className={leaderboardType === "croatian" ? "patria-button-accent" : "patria-button"}>Hrvatski kviz</button><button onClick={() => openLeaderboard("daily")} className={leaderboardType === "daily" ? "patria-button-accent" : "patria-button"}>Dnevni kviz</button></div>
      {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      {loadingLeaderboard ? <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Učitavam rang-listu...</div> : leaderboard.length === 0 ? <div className="patria-card p-10 text-center"><Medal className="mx-auto h-10 w-10 text-accent" /><h2 className="mt-4 text-2xl font-bold">Još nema rezultata</h2><p className="mt-2 text-muted-foreground">Prvi spremljeni rezultati pojavit će se ovdje.</p></div> : <div className="overflow-hidden rounded-xl border border-border bg-card"><div className="grid grid-cols-[48px_1fr_90px_110px] gap-3 border-b border-border bg-secondary/60 px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground"><span>#</span><span>Igrač</span><span>Najbolje</span><span>Odigrano</span></div>{leaderboard.map((player, index) => <div key={`${player.display_name}-${index}`} className="grid grid-cols-[48px_1fr_90px_110px] items-center gap-3 border-b border-border px-4 py-4 last:border-0"><span className="font-bold text-muted-foreground">{index + 1}</span><div><p className="font-semibold">{player.display_name}</p><p className="text-xs text-muted-foreground">Prosjek {Number(player.average_percentage).toFixed(1)}%</p></div><span className="font-bold text-accent">{Number(player.best_percentage).toFixed(0)}%</span><span className="text-sm">{player.quizzes_played}</span></div>)}</div>}
    </main>}

    <footer className="patria-footer"><div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12"><div className="grid gap-8 md:grid-cols-[1.3fr_1fr_1fr]"><div><div className="flex items-center gap-3"><span className="patria-brand-mark flex items-center"><img src="https://raw.githubusercontent.com/Patriasoul/patriasoul/main/images/file_0000000082ec81f4a6fc17bdbd959622_114540.png" alt="PatriaSoul" className="h-12 w-auto object-contain" /></span></div><p className="mt-5 max-w-md text-sm text-white/55">Hrvatska · povijest · znanje · identitet. Prostor za učenje, igru i čuvanje priča koje čine naše nasljeđe.</p></div><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#f1d078]">Brzi pristup</p><div className="mt-4 grid gap-2 text-sm text-white/70"><button onClick={home} className="text-left hover:text-white">Početna</button><button onClick={() => document.getElementById("kategorije")?.scrollIntoView({ behavior: "smooth" })} className="text-left hover:text-white">Hrvatski kviz</button><button onClick={openCities} className="text-left hover:text-white">Brani svoj grad</button><button onClick={() => openLeaderboard()} className="text-left hover:text-white">Rang-lista</button></div></div><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#f1d078]">PatriaSoul</p><p className="mt-4 max-w-xs text-sm text-white/60">Prati PatriaSoul na TikToku i budi uz nas dok kroz kratke priče, zanimljivosti i kvizove upoznajemo Hrvatsku.</p>
<a href="https://www.tiktok.com/@patriasoul" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/15">
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M16.6 3c.3 1.8 1.3 3.1 3.4 3.5v3.1c-1.5-.1-2.8-.6-4-1.5v6.4c0 4.1-2.8 6.5-6.3 6.5-3.3 0-5.7-2.2-5.7-5.3 0-3.4 2.7-5.7 6.3-5.7.3 0 .7 0 1 .1v3.2c-.3-.1-.6-.2-1-.2-1.5 0-2.9.9-2.9 2.5 0 1.4 1 2.4 2.4 2.4 1.8 0 2.8-1.3 2.8-3.6V3h4z"/></svg>
  Prati nas na TikToku
</a>
<p className="mt-7 max-w-xs text-sm leading-6 text-white/70">Vjera, nada i istina kroz priču o Yeshui — Isusu Kristu. Sadržaj za one koji žele upoznati Njegovu riječ, život i poruku te dublje promišljati o vjeri.</p>
<a href="https://www.tiktok.com/@hajdi331?lang=hr" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/15">
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M16.6 3c.3 1.8 1.3 3.1 3.4 3.5v3.1c-1.5-.1-2.8-.6-4-1.5v6.4c0 4.1-2.8 6.5-6.3 6.5-3.3 0-5.7-2.2-5.7-5.3 0-3.4 2.7-5.7 6.3-5.7.3 0 .7 0 1 .1v3.2c-.3-.1-.6-.2-1-.2-1.5 0-2.9.9-2.9 2.5 0 1.4 1 2.4 2.4 2.4 1.8 0 2.8-1.3 2.8-3.6V3h4z"/></svg>
  Prati vjerski kanal na TikToku
</a><div className="mt-5 grid gap-2 text-sm text-white/70"><button onClick={() => setScreen("rules")} className="text-left hover:text-white">Pravilnik o igranju</button><a href="/kviz/terms.html" className="text-left hover:text-white">Pravila korištenja</a><a href="/kviz/privacy.html" className="text-left hover:text-white">Politika privatnosti</a><button onClick={signIn} className="text-left hover:text-white">{user ? "Moj račun" : "Prijava"}</button></div><p className="mt-5 font-display text-lg italic text-white/75">„Znanje čuva ono što pamtimo.”</p></div></div><div className="patria-divider mt-9" /><div className="flex flex-col gap-2 pt-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between"><span>© 2026 PatriaSoul. Sva prava pridržana.</span><span>Hrvatska · Povijest · Znanje · Identitet</span></div></div></footer>
  </div>;
}
