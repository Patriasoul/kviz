import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, Flag, RotateCcw, ShieldCheck, Trophy, XCircle, FileText } from "lucide-react";
import Pravilnik from "./pages/Pravilnik";

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
  { id:"demo-1", category:"geografija", question:"Koji je najveći hrvatski otok prema površini?", answers:["Krk","Cres","Brač","Hvar"], correctIndex:1 },
  { id:"demo-2", category:"povijest", question:"Koje godine je Hrvatska međunarodno priznata kao neovisna država?", answers:["1990.","1991.","1992.","1995."], correctIndex:2 },
  { id:"demo-3", category:"bastina", question:"Kako se zove poznati hrvatski spomenik pisan glagoljicom iz 1100. godine?", answers:["Bašćanska ploča","Vinodolski zakonik","Šibenska molitva","Humačka ploča"], correctIndex:0 },
  { id:"demo-4", category:"priroda", question:"Koji je hrvatski nacionalni park poznat po slapovima rijeke Krke?", answers:["Risnjak","Paklenica","Krka","Brijuni"], correctIndex:2 },
  { id:"demo-5", category:"sport", question:"Koje je godine Hrvatska osvojila broncu na Svjetskom prvenstvu u Francuskoj?", answers:["1994.","1998.","2002.","2006."], correctIndex:1 },
];

const names = Object.fromEntries(categories.map(([id,title]) => [id,title]));
const shuffle = a => [...a].sort(() => Math.random() - .5);

