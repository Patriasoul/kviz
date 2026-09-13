# PatriaSoul — Hrvatski kviz

Nova verzija PatriaSoul kviza gradi se od nule.

## Struktura

```text
.
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── src/
    ├── App.jsx
    ├── main.jsx
    └── index.css
```

## Vizualni identitet

- bijela i vrlo svijetla osnovna podloga
- tamnoplava kao glavna boja
- hrvatska crvena kao diskretan naglasak
- vrlo malo zlatnih/neutralnih tonova gdje budu potrebni
- Playfair Display za naslove
- Inter za osnovni tekst
- diskretan šahovski uzorak samo na elementima gdje ima smisla

## Razvoj

```bash
npm install
npm run dev
```

Produkcijska provjera:

```bash
npm run build
```

## Plan sustava

1. Hrvatski kviz — 2000 pitanja u 10 kategorija
2. Brani svoj grad — zaseban sustav, 75 pitanja po gradu
3. Dnevni kviz — 10 pitanja dnevno iz glavne baze
4. Autentikacija i korisnički profili
5. Rang-lista
6. Supabase baza i sigurnosna pravila
