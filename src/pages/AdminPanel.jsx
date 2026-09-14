import { useEffect, useState } from "react";
import { ArrowLeft, RefreshCw, ShieldAlert, Trash2 } from "lucide-react";
import { supabase } from "../supabase";

const quizNames = { croatian: "Hrvatski kviz", city: "Brani svoj grad", daily: "Dnevni kviz" };

export default function AdminPanel({ onBack }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const load = async () => {
    setLoading(true); setError("");
    const { data: admin, error: adminError } = await supabase.rpc("is_admin");
    if (adminError) { setError(adminError.message); setLoading(false); return; }
    setIsAdmin(Boolean(admin));
    if (!admin) { setLoading(false); return; }
    const { data, error: listError } = await supabase.rpc("admin_list_quiz_results");
    if (listError) setError(listError.message);
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const removeResult = async (row) => {
    const ok = window.confirm(`Poništiti rezultat ${row.score}/${row.total} (${row.percentage}%) igrača ${row.user_name}?\n\nXP, level i značke tog igrača bit će ponovno izračunati iz preostalih rezultata.`);
    if (!ok) return;
    setBusy(row.id); setError("");
    const { error: deleteError } = await supabase.rpc("admin_delete_quiz_result", { p_result_id: row.id });
    if (deleteError) setError(deleteError.message);
    else await load();
    setBusy("");
  };

  if (loading) return <main className="mx-auto max-w-6xl px-4 py-16"><div className="patria-card p-8 text-center">Provjera administratorskih ovlasti…</div></main>;
  if (!isAdmin) return <main className="mx-auto max-w-3xl px-4 py-16"><div className="patria-card p-8 text-center"><ShieldAlert className="mx-auto h-12 w-12 text-red-500" /><h1 className="mt-4 text-2xl font-bold">Administracija nije dostupna</h1><p className="mt-2 text-muted-foreground">Ovaj račun nema administratorske ovlasti.</p><button onClick={onBack} className="patria-button mt-6"><ArrowLeft className="mr-2 h-4 w-4" /> Natrag</button></div></main>;

  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
    <div className="patria-card overflow-hidden">
      <div className="bg-primary px-6 py-8 text-primary-foreground sm:px-8">
        <button onClick={onBack} className="mb-5 inline-flex items-center gap-2 text-sm opacity-80 hover:opacity-100"><ArrowLeft className="h-4 w-4" /> Natrag</button>
        <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-red-200">PatriaSoul administrator</p><h1 className="mt-2 font-display text-4xl font-bold">Upravljanje rezultatima</h1><p className="mt-2 opacity-80">Poništavanje pojedinačnih rezultata i automatski ponovni izračun napretka.</p></div><ShieldAlert className="hidden h-12 w-12 text-red-200 sm:block" /></div>
      </div>
      <div className="p-4 sm:p-8">
        {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <div className="mb-5 flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Ukupno rezultata: <strong>{rows.length}</strong></p><button onClick={load} className="patria-button"><RefreshCw className="mr-2 h-4 w-4" /> Osvježi</button></div>
        <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-secondary/50"><tr><th className="p-3">Datum</th><th className="p-3">Igrač</th><th className="p-3">Kviz</th><th className="p-3">Grad / kategorija</th><th className="p-3">Rezultat</th><th className="p-3">%</th><th className="p-3 text-right">Akcija</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-border"><td className="p-3 whitespace-nowrap">{new Date(row.created_at).toLocaleString("hr-HR")}</td><td className="p-3"><strong>{row.user_name}</strong><br /><span className="text-xs text-muted-foreground">{row.user_email || ""}</span></td><td className="p-3">{quizNames[row.quiz_type] || row.quiz_type}</td><td className="p-3">{row.city_slug || row.category || "—"}</td><td className="p-3 font-semibold">{row.score} / {row.total}</td><td className="p-3">{row.percentage}%</td><td className="p-3 text-right"><button disabled={busy === row.id} onClick={() => removeResult(row)} className="inline-flex items-center rounded-lg border border-red-200 px-3 py-2 text-red-700 hover:bg-red-50 disabled:opacity-50"><Trash2 className="mr-2 h-4 w-4" /> {busy === row.id ? "Poništavam…" : "Poništi"}</button></td></tr>)}</tbody></table>{rows.length === 0 && <p className="p-8 text-center text-muted-foreground">Nema spremljenih rezultata.</p>}</div>
      </div>
    </div>
  </main>;
}
