import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const navigationFix = {
  name: "patriasoul-navigation-fix",
  enforce: "pre",
  transform(code, id) {
    if (!id.endsWith("/src/App.jsx")) return null;

    const oldNav = '<button onClick={home}>Početna</button><button onClick={startDaily}>Dnevni kviz</button><button onClick={() => setScreen("cities")}>Brani svoj grad</button>';
    const newNav = '<button onClick={home}>Početna</button><button onClick={() => start()}>Hrvatski kviz</button><button onClick={startDaily}>Dnevni kviz</button><button onClick={() => setScreen("cities")}>Brani svoj grad</button>';

    const oldStart = `const start = (cat = "sve") => {\n    if (!rulesAccepted) { setScreen("rules"); return; }`;
    const newStart = `const start = (cat = "sve") => {\n    if (isLoadingAuth) return;\n    if (!isAuthenticated) { setScreen("auth"); return; }\n    if (!rulesAccepted) { setScreen("rules"); return; }`;

    const oldStartCity = `const startCity = (citySlug, cityName) => {\n    if (!rulesAccepted) { setScreen("rules"); return; }`;
    const newStartCity = `const startCity = (citySlug, cityName) => {\n    if (isLoadingAuth) return;\n    if (!isAuthenticated) { setScreen("auth"); return; }\n    if (!rulesAccepted) { setScreen("rules"); return; }`;

    const oldStartDaily = `const startDaily = () => { if (!rulesAccepted) { setScreen("rules"); return; }`;
    const newStartDaily = `const startDaily = () => { if (isLoadingAuth) return; if (!isAuthenticated) { setScreen("auth"); return; } if (!rulesAccepted) { setScreen("rules"); return; }`;

    const oldHero = '<h1 className="font-display text-5xl font-bold leading-tight sm:text-6xl">Hrvatski kviz</h1>';
    const newHero = '<h1 className="font-display text-5xl font-bold leading-tight sm:text-6xl">{isAuthenticated ? `${(user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Igraču").toUpperCase()}, DOBRO DOŠAO U PATRIA SOUL` : "Hrvatski kviz"}</h1>';

    const oldDescription = '<p className="mt-5 max-w-2xl text-lg text-muted-foreground">Provjeri svoje znanje o Hrvatskoj — pitanja se uzimaju iz postojeće PatriaSoul baze i svaki se kviz nasumično razvrtava.</p>';
    const newDescription = '<p className="mt-5 max-w-2xl text-lg text-muted-foreground">{isAuthenticated ? "Tvoje natjecanje, tvoj napredak i tvoje mjesto na PatriaSoul rang-listi." : "Provjeri svoje znanje o Hrvatskoj — prijavom pratiš rezultate, osvajaš XP, razine i bedževe te sudjeluješ u natjecanju."}</p>';

    const oldHomeCards = '<section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16"><div className="grid gap-6 lg:grid-cols-2">';
    const newHomeCards = '<section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{isAuthenticated && <><article className="patria-card border-red-200 bg-red-50/60 p-5"><p className="text-xs font-bold uppercase tracking-[.14em] text-accent">Tvoj profil</p><h2 className="mt-2 font-display text-2xl font-bold">Nastavi natjecanje</h2><p className="mt-2 text-sm text-muted-foreground">Pregledaj XP, razine i osvojene značke.</p><button onClick={() => setScreen("profile")} className="patria-button-accent mt-4">Moj profil <ArrowRight className="ml-2 h-4 w-4" /></button></article><article className="patria-card bg-primary p-5 text-primary-foreground"><p className="text-xs font-bold uppercase tracking-[.14em] text-red-200">Natjecanje</p><h2 className="mt-2 font-display text-2xl font-bold">Rang-lista</h2><p className="mt-2 text-sm opacity-80">Provjeri svoje mjesto među igračima.</p><button onClick={openLeaderboard} className="mt-4 inline-flex items-center justify-center rounded-md bg-white px-4 py-2 font-semibold text-primary">Otvori rang-listu <Trophy className="ml-2 h-4 w-4" /></button></article></>}';

    let next = code;
    next = next.replace(oldNav, newNav);
    next = next.replace(oldStart, newStart);
    next = next.replace(oldStartCity, newStartCity);
    next = next.replace(oldStartDaily, newStartDaily);
    next = next.replace(oldHero, newHero);
    next = next.replace(oldDescription, newDescription);
    next = next.replace(oldHomeCards, newHomeCards);

    if (next === code) return null;
    return { code: next, map: null };
  },
};

export default defineConfig({
  base: "/kviz/",
  plugins: [navigationFix, react()],
});
