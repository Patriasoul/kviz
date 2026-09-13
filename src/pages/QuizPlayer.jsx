import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Clock } from "lucide-react";

const LETTERS = ["A", "B", "C", "D"];

export default function QuizPlayer({ questions, title, subtitle, timeLimit = 20, onComplete, onQuit }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [remaining, setRemaining] = useState(timeLimit);
  const startRef = useRef(Date.now());
  const scoreRef = useRef(0);
  const q = questions[index];
  const progress = questions.length ? ((index + 1) / questions.length) * 100 : 0;

  useEffect(() => {
    if (!questions.length || answered) return undefined;
    if (remaining <= 0) {
      setSelected(-1);
      setAnswered(true);
      return undefined;
    }
    const timer = setTimeout(() => setRemaining((v) => v - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, answered, questions.length]);

  useEffect(() => {
    if (!answered) return undefined;
    const timer = setTimeout(() => {
      if (index + 1 < questions.length) {
        setIndex((v) => v + 1);
        setSelected(null);
        setAnswered(false);
        setRemaining(timeLimit);
      } else {
        onComplete?.({ score: scoreRef.current, total: questions.length, timeSeconds: Math.floor((Date.now() - startRef.current) / 1000) });
      }
    }, 1100);
    return () => clearTimeout(timer);
  }, [answered, index, questions.length, timeLimit, onComplete]);

  const handleAnswer = (i) => {
    if (answered || !q) return;
    setSelected(i);
    setAnswered(true);
    if (i === q.correctIndex) scoreRef.current += 1;
  };

  if (!q) {
    return <div className="mx-auto max-w-2xl px-4 py-16 text-center"><h1 className="font-display text-2xl font-bold">Nema dostupnih pitanja.</h1>{onQuit && <button onClick={onQuit} className="patria-button mt-6">Natrag</button>}</div>;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0b1020] px-4 py-8 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="mb-2 flex items-center justify-between">
          <div>{subtitle && <div className="text-xs uppercase tracking-[0.2em] text-amber-400/80">{subtitle}</div>}<h1 className="font-display text-2xl font-bold">{title}</h1></div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-sm text-white/70"><Clock className="h-4 w-4" />00:{String(Math.max(0, remaining)).padStart(2, "0")}</div>
        </div>
        <div className="mb-8 flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full bg-gradient-to-r from-amber-400 to-red-600" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} /></div><div className="whitespace-nowrap text-sm font-medium text-white/70">{index + 1} / {questions.length}</div></div>
        <AnimatePresence mode="wait">
          <motion.div key={q.id ?? index} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
            <h2 className="mb-6 min-h-[3.5rem] font-display text-xl font-semibold leading-snug sm:text-2xl">{q.question}</h2>
            <div className="grid gap-3">
              {q.answers.map((ans, i) => {
                const isCorrect = i === q.correctIndex;
                const isSelected = i === selected;
                let cls = "border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/10";
                if (answered) cls = isCorrect ? "border-green-400 bg-green-400/15 text-white" : isSelected ? "border-red-500 bg-red-500/15 text-white" : "border-white/10 bg-white/5 opacity-50";
                return <button key={`${q.id}-${i}`} onClick={() => handleAnswer(i)} disabled={answered} className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-4 text-left transition-all ${cls} ${!answered ? "active:scale-[0.99]" : ""}`}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-bold">{LETTERS[i]}</span><span className="flex-1 font-medium">{ans}</span>{answered && isCorrect && <Check className="h-5 w-5 text-green-400" />}{answered && isSelected && !isCorrect && <X className="h-5 w-5 text-red-400" />}</button>;
              })}
            </div>
            {answered && <div className="mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">{selected === -1 ? "Vrijeme je isteklo. Odgovor se smatra netočnim." : selected === q.correctIndex ? "Točan odgovor!" : "Netočan odgovor. Točan odgovor je označen."}</div>}
          </motion.div>
        </AnimatePresence>
        {onQuit && <button onClick={onQuit} className="mt-8 text-sm text-white/40 transition-colors hover:text-white/70">Odustani</button>}
      </div>
    </div>
  );
}