export default function App() {
  const [screen,setScreen]=useState("home");
  const [category,setCategory]=useState("sve");
  const [round,setRound]=useState([]);
  const [index,setIndex]=useState(0);
  const [answer,setAnswer]=useState(null);
  const [score,setScore]=useState(0);
  const [time,setTime]=useState(20);
  const [rulesAccepted,setRulesAccepted]=useState(()=>localStorage.getItem("patriasoul_rules_accepted")==="1");
  const q=round[index];

  useEffect(()=>{
    if(screen!=="quiz" || answer!==null) return;
    if(time<=0){setAnswer(-1);return;}
    const t=setTimeout(()=>setTime(v=>v-1),1000);
    return()=>clearTimeout(t);
  },[screen,answer,time]);

  const start=(cat="sve")=>{
    if(!rulesAccepted){setScreen("rules");return;}
    setCategory(cat);
    const pool=cat==="sve"?questions:questions.filter(x=>x.category===cat);
    setRound(shuffle(pool).slice(0,Math.min(10,pool.length)));
    setIndex(0);setAnswer(null);setScore(0);setTime(20);setScreen("quiz");
  };
  const acceptRules=()=>{localStorage.setItem("patriasoul_rules_accepted","1");setRulesAccepted(true);setScreen("home");};
  const choose=i=>{if(answer!==null)return;setAnswer(i);if(i===q.correctIndex)setScore(v=>v+1);};
  const next=()=>{if(index+1>=round.length){setScreen("result");return;}setIndex(v=>v+1);setAnswer(null);setTime(20);};
  const home=()=>{setScreen("home");setRound([]);setIndex(0);setAnswer(null);setScore(0);setTime(20);};

  return <div className="min-h-screen bg-background text-foreground"><div className="patria-stripe"/>
    <header className="border-b border-border bg-primary text-primary-foreground"><div className="patria-checker"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
      <button onClick={home} className="font-display text-2xl font-bold">PATRIA<span className="text-red-300">SOUL</span></button>
      <nav className="flex gap-4 text-sm"><button onClick={home}>Početna</button><button onClick={()=>setScreen("rules")} className="flex items-center gap-1"><FileText className="h-4 w-4"/> Pravilnik</button></nav>
    </div></div></header>

    {screen==="rules"&&<Pravilnik onBack={()=>setScreen("home")}/>}

    {screen==="home"&&<main>
      <section className="border-b border-border"><div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20"><div className="max-w-3xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-[.16em] text-accent"><Flag className="h-4 w-4"/> Znanje · ponos · nasljeđe</div>
        <h1 className="font-display text-5xl font-bold leading-tight sm:text-6xl">Hrvatski kviz</h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">Provjeri svoje znanje o Hrvatskoj — od povijesti i Domovinskog rata do geografije, prirode, baštine, glagoljice, vjere, sporta i znanosti.</p>
        <div className="mt-8 flex flex-wrap gap-3"><button onClick={()=>start()} className="patria-button-accent">Započni kviz <ArrowRight className="ml-2 h-4 w-4"/></button><a href="#kategorije" className="patria-button">Odaberi kategoriju</a></div>
      </div></div></section>
      <section id="kategorije" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20"><p className="text-sm font-bold uppercase tracking-[.16em] text-accent">10 područja</p><h2 className="patria-accent-line mt-2 text-3xl">Odaberi kategoriju</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{categories.map(([id,title,desc],i)=><button key={id} onClick={()=>start(id)} className="patria-card group p-5 text-left"><div className="flex justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-sm font-bold text-primary">{String(i+1).padStart(2,"0")}</span><ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1"/></div><h3 className="mt-5 text-xl">{title}</h3><p className="mt-2 text-sm text-muted-foreground">{desc}</p></button>)}</div>
      </section>
      <section id="o-kvizu" className="border-y border-border bg-secondary/40"><div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-14 sm:px-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-[.16em] text-accent">PatriaSoul</p><h2 className="mt-2 text-3xl">Tri načina igranja.</h2><p className="mt-3 max-w-2xl text-muted-foreground">Hrvatski kviz, Brani svoj grad i Dnevni kviz bit će odvojeni sustavi s vlastitim pravilima i rezultatima.</p></div><ShieldCheck className="h-12 w-12 shrink-0 text-accent"/></div></section>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6"><label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-4"><input type="checkbox" checked={rulesAccepted} onChange={e=>{setRulesAccepted(e.target.checked);if(e.target.checked)localStorage.setItem("patriasoul_rules_accepted","1");else localStorage.removeItem("patriasoul_rules_accepted")}} className="mt-1 h-4 w-4 accent-red-700"/><span className="text-sm">Prihvaćam <button onClick={e=>{e.preventDefault();setScreen("rules")}} className="font-semibold text-accent underline">Pravilnik o igranju kvizova</button>.</span></label></section>
    </main>}

    {screen==="quiz"&&q&&<main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-5 flex items-center justify-between gap-4 text-sm"><span className="font-semibold text-muted-foreground">Pitanje {index+1} / {round.length}</span><span className="rounded-full bg-secondary px-3 py-1 font-semibold">{names[q.category]}</span></div>
      <div className="mb-7 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-accent transition-all" style={{width:`${((index+1)/round.length)*100}%`}}/></div>
      <div className="patria-card overflow-hidden"><div className="flex items-center justify-between bg-primary px-5 py-4 text-primary-foreground sm:px-7"><span className="flex items-center gap-2 text-sm font-semibold"><Trophy className="h-4 w-4"/> Bodovi: {score}</span><span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-bold"><Clock3 className="h-4 w-4"/> 00:{String(time).padStart(2,"0")}</span></div>
        <div className="p-5 sm:p-8"><h2 className="text-2xl leading-snug sm:text-3xl">{q.question}</h2><div className="mt-7 grid gap-3">{q.answers.map((a,i)=>{const correct=i===q.correctIndex;const selected=i===answer;const cls=answer!==null?(correct?"correct":selected?"incorrect":""):"";return <button key={a} onClick={()=>choose(i)} className={`quiz-answer ${cls} flex items-center gap-3`}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current/20 text-sm font-bold">{String.fromCharCode(65+i)}</span><span className="flex-1">{a}</span>{answer!==null&&correct&&<CheckCircle2 className="h-5 w-5 text-green-700"/>}{answer!==null&&selected&&!correct&&<XCircle className="h-5 w-5 text-red-700"/>}</button>})}</div>
        {answer!==null&&<div className="mt-6 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2 text-sm font-semibold">{answer===q.correctIndex?<><CheckCircle2 className="h-5 w-5 text-green-700"/> Točan odgovor!</>:<><XCircle className="h-5 w-5 text-accent"/> Točan odgovor je označen.</>}</p><button onClick={next} className="patria-button-accent">{index+1>=round.length?"Prikaži rezultat":"Sljedeće pitanje"}<ArrowRight className="ml-2 h-4 w-4"/></button></div>}
      </div></div>
    </main>}

    {screen==="result"&&<main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20"><div className="patria-card overflow-hidden text-center"><div className="bg-primary px-6 py-10 text-primary-foreground"><Trophy className="mx-auto h-12 w-12 text-red-300"/><p className="mt-4 text-sm font-bold uppercase tracking-[.16em] text-red-200">Rezultat</p><h1 className="mt-2 font-display text-5xl font-bold">{score} / {round.length}</h1><p className="mt-2 opacity-75">PatriaSoul Hrvatski kviz</p></div><div className="p-8"><p className="text-lg font-semibold">Bravo na sudjelovanju.</p><p className="mt-2 text-muted-foreground">Rezultati i rang-lista dolaze sa Supabase povezivanjem.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={()=>start(category)} className="patria-button-accent"><RotateCcw className="mr-2 h-4 w-4"/> Igraj ponovno</button><button onClick={home} className="patria-button">Natrag na početak</button></div></div></div></main>}

    <footer className="border-t border-border bg-primary text-primary-foreground"><div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-7 text-sm opacity-90 sm:flex-row sm:justify-between sm:px-6"><span>© PatriaSoul</span><button onClick={()=>setScreen("rules")} className="underline underline-offset-4">Pravilnik</button></div></footer>
  </div>;
}
