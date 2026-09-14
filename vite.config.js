import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const navigationFix = {
  name: "patriasoul-navigation-fix",
  enforce: "pre",
  transform(code, id) {
    if (!id.endsWith("/src/App.jsx")) return null;

    const oldNav = '<button onClick={home}>Početna</button><button onClick={startDaily}>Dnevni kviz</button><button onClick={() => setScreen("cities")}>Brani svoj grad</button>';
    const newNav = '<button onClick={home}>Početna</button><button onClick={() => start()}>Hrvatski kviz</button><button onClick={startDaily}>Dnevni kviz</button><button onClick={() => setScreen("cities")}>Brani svoj grad</button>';

    if (!code.includes(oldNav)) return null;
    return { code: code.replace(oldNav, newNav), map: null };
  },
};

export default defineConfig({
  base: "/kviz/",
  plugins: [navigationFix, react()],
});
