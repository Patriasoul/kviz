(() => {
  const root = document.documentElement;
  const path = window.location.pathname;
  const appBase = "/kviz/";
  const links = {
    home: appBase,
    croatian: appBase + "?mode=croatian",
    cities: appBase + "?mode=cities",
    daily: appBase + "?mode=daily",
    leaderboard: appBase + "?mode=leaderboard",
    account: appBase + "?mode=account",
    about: appBase + "about.html",
    contact: appBase + "contact.html",
    rules: appBase + "rules.html",
    terms: appBase + "terms.html",
    privacy: appBase + "privacy.html"
  };

  const style = document.createElement("style");
  style.textContent = `
    body{padding-top:0!important}
    body>.topline,body>header,body>footer{display:none!important}
    #patria-shared-shell{position:relative;z-index:100}
    .ps-stripe{height:4px;background:linear-gradient(90deg,#b51f35 0 33.33%,#fff 33.33% 66.66%,#193452 66.66%)}
    .ps-header{position:sticky;top:0;z-index:100;background:linear-gradient(180deg,rgba(4,15,29,.99),rgba(8,24,43,.97));box-shadow:0 10px 30px rgba(0,0,0,.25);backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,255,255,.08)}
    .ps-header-inner{max-width:1400px;margin:auto;min-height:72px;padding:9px 20px;display:flex;align-items:center;gap:16px}
    .ps-logo{display:block;width:auto;max-width:190px;height:48px;object-fit:contain}
    .ps-brand{display:inline-flex;align-items:center;flex:0 0 auto}
    .ps-nav{margin-left:auto;display:flex;align-items:center;gap:2px;flex-wrap:wrap}
    .ps-nav a{position:relative;display:inline-flex;min-height:44px;align-items:center;padding:8px 10px;color:rgba(255,255,255,.84);font:600 .88rem/1 Inter,system-ui,sans-serif;text-decoration:none;white-space:nowrap}
    .ps-nav a:hover{color:#fff;transform:translateY(-1px)}
    .ps-nav a:after{content:"";position:absolute;left:10px;right:10px;bottom:0;height:3px;border-radius:999px;background:#f1d078;transform:scaleX(0);transition:transform .2s ease}
    .ps-nav a:hover:after{transform:scaleX(1)}
    .ps-menu{display:none;margin-left:auto}
    .ps-menu summary{list-style:none;cursor:pointer;width:46px;height:46px;display:grid;place-items:center;border:1px solid rgba(240,206,115,.55);border-radius:11px;color:#f6d47e;background:rgba(255,255,255,.055);font-size:24px}
    .ps-menu summary::-webkit-details-marker{display:none}
    .ps-mobile{display:grid;gap:7px;padding:8px 14px 14px;border-top:1px solid rgba(213,168,67,.18);background:linear-gradient(180deg,rgba(6,19,33,.99),rgba(8,24,43,.99))}
    .ps-mobile a{display:flex;min-height:48px;align-items:center;border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:10px 13px;color:#fff;text-decoration:none;font-weight:700}
    .ps-footer{position:relative;overflow:hidden;margin-top:70px;background:linear-gradient(180deg,#061321,#040c15);color:#fff;border-top:1px solid rgba(213,168,67,.25)}
    .ps-footer:before{content:"";position:absolute;width:32rem;height:32rem;left:50%;top:-18rem;transform:translateX(-50%);border-radius:50%;background:rgba(35,78,116,.24);filter:blur(18px)}
    .ps-footer-inner{position:relative;z-index:1;max-width:1152px;margin:auto;padding:48px 20px 28px}
    .ps-footer-grid{display:grid;grid-template-columns:1.2fr .8fr 1.45fr;gap:40px}
    .ps-footer-logo-wrap{display:inline-flex;align-items:center;justify-content:center;min-height:76px;min-width:170px;padding:6px 13px;border:1px solid rgba(213,168,67,.22);border-radius:14px;background:linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.015));box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 12px 30px rgba(0,0,0,.18)}
    .ps-footer-logo{display:block;width:auto;max-width:210px;height:62px;object-fit:contain}
    .ps-footer-copy{margin:20px 0 0;max-width:420px;color:rgba(255,255,255,.65);font-size:14px;line-height:1.9}
    .ps-motto{display:inline-flex;align-items:center;gap:7px;margin-top:20px;padding:7px 12px;border:1px solid rgba(213,168,67,.25);border-radius:999px;color:#f1d078;background:rgba(213,168,67,.06);font-size:11px;font-weight:800;letter-spacing:.13em;text-transform:uppercase}
    .ps-heading{margin:0;color:#f1d078;font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase}
    .ps-footer-links{display:grid;gap:10px;margin-top:16px}
    .ps-footer-links a,.ps-legal a{width:max-content;color:rgba(255,255,255,.68);text-decoration:none;font-size:14px}
    .ps-footer-links a:hover,.ps-legal a:hover{color:#fff;transform:translateX(3px)}
    .ps-social{display:grid;gap:14px}
    .ps-social-card{display:grid;gap:12px;margin-top:16px;padding:16px;border:1px solid rgba(255,255,255,.09);border-radius:14px;background:linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.018));box-shadow:inset 0 1px 0 rgba(255,255,255,.04)}
    .ps-social-card.faith{border-color:rgba(213,168,67,.18);background:linear-gradient(145deg,rgba(213,168,67,.07),rgba(255,255,255,.018))}
    .ps-social-label{color:rgba(255,255,255,.92);font-size:13px;font-weight:800}
    .ps-social-card p{margin:6px 0 0!important;color:rgba(255,255,255,.62)!important;font-size:12px!important;line-height:1.65!important}
    .ps-social-button{display:inline-flex;width:max-content;min-height:40px;align-items:center;justify-content:center;border:1px solid rgba(240,206,115,.58);border-radius:10px;padding:8px 13px;background:linear-gradient(135deg,rgba(246,212,126,.14),rgba(201,150,50,.08));color:#f6d47e!important;text-decoration:none!important;font-size:12px;font-weight:800}
    .ps-social-button:hover{border-color:#f6d47e;background:linear-gradient(135deg,rgba(246,212,126,.22),rgba(201,150,50,.14));color:#fff!important}
    .ps-legal{display:grid;gap:9px;margin-top:18px;padding-top:16px;border-top:1px solid rgba(255,255,255,.08)}
    .ps-divider{height:1px;margin-top:40px;background:rgba(255,255,255,.08)}
    .ps-bottom{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;padding-top:18px;color:rgba(255,255,255,.45);font-size:11px}
    @media(max-width:900px){.ps-nav{display:none}.ps-menu{display:block}.ps-footer-grid{grid-template-columns:1fr 1fr}}
    @media(max-width:600px){.ps-header-inner{padding:9px 14px}.ps-footer-grid{grid-template-columns:1fr}.ps-footer-inner{padding:38px 16px 24px}.ps-bottom{display:grid}.ps-footer{margin-top:48px}}
  `;
  document.head.appendChild(style);

  const header = `
    <div class="ps-stripe"></div>
    <header class="ps-header">
      <div class="ps-header-inner">
        <a class="ps-brand" href="${links.home}" aria-label="PatriaSoul početna">
          <img class="ps-logo" src="https://raw.githubusercontent.com/Patriasoul/patriasoul/main/images/file_0000000082ec81f4a6fc17bdbd959622_114540.png" alt="PatriaSoul">
        </a>
        <nav class="ps-nav" aria-label="Glavna navigacija">
          <a href="${links.home}">⌂ Početna</a>
          <a href="${links.croatian}">📖 Hrvatski kviz</a>
          <a href="${links.cities}">📍 Brani svoj grad</a>
          <a href="${links.daily}">📅 Dnevni kviz</a>
          <a href="${links.leaderboard}">🏅 Rang-lista</a>
          <a href="${links.account}">👤 Prijava</a>
        </nav>
        <details class="ps-menu">
          <summary aria-label="Otvori izbornik">☰</summary>
          <nav class="ps-mobile" aria-label="Mobilna navigacija">
            <a href="${links.home}">⌂ Početna</a>
            <a href="${links.croatian}">📖 Hrvatski kviz</a>
            <a href="${links.cities}">📍 Brani svoj grad</a>
            <a href="${links.daily}">📅 Dnevni kviz</a>
            <a href="${links.leaderboard}">🏅 Rang-lista</a>
            <a href="${links.account}">👤 Prijava</a>
          </nav>
        </details>
      </div>
    </header>`;

  const footer = `
    <footer class="ps-footer">
      <div class="ps-footer-inner">
        <div class="ps-footer-grid">
          <div>
            <div class="ps-footer-logo-wrap"><img class="ps-footer-logo" src="https://raw.githubusercontent.com/Patriasoul/patriasoul/main/images/file_0000000082ec81f4a6fc17bdbd959622_114540.png" alt="PatriaSoul"></div>
            <p class="ps-footer-copy">Hrvatska · povijest · znanje · identitet.<br>Prostor za učenje, igru i čuvanje priča koje čine naše nasljeđe.</p>
            <div class="ps-motto"><span>Znanje</span><span>·</span><span>Ponos</span><span>·</span><span>Nasljeđe</span></div>
          </div>
          <div>
            <p class="ps-heading">PatriaSoul</p>
            <div class="ps-footer-links">
              <a href="${links.home}">Početna</a>
              <a href="${links.croatian}">Hrvatski kviz</a>
              <a href="${links.cities}">Brani svoj grad</a>
              <a href="${links.daily}">Dnevni kviz</a>
              <a href="${links.leaderboard}">Rang-lista</a>
              <a href="${links.account}">Prijava / Moj račun</a>
            </div>
          </div>
          <div class="ps-social">
            <p class="ps-heading">Prati nas</p>
            <div class="ps-social-card">
              <div><span class="ps-social-label">PatriaSoul</span><p>Prati PatriaSoul na TikToku i budi uz nas dok kroz kratke priče, zanimljivosti i kvizove upoznajemo Hrvatsku.</p></div>
              <a class="ps-social-button" href="https://www.tiktok.com/@patriasoul" target="_blank" rel="noreferrer">Prati nas</a>
            </div>
            <div class="ps-social-card faith">
              <div><span class="ps-social-label">Vjera · Yeshua</span><p>Vjera, nada i istina kroz priču o Yeshui — Isusu Kristu. Sadržaj za one koji žele upoznati Njegovu riječ, život i poruku.</p></div>
              <a class="ps-social-button" href="https://www.tiktok.com/@hajdi331?lang=hr" target="_blank" rel="noreferrer">Prati vjerski kanal</a>
            </div>
            <div class="ps-legal">
              <a href="${links.rules}">Pravilnik o igranju</a>
              <a href="${links.terms}">Uvjeti korištenja</a>
              <a href="${links.privacy}">Politika privatnosti</a>
              <a href="${links.about}">O PatriaSoul</a>
              <a href="${links.contact}">Kontakt</a>
            </div>
          </div>
        </div>
        <div class="ps-divider"></div>
        <div class="ps-bottom"><span>© 2026 PatriaSoul. Sva prava pridržana.</span><span>Hrvatska · Povijest · Znanje · Identitet</span></div>
      </div>
    </footer>`;

  const headerShell = document.createElement("div");
  headerShell.id = "patria-shared-shell";
  headerShell.innerHTML = header;
  document.body.insertBefore(headerShell, document.body.firstChild);

  const footerShell = document.createElement("div");
  footerShell.id = "patria-shared-footer";
  footerShell.innerHTML = footer;
  document.body.appendChild(footerShell);
})();