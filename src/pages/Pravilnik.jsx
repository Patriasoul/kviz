const sections = [
  {
    title: "Članak 1. — Opće odredbe",
    paragraphs: [
      "PatriaSoul kvizovi namijenjeni su provjeri i proširivanju znanja o Republici Hrvatskoj, njezinoj povijesti, kulturi, baštini, geografiji, prirodi, vjeri, sportu, znanosti i Domovinskom ratu.",
      "Igra je namijenjena svim korisnicima koji žele na znanja i zabavan način upoznavati Hrvatsku.",
      "Sudjelovanjem u kvizu korisnik prihvaća ovaj Pravilnik.",
      "Cilj igre nije samo ostvarivanje rezultata, nego učenje, očuvanje znanja i upoznavanje hrvatske baštine.",
    ],
  },
  {
    title: "I. HRVATSKI KVIZ",
    paragraphs: [],
  },
  {
    title: "Članak 2. — Glavni kviz",
    paragraphs: [
      "Hrvatski kviz sastoji se od baze od 2000 pitanja.",
      "Pitanja su raspoređena u deset kategorija: Hrvatsko opće znanje; Povijest Hrvatske; Domovinski rat; Geografija Hrvatske; Priroda Hrvatske; Kultura i baština; Glagoljica; Vjera i sakralna baština; Sport; Znanost i izumi.",
      "Korisnik prije početka odabire jednu od dostupnih kategorija. Svaka runda sadrži 10 pitanja.",
    ],
  },
  {
    title: "Članak 3. — Odgovaranje",
    paragraphs: [
      "Svako pitanje ima četiri ponuđena odgovora.",
      "Samo je jedan odgovor točan.",
      "Korisnik odabire jedan odgovor.",
      "Nakon potvrde odgovora nije ga moguće mijenjati.",
      "Točan odgovor donosi bodove prema pravilima odabranog načina igre.",
    ],
  },
  {
    title: "Članak 4. — Vrijeme",
    paragraphs: [
      "Kviz može koristiti vremensko ograničenje od 10, 15, 20 ili 30 sekundi po pitanju.",
      "Vrijeme određuje odabrani način igre.",
      "Ako vrijeme istekne prije odabira odgovora, odgovor se smatra netočnim.",
      "Korisnik ne može dobiti dodatno vrijeme za pojedino pitanje.",
    ],
  },
  {
    title: "II. BRANI SVOJ GRAD",
    paragraphs: [],
  },
  {
    title: "Članak 5. — Poseban sustav igre",
    paragraphs: [
      "Brani svoj grad zaseban je sustav kvizova i ne ulazi u bazu od 2000 pitanja Hrvatskog kviza.",
      "Korisnik najprije bira jedan od službenih gradova Republike Hrvatske.",
      "Svaki grad ima vlastitu bazu od 75 pitanja.",
      "Pitanja se odnose prvenstveno na odabrani grad i njegovu lokalnu povijest, kulturu, baštinu, geografiju, prirodu, znamenitosti, osobe i događaje.",
    ],
  },
  {
    title: "Članak 6. — Obrana grada",
    paragraphs: [
      "Korisnik odgovara na pitanja odabranog grada.",
      "Cilj je ostvariti što veći broj točnih odgovora i uspješno ‘obraniti’ svoj grad.",
      "Rezultat se prikazuje kao broj točnih odgovora i postotak uspješnosti.",
      "Rezultat se povezuje s odabranim gradom.",
      "Pitanja različitih gradova ne smiju se međusobno miješati.",
    ],
  },
  {
    title: "Članak 7. — Točnost lokalnih pitanja",
    paragraphs: [
      "Pitanja za pojedini grad moraju biti sadržajno provjerena.",
      "Prednost imaju službeni i vjerodostojni izvori.",
      "Pitanja koja sadrže dvojbene, zastarjele ili netočne podatke moraju se ukloniti ili ispraviti prije objave.",
    ],
  },
  {
    title: "III. DNEVNI KVIZ",
    paragraphs: [],
  },
  {
    title: "Članak 8. — Dnevni kviz",
    paragraphs: [
      "Dnevni kviz je poseban način igranja.",
      "Svakoga dana dostupno je 10 pitanja.",
      "Pitanja se automatski odabiru iz glavne baze Hrvatskog kviza.",
      "Dnevni kviz može sadržavati pitanja iz različitih kategorija.",
      "Za isti datum svi korisnici dobivaju isti dnevni set pitanja.",
      "Promjenom datuma automatski se aktivira novi dnevni kviz.",
    ],
  },
  {
    title: "Članak 9. — Jedan dnevni pokušaj",
    paragraphs: [
      "Korisnik ima pravo na jedan službeni rezultat dnevnog kviza dnevno.",
      "Nakon završetka kviza rezultat se zaključava za taj dan.",
      "Ponovno igranje, ako je tehnički omogućeno, ne smije mijenjati službeni dnevni rezultat.",
      "Dnevni rezultat može sadržavati broj točnih odgovora, postotak uspješnosti, vrijeme rješavanja i datum igranja.",
    ],
  },
  {
    title: "IV. KORISNIČKI RAČUN, NADIMAK I PRIVATNOST",
    paragraphs: [],
  },
  {
    title: "Članak 19. — Korisnički račun",
    paragraphs: [
      "Za prijavu i upravljanje korisničkim računom može se koristiti e-mail adresa ili podržani vanjski pružatelj prijave.",
      "E-mail adresa služi za prijavu i upravljanje računom te se ne prikazuje javno na rang-listi.",
      "Korisnik je odgovoran za točnost i sigurnost podataka koje koristi za pristup svom računu.",
    ],
  },
  {
    title: "Članak 20. — Nadimak igrača",
    paragraphs: [
      "Svaki igrač može odabrati nadimak koji se koristi kao javno ime u kvizu, na profilu i na rang-listi.",
      "Nadimak mora biti jedinstven među korisnicima kako bi se igrači mogli jasno razlikovati.",
      "Nadimak mora imati između 3 i 24 znaka. Zauzeti nadimak nije moguće ponovno odabrati.",
      "Korisnik može promijeniti svoj nadimak u svom računu, ako je novi nadimak slobodan.",
      "E-mail adresa ostaje podatak za prijavu i ne zamjenjuje javni nadimak igrača.",
    ],
  },
  {
    title: "Članak 21. — Privatnost korisnika",
    paragraphs: [
      "PatriaSoul nastoji javne prikaze rezultata svesti na podatke potrebne za funkcionalnost igre, osobito nadimak, rezultat i podatke potrebne za rang-listu.",
      "E-mail adresa nije javno prikazana na rang-listi. Podaci korisničkog računa i rezultati obrađuju se u skladu s objavljenom Politikom privatnosti.",
    ],
  },
  {
    title: "V. BODOVANJE",

    paragraphs: [],
  },
  {
    title: "Članak 10. — Osnovno bodovanje",
    paragraphs: [
      "Svaki točan odgovor donosi 1 bod.",
      "Netočan odgovor ne donosi bodove.",
      "Neodgovoreno pitanje smatra se netočnim.",
      "Bodovanje mora biti unaprijed definirano i jednako za sve korisnike istog načina igre.",
    ],
  },
  {
    title: "Članak 11. — Rang-lista",
    paragraphs: [
      "Rang-lista služi za usporedbu rezultata korisnika.",
      "Rezultati se mogu prikazivati prema ukupnom broju bodova, postotku točnih odgovora, vremenu rješavanja, načinu igre, kategoriji, gradu kod igre Brani svoj grad i dnevnom rezultatu.",
      "Rezultati različitih načina igre ne smiju se nepravedno uspoređivati kao da su ostvareni pod istim uvjetima.",
    ],
  },
  {
    title: "V. POŠTENA IGRA",
    paragraphs: [],
  },
  {
    title: "Članak 12. — Pravila ponašanja",
    paragraphs: [
      "Korisnik mora samostalno rješavati kviz.",
      "Nije dopušteno korištenje automatiziranih sustava, skripti, botova ili drugih tehničkih sredstava radi ostvarivanja nepravedne prednosti.",
      "Nije dopušteno iskorištavanje programskih grešaka radi dobivanja dodatnih bodova ili pokušaja.",
      "Nije dopušteno namjerno manipuliranje rezultatima ili rang-listom.",
    ],
  },
  {
    title: "Članak 13. — Nevažeći rezultati",
    paragraphs: [
      "Rezultat se može poništiti ako se utvrdi korištenje nedopuštenih automatiziranih sredstava, manipulacija aplikacijom, iskorištavanje programske pogreške, lažno ili neovlašteno mijenjanje rezultata ili drugi oblik očite zlouporabe sustava.",
    ],
  },
  {
    title: "VI. PITANJA I ISPRAVCI",
    paragraphs: [],
  },
  {
    title: "Članak 14. — Kontrola pitanja",
    paragraphs: [
      "Sva pitanja trebaju biti pregledana prije uključivanja u službenu bazu.",
      "Svako pitanje mora imati četiri odgovora i jasno označen točan odgovor.",
      "Duplikati i tehnički neispravna pitanja ne smiju biti uključeni u službenu igru.",
      "Ako korisnik uoči moguću pogrešku, može je prijaviti administratoru.",
    ],
  },
  {
    title: "Članak 15. — Ispravak pitanja",
    paragraphs: [
      "Ako se utvrdi da je pitanje netočno, nejasno ili zastarjelo, administrator ga može ispraviti, zamijeniti ili privremeno ukloniti.",
      "Ispravak pitanja ne smije nepravedno mijenjati već ostvarene rezultate, osim ako je to nužno zbog ozbiljne pogreške.",
    ],
  },
  {
    title: "VII. REZULTAT IGRE",
    paragraphs: [],
  },
  {
    title: "Članak 16. — Završni rezultat",
    paragraphs: [
      "Nakon završetka kviza korisniku se prikazuju broj točnih odgovora, broj netočnih odgovora, ukupni rezultat, postotak uspješnosti, vrijeme igranja kada se mjeri, kategorija ili grad te ostvareni plasman ako postoji rang-lista.",
      "Korisniku se može prikazati i poruka koja odgovara ostvarenom rezultatu.",
    ],
  },
  {
    title: "VIII. CILJ PATRiaSOUL KVIZOVA",
    paragraphs: [],
  },
  {
    title: "Članak 17. — Znanje i nasljeđe",
    paragraphs: [
      "PatriaSoul kviz nije samo natjecanje.",
      "Njegova je svrha: Upoznati Hrvatsku. Čuvati znanje. Poštovati prošlost. Čuvati baštinu. Prenositi priču novim generacijama.",
      "Korisnik koji završi kviz ne dobiva samo rezultat — dobiva priliku naučiti nešto novo o Hrvatskoj.",
    ],
  },
  {
    title: "Članak 18. — Završna odredba",
    paragraphs: [
      "Ovaj Pravilnik primjenjuje se na Hrvatski kviz, Brani svoj grad i Dnevni kviz.",
      "Za svaki način igre mogu se donijeti dodatna tehnička pravila, pod uvjetom da nisu u suprotnosti s ovim Pravilnikom.",
    ],
  },
];

export default function Pravilnik({ onBack }) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
      <button onClick={onBack} className="patria-button mb-8">← Natrag na kviz</button>
      <article className="patria-card overflow-hidden">
        <header className="bg-primary px-6 py-10 text-primary-foreground sm:px-10">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-red-200">PatriaSoul</p>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Pravilnik o igranju kvizova</h1>
          <p className="mt-3 text-lg text-primary-foreground/80">Znanje · Ponos · Nasljeđe</p>
        </header>
        <div className="space-y-8 px-6 py-8 sm:px-10 sm:py-10">
          {sections.map((section, index) => (
            <section key={section.title} className={section.paragraphs.length ? "" : "border-b border-border pb-2"}>
              <h2 className={index === 0 ? "text-2xl" : "text-xl"}>{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-muted-foreground">{paragraph}</p>
              ))}
            </section>
          ))}
          <div className="border-t border-border pt-8 text-center">
            <p className="font-display text-2xl font-bold">PatriaSoul</p>
            <p className="mt-2 text-muted-foreground">Hrvatska · Povijest · Znanje · Identitet</p>
          </div>
        </div>
      </article>
    </main>
  );
}
