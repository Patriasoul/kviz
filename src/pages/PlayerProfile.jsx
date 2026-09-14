import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Award, LockKeyhole, Trophy } from "lucide-react";
import { fetchBadges, fetchProgress } from "../lib/results";
import { ACHIEVEMENTS, QUIZ_PROGRESSION } from "../lib/progression";

const quizOrder = ["croatian", "city", "daily"];

export default function PlayerProfile({ user, onBack }) {
  const [progress, setProgress] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user?.id) return;
      setLoading(true);
      const [progressResult, badgesResult] = await Promise.all([
        fetchProgress(user.id),
        fetchBadges(user.id),
      ]);
      if (!active) return;
      setProgress(progressResult.data ?? []);
      setBadges(badgesResult.data ?? []);
      setError(progressResult.error?.message || badgesResult.error?.message || "");
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [user?.id]);

  const progressByType = useMemo(() => Object.fromEntries(progress.map((item) => [item.quiz_type, item])), [progress]);
  const badgeIds = useMemo(() => new Set(badges.map((badge) => badge.badge_id)), [badges]);
  const totalXp = progress.reduce((sum, item) => sum + Number(item.xp || 0), 0);
  const totalPlayed = progress.reduce((sum, item) => sum + Number(item.quizzes_played || 0), 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="patria-card overflow-hidden">
        <div className="bg-primary px-6 py-8 text-primary-foreground sm:px-8">
          <button onClick={onBack} className="mb-5 inline-flex items-center gap-2 text-sm opacity-80 hover:opacity-100"><ArrowLeft className="h-4 w-4" /> Natrag</button>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-sm font-bold uppercase tracking-[.16em] text-red-200">PatriaSoul igrač</p><h1 className="mt-2 font-display text-4xl font-bold">{user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Igrač"}</h1><p className="mt-2 text-sm opacity-75">{user?.email}</p></div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-6 py-4 text-center"><Trophy className="mx-auto h-8 w-8 text-red-200" /><p className="mt-2 text-2xl font-bold">{totalXp} XP</p><p className="text-xs opacity-75">{totalPlayed} odigranih kvizova</p></div>
          </div>
        </div>
        <div className="p-5 sm:p-8">
          {loading ? <p className="py-10 text-center text-muted-foreground">Učitavanje napretka…</p> : error ? <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div> : <>
            <div className="grid gap-5 lg:grid-cols-3">
              {quizOrder.map((quizType) => {
                const item = progressByType[quizType] || { xp: 0, level: 1, quizzes_played: 0, best_percentage: 0, current_streak: 0, best_streak: 0 };
                const badge = [...QUIZ_PROGRESSION[quizType].badges].reverse().find(([required]) => item.level >= required) || QUIZ_PROGRESSION[quizType].badges[0];
                const next = QUIZ_PROGRESSION[quizType].badges.find(([level]) => level > item.level);
                const nextStartXp = next ? (next[0] - 1) * 100 : item.xp;
                const progressToNext = next ? Math.min(100, Math.max(0, ((item.xp - nextStartXp) / 100) * 100)) : 100;
                return <section key={quizType} className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-xs font-bold uppercase tracking-[.14em] text-accent">{QUIZ_PROGRESSION[quizType].label}</p>
                  <div className="mt-4 flex items-center gap-3"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-2xl">{badge[2]}</span><div><p className="font-bold">Level {item.level}</p><p className="text-sm text-muted-foreground">{badge[1]}</p></div></div>
                  <div className="mt-5 flex justify-between text-xs font-semibold"><span>{item.xp} XP</span><span>{next ? `Sljedeći: Lv ${next[0]}` : "Maksimalna značka"}</span></div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progressToNext}%` }} /></div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground"><span>{item.quizzes_played} kvizova</span><span className="text-right">Najbolje {item.best_percentage}%</span>{quizType === "daily" && <><span>Niz {item.current_streak} dana</span><span className="text-right">Rekord {item.best_streak}</span></>}</div>
                </section>;
              })}
            </div>
            <section className="mt-10"><div className="flex items-center gap-3"><Award className="h-6 w-6 text-accent" /><div><p className="text-xs font-bold uppercase tracking-[.16em] text-accent">PatriaSoul</p><h2 className="text-2xl font-bold">Moje značke</h2></div></div><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {quizOrder.flatMap((quizType) => QUIZ_PROGRESSION[quizType].badges.map(([level, name, icon]) => ({ quizType, id: `${quizType}_level_${level}`, name, icon, level, earned: badgeIds.has(`${quizType}_level_${level}`) }))).map((badge) => <div key={badge.id} className={`rounded-2xl border p-4 ${badge.earned ? "border-red-200 bg-red-50/60" : "border-border bg-secondary/30 opacity-55"}`}><div className="flex items-center gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-background text-2xl">{badge.earned ? badge.icon : <LockKeyhole className="h-5 w-5 text-muted-foreground" />}</span><div><p className="text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">{QUIZ_PROGRESSION[badge.quizType].label} · Lv {badge.level}</p><p className="font-bold">{badge.name}</p></div></div></div>)}
            </div></section>
            <section className="mt-10"><div className="flex items-center gap-3"><Award className="h-6 w-6 text-accent" /><div><p className="text-xs font-bold uppercase tracking-[.16em] text-accent">Postignuća</p><h2 className="text-2xl font-bold">Posebne značke</h2></div></div><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {quizOrder.flatMap((quizType) => ACHIEVEMENTS[quizType].map(([id, name, condition]) => ({ quizType, id, name, condition, earned: badgeIds.has(id) }))).map((badge) => <div key={badge.id} className={`rounded-2xl border p-4 ${badge.earned ? "border-amber-200 bg-amber-50/60" : "border-border bg-secondary/30 opacity-55"}`}><div className="flex items-start gap-3"><span className="mt-1 text-xl">{badge.earned ? "🏅" : "🔒"}</span><div><p className="font-bold">{badge.name}</p><p className="mt-1 text-xs text-muted-foreground">{badge.condition}</p></div></div></div>)}
            </div></section>
          </>}
        </div>
      </div>
    </main>
  );
}
