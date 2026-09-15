import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart3, CheckCircle2, Clock3, Mail, RefreshCw, Search, ShieldAlert, Trash2, Trophy, Users } from "lucide-react";
import { supabase } from "../supabase";

const quizNames = { croatian: "Hrvatski kviz", city: "Brani svoj grad", daily: "Dnevni kviz" };
const fmtDate = (v) => v ? new Date(v).toLocaleString("hr-HR", { dateStyle: "short", timeStyle: "short" }) : "—";

export default function AdminPanel({ onBack }) {
  const [users, setUsers] = useState([]), [rows, setRows] = useState([]), [stats, setStats] = useState(null);
  const [tab, setTab] = useState("dashboard"), [search, setSearch] = useState(""), [loading, setLoading] = useState(true), [busy, setBusy] = useState("");
  const [error, setError] = useState(""), [message, setMessage] = useState(""), [isAdmin, setIsAdmin] = useState(false);

  const load = async () => {
    setLoading(true); setError("");
    const { data: admin, error: ae } = await supabase.rpc("is_admin");
    if (ae) { setError(ae.message); setLoading(false); return; }
    setIsAdmin(Boolean(admin));
    if (!admin) { setLoading(false); return; }
    const [u, s, r] = await Promise.all([supabase.rpc("admin_list_users"), supabase.rpc("admin_dashboard_stats"), supabase.rpc("admin_list_quiz_results")]);
    const e = u.error || s.error || r.error;
    if (e) setError(e.message);
    setUsers(u.data ?? []); setStats(s.data?.[0] ?? null); setRows(r.data ?? []); setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const filteredUsers = useMemo(() => { const q = search.trim().toLowerCase(); return q ? users.filter(x => `${x.display_name} ${x.email}`.toLowerCase().includes(q)) : users; }, [users, search]);
  const filteredRows = useMemo(() => { const q = search.trim().toLowerCase(); return q ? rows.filter(x => `${x.user_name} ${x.user_email} ${x.city_slug || ""} ${quizNames[x.quiz_type] || x.quiz_type}`.toLowerCase().includes(q)) : rows; }, [rows, search]);

  const removeResult = async (row) => {
    if (!window.confirm(`Poništiti rezultat ${row.score}/${row.total} (${row.percentage}%) igrača ${row.user_name}?\n\nNapredak igrača bit će ponovno izračunat.`)) return;
    setBusy(row.id); setError(""); setMessage("");
    const { error: e } = await supabase.rpc("admin_delete_quiz_result", { p_result_id: row.id });
    if (e) setError(e.message); else { setMessage("Rezultat je poništen i napredak ponovno izračunat."); await load(); }
    setBusy("");
  };

  const sendReset = async (user) => {
    if (!user.email || !window.confirm(`Poslati korisniku ${user.email} poveznicu za promjenu lozinke?`)) return;
    setBusy(`reset:${user.id}`); setError(""); setMessage("");
    const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`;
    const { error: e } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo });
    if (e) setError(e.message); else setMessage(`Poveznica za promjenu lozinke poslana je na ${user.email}.`);
    setBusy("");
  };

  if (loading) return <main className="mx-auto max-w-6xl px-4 py-16"><div className="patria-card p-8 text-center">Učitavam administratorski dashboard…</div></main>;
  if (!isAdmin) return <main className="mx-auto max-w-3xl px-4 py-16"><div className="patria-card p-8 text-center"><ShieldAlert className="mx-auto h-12 w-12 text-red-500" /><h1 className="mt-4 text-2xl font-bold">Administracija nije dostupna</h1><p className="mt-2 text-muted-foreground">Ovaj račun nema administratorske ovlasti.</p><button onClick={onBack} className="patria-button mt-6"><ArrowLeft className="mr-2 h-4 w-4" /> Natrag</button></div></main>;

  const cards = [["Registrirani", stats?.total_users, Users], ["Aktivni 30 dana", stats?.active_users_30d, CheckCircle2], ["Odigrani kvizovi", stats?.total_results, Trophy], ["Rezultati 30 dana", stats?.results_30d, Clock3], ["Ukupno XP", stats?.total_xp, BarChart3]];
  const tabs = [["dashboard", "Pregled", BarChart3], ["users", "Korisnici", Users], ["results", "Rezultati", Trophy]];

  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12"><div className="patria-card overflow-hidden shadow-xl">
    <header className="bg-primary px-5 py-7 text-primary-foreground sm:px-8"><button onClick={onBack} className="mb-5 inline-flex items-center gap-2 text-sm opacity-80"><ArrowLeft className="h-4 w-4" /> Natrag</button><div className="flex items-end justify-between gap-6"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-red-200">PatriaSoul administrator</p><h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Administratorski dashboard</h1><p className="mt-2 text-sm opacity-80">Korisnici, natjecanje, rezultati i računi na jednom mjestu.</p></div><ShieldAlert className="hidden h-12 w-12 text-red-200 sm:block" /></div></header>
    <nav className="flex flex-wrap gap-2 border-b border-border px-4 py-3 sm:px-8">{tabs.map(([id,label,Icon]) => <button key={id} onClick={() => { setTab(id); setSearch(""); }} className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold ${tab === id ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}><Icon className="mr-2 h-4 w-4" />{label}</button>)}</nav>
    <div className="p-4 sm:p-8">{error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}{message && <div className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"><CheckCircle2 className="h-4 w-4" />{message}</div>}
      {tab === "dashboard" && <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{cards.map(([label,value,Icon]) => <article key={label} className="patria-card bg-secondary/30 p-5"><Icon className="h-5 w-5 text-accent" /><p className="mt-4 text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">{label}</p><p className="mt-1 font-display text-3xl font-bold">{Number(value || 0).toLocaleString("hr-HR")}</p></article>)}</div><div className="mt-8 grid gap-5 lg:grid-cols-2"><section className="patria-card p-6"><p className="text-xs font-bold uppercase tracking-[.14em] text-accent">Najnoviji korisnici</p><h2 className="mt-2 text-2xl font-bold">Registrirani igrači</h2><div className="mt-5 space-y-3">{users.slice(0,6).map(u => <div key={u.id} className="flex justify-between gap-3 border-b border-border pb-3"><div><strong>{u.display_name}</strong><p className="text-xs text-muted-foreground">{u.email}</p></div><span className="text-xs text-muted-foreground">{fmtDate(u.created_at)}</span></div>)}</div></section><section className="patria-card p-6"><p className="text-xs font-bold uppercase tracking-[.14em] text-accent">Aktivnost</p><h2 className="mt-2 text-2xl font-bold">Najaktivniji igrači</h2><div className="mt-5 space-y-3">{[...users].sort((a,b) => Number(b.total_quizzes)-Number(a.total_quizzes)).slice(0,6).map(u => <div key={u.id} className="flex justify-between gap-3 border-b border-border pb-3"><div><strong>{u.display_name}</strong><p className="text-xs text-muted-foreground">{Number(u.total_xp).toLocaleString("hr-HR")} XP</p></div><span className="font-semibold">{u.total_quizzes} kvizova</span></div>)}</div></section></div></>}
      {tab === "users" && <><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm text-muted-foreground">Ukupno korisnika: <strong>{users.length}</strong></p><h2 className="mt-1 text-2xl font-bold">Registrirani korisnici</h2></div><div className="flex gap-2"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ime ili e-mail" className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm sm:w-72" /></div><button onClick={load} className="patria-button"><RefreshCw className="mr-2 h-4 w-4" /> Osvježi</button></div></div><div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-secondary/50"><tr><th className="p-3">Korisnik</th><th className="p-3">Registriran</th><th className="p-3">Zadnja prijava</th><th className="p-3">Kvizovi</th><th className="p-3">XP</th><th className="p-3">Uloga</th><th className="p-3 text-right">Račun</th></tr></thead><tbody>{filteredUsers.map(u => <tr key={u.id} className="border-t border-border"><td className="p-3"><strong>{u.display_name}</strong><br /><span className="text-xs text-muted-foreground">{u.email}</span></td><td className="p-3 whitespace-nowrap">{fmtDate(u.created_at)}</td><td className="p-3 whitespace-nowrap">{fmtDate(u.last_sign_in_at)}</td><td className="p-3 font-semibold">{u.total_quizzes}</td><td className="p-3">{Number(u.total_xp).toLocaleString("hr-HR")}</td><td className="p-3"><span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold">{u.role === "admin" ? "Administrator" : "Igrač"}</span></td><td className="p-3 text-right"><button disabled={busy === `reset:${u.id}`} onClick={() => sendReset(u)} className="inline-flex items-center rounded-lg border border-border px-3 py-2 font-semibold hover:bg-secondary disabled:opacity-50"><Mail className="mr-2 h-4 w-4" />{busy === `reset:${u.id}` ? "Šaljem…" : "Nova lozinka"}</button></td></tr>)}</tbody></table>{filteredUsers.length === 0 && <p className="p-8 text-center text-muted-foreground">Nema korisnika.</p>}</div></>}
      {tab === "results" && <><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm text-muted-foreground">Ukupno rezultata: <strong>{rows.length}</strong></p><h2 className="mt-1 text-2xl font-bold">Rezultati natjecanja</h2></div><div className="flex gap-2"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pretraži rezultate" className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm sm:w-72" /></div><button onClick={load} className="patria-button"><RefreshCw className="mr-2 h-4 w-4" /> Osvježi</button></div></div><div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[950px] text-left text-sm"><thead className="bg-secondary/50"><tr><th className="p-3">Datum</th><th className="p-3">Igrač</th><th className="p-3">Kviz</th><th className="p-3">Grad / kategorija</th><th className="p-3">Rezultat</th><th className="p-3">%</th><th className="p-3 text-right">Akcija</th></tr></thead><tbody>{filteredRows.map(r => <tr key={r.id} className="border-t border-border"><td className="p-3 whitespace-nowrap">{fmtDate(r.created_at)}</td><td className="p-3"><strong>{r.user_name}</strong><br /><span className="text-xs text-muted-foreground">{r.user_email || ""}</span></td><td className="p-3">{quizNames[r.quiz_type] || r.quiz_type}</td><td className="p-3">{r.city_slug || r.category || "—"}</td><td className="p-3 font-semibold">{r.score} / {r.total}</td><td className="p-3">{r.percentage}%</td><td className="p-3 text-right"><button disabled={busy === r.id} onClick={() => removeResult(r)} className="inline-flex items-center rounded-lg border border-red-200 px-3 py-2 text-red-700 hover:bg-red-50 disabled:opacity-50"><Trash2 className="mr-2 h-4 w-4" />{busy === r.id ? "Poništavam…" : "Poništi"}</button></td></tr>)}</tbody></table>{filteredRows.length === 0 && <p className="p-8 text-center text-muted-foreground">Nema rezultata.</p>}</div></>}
    </div></div></main>;
}
