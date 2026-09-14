import { CalendarDays, Clock3, Flag, RotateCcw } from "lucide-react";
import QuizPlayer from "./QuizPlayer";
import QUESTIONS from "../data/questions";
import { pickDailyQuestions, getDailyKey } from "../lib/questionEngine";

function formatDate(value) {
  return new Intl.DateTimeFormat("hr-HR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

export default function DailyQuiz({ onBack }) {
  const today = new Date();
  const dailyKey = getDailyKey(today);
  const questions = pickDailyQuestions(QUESTIONS, 10, today);

  if (questions.length < 10) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center sm:py-24">
        <div className="patria-card p-8">
          <CalendarDays className="mx-auto h-12 w-12 text-accent" />
          <h1 className="mt-5 font-display text-3xl font-bold">Dnevni kviz se priprema</h1>
          <p className="mt-4 text-muted-foreground">
            Trenutačno nema dovoljno valjanih pitanja za današnji kviz. Ne prikazujemo izmišljena pitanja.
          </p>
          <button onClick={onBack} className="patria-button-accent mt-7">Natrag na početak</button>
        </div>
      </main>
    );
  }

  return (
    <div>
      <div className="border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-accent">
            <Flag className="h-4 w-4" /> Dnevni izazov
          </div>
          <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Dnevni kviz</h1>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> {formatDate(today)}</span>
            <span className="flex items-center gap-2"><Clock3 className="h-4 w-4" /> 10 pitanja · 20 s po pitanju</span>
          </div>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Svi igrači tog dana dobivaju isti izbor pitanja. Novi dnevni set automatski se određuje kada započne novi dan.
          </p>
        </div>
      </div>
      <QuizPlayer
        key={dailyKey}
        questions={questions}
        title="PatriaSoul Dnevni kviz"
        subtitle={`Dnevni izazov · ${dailyKey}`}
        timeLimit={20}
        onComplete={(result) => (
          <DailyResult result={result} onBack={onBack} onReplay={() => window.location.reload()} />
        )}
        onQuit={onBack}
      />
    </div>
  );
}

function DailyResult({ result, onBack, onReplay }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
      <div className="patria-card p-8 text-center">
        <h1 className="font-display text-4xl font-bold">Dnevni kviz završen</h1>
        <p className="mt-5 text-5xl font-bold text-primary">{result.score} / {result.total}</p>
        <p className="mt-2 text-muted-foreground">Vrijeme: {result.timeSeconds} s</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button onClick={onReplay} className="patria-button-accent"><RotateCcw className="mr-2 h-4 w-4" /> Ponovi današnji kviz</button>
          <button onClick={onBack} className="patria-button">Natrag na početak</button>
        </div>
      </div>
    </main>
  );
}
