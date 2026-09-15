import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const navigationFix = {
  name: "patriasoul-navigation-fix",
  enforce: "pre",
  transform(code, id) {
    if (!id.endsWith("/src/App.jsx")) return null;

    const oldNav = '<button onClick={home}>Početna</button><button onClick={startDaily}>Dnevni kviz</button><button onClick={() => setScreen("cities")}>Brani svoj grad</button>';
    const newNav = '<button onClick={home}>Početna</button><button onClick={() => start()}>Hrvatski kviz</button><button onClick={startDaily}>Dnevni kviz</button><button onClick={() => setScreen("cities")}>Brani svoj grad</button>';

    const oldStart = `const start = (cat = "sve") => {
    if (!rulesAccepted) { setScreen("rules"); return; }`;
    const newStart = `const start = (cat = "sve") => {
    if (isLoadingAuth) return;
    if (!isAuthenticated) { setScreen("auth"); return; }
    if (!rulesAccepted) { setScreen("rules"); return; }`;

    const oldStartCity = `const startCity = (citySlug, cityName) => {
    if (!rulesAccepted) { setScreen("rules"); return; }`;
    const newStartCity = `const startCity = (citySlug, cityName) => {
    if (isLoadingAuth) return;
    if (!isAuthenticated) { setScreen("auth"); return; }
    if (!rulesAccepted) { setScreen("rules"); return; }`;

    const oldStartDaily = `const startDaily = () => { if (!rulesAccepted) { setScreen("rules"); return; }`;
    const newStartDaily = `const startDaily = () => { if (isLoadingAuth) return; if (!isAuthenticated) { setScreen("auth"); return; } if (!rulesAccepted) { setScreen("rules"); return; }`;

    let next = code;
    next = next.replace(oldNav, newNav);
    next = next.replace(oldStart, newStart);
    next = next.replace(oldStartCity, newStartCity);
    next = next.replace(oldStartDaily, newStartDaily);

    if (next === code) return null;
    return { code: next, map: null };
  },
};

export default defineConfig({
  base: "/kviz/",
  plugins: [navigationFix, react()],
});
