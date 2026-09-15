import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Clock, Volume2, VolumeX } from "lucide-react";
import {
  isAudioEnabled,
  setAudioEnabled,
  startAudio,
  playCorrect,
  playWrong,
  playTimeout,
  playFinish,
  playCountdownTick,
  stopMusic,
} from "../lib/audioManager";

const LETTERS = ["A", "B", "C", "D"];

export default function QuizPlayer({ questions, title, subtitle, timeLimit = 20, quizType, onComplete, onQuit }) {
  const resolvedQuizType = quizType ?? (title?.toLowerCase().includes("brani svoj grad") ? "city" : title?.toLowerCase().includes("dnevni kviz") ? "daily" : "croatian");
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [remaining, setRemaining] = useState(timeLimit);
  const [audioOn, setAudioOn] = useState(isAudioEnabled());
  const startRef = useRef(Date.now());
  const scoreRef = useRef(0);
  const lastTickRef = useRef(null);
  const q = questions[index];
  const progress = questions.length ? ((index + 1) / questions.length) * 100 : 0;
  const answerOptions = Array.isArray(q?.options) ? q.options.map((option) => option.text) : q?.answers ?? [];
  const correctOptionIndex = Number.isInteger(q?.preparedCorrectIndex) ? q.preparedCorrectIndex : q?.correctIndex;

  useEffect(() => {
    if (!questions.length || !audioOn) return undefined;
    startAudio(resolvedQuizType);
    return () => stopMusic();
  }, [resolvedQuizType, questions.length]);

  useEffect(() => {
    if (!questions.length || answered) return undefined;
    if (audioOn && remaining <= Math.min(5, timeLimit) && remaining > 0 && lastTickRef.current !== remaining) {
      playCountdownTick(remaining === 1);
      lastTickRef.current = remaining;
    }
    if (remaining <= 0) {
      if (audioOn) playTimeout();
      setSelected(-1);
      setAnswered(true);
      return undefined;
    }
    const timer = setTimeout(() => setRemaining((v) => v - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, answered, questions.length, audioOn, timeLimit]);

  useEffect(() => {
    lastTickRef.current = null;
  }, [index]);

  useEffect(() => {
    if (!answered) return undefined;
    const timer = setTimeout(() => {
      if (index + 1 < questions.length) {
        setIndex((v) => v + 1);
        setSelected(null);
        setAnswered(false);
        setRemaining(timeLimit);
      } else {
        if (audioOn) playFinish();
        stopMusic();
        onComplete?.({ score: scoreRef.current, total: questions.length, timeSeconds: Math.floor((Date.now() - startRef.current) / 1000) });
      }
    }, 1100);
    return () => clearTimeout(timer);
  }, [answered, index, questions.length, timeLimit, onComplete, audioOn]);

  const toggleAudio = async () => {
    const next = !audioOn;
    setAudioOn(next);
    setAudioEnabled(next);
    if (next) await startAudio(resolvedQuizType);
    else stopMusic();
  };

  const handleAnswer = async (i) => {
    if (answered || !q) return;
    if (audioOn) await startAudio(resolvedQuizType);
    setSelected(i);
    setAnswered(true);
    if (i === correctOptionIndex) {
      scoreRef.current += 1;
      if (audioOn) playCorrect();
    } else if (audioOn) {
      playWrong();
    }
  };

  if (!q) {
    return <div className="mx-auto max-w-2xl px-4 py-16 text-center"><h1 className="font-display text-2xl font-bold">Nema dostupnih pitanja.</h1>{onQuit && <button onClick={onQuit} className="patria-button mt-6">Natrag</button>}</div>;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0b1020] px-4 py-8 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="mb-2 flex items-center justify-between gap-4">
          <div>{subtitle && <div className="text-xs uppercase tracking-[0.2em] text-amber-400/80">{subtitle}</div>}<h1 className="font-display text-2xl font-bold">{title}</h1></div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={toggleAudio} aria-label={audioOn ? "Isključi zvuk" : "Uključi zvuk"} title={audioOn ? "Isključi zvuk" : "Uključi zvuk"} className="rounded-full border border-white/10 bg-white/5 p-2.5 text-white/70 transition hover:bg-white/10 hover:text-white">
              {audioOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${remaining <= 5 ? "bg-red-500/20 text-red-300" : "bg-white/5 text-white/70"}`}><Clock className="h-4 w-4" />00:{String(Math.max(0, remaining)).padStart(2, "0")}</div>
          </div>
        </div>
        <div className="mb-8 flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full bg-gradient-to-r from-amber-400 to-red-600" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} /></div><div className="whitespace-nowrap text-sm font-medium text-white/70">{index + 1} / {questions.length}</div></div>
        <AnimatePresence mode="wait">
          <motion.div key={q.id ?? index} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
            <h2 className="mb-6 min-h-[3.5rem] font-display text-xl font-semibold leading-snug sm:text-2xl">{q.question}</h2>
            <div className="grid gap-3">
              {answerOptions.map((ans, i) => {
                const isCorrect = i === correctOptionIndex;
                const isSelected = i === selected;
                let cls = "border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/10";
                if (answered) cls = isCorrect ? "border-green-400 bg-green-400/15 text-white" : isSelected ? "border-red-500 bg-red-500/15 text-white" : "border-white/10 bg-white/5 opacity-50";
                return <button key={`${q.id}-${i}`} onClick={() => handleAnswer(i)} disabled={answered} className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-4 text-left transition-all ${cls} ${!answered ? "active:scale-[0.99]" : ""}`}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-bold">{LETTERS[i]}</span><span className="flex-1 font-medium">{ans}</span>{answered && isCorrect && <Check className="h-5 w-5 text-green-400" />}{answered && isSelected && !isCorrect && <X className="h-5 w-5 text-red-400" />}</button>;
              })}
            </div>
            {answered && <div className="mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">{selected === -1 ? "Vrijeme je isteklo. Odgovor se smatra netočnim." : selected === correctOptionIndex ? "Točan odgovor!" : "Netočan odgovor. Točan odgovor je označen."}</div>}
          </motion.div>
        </AnimatePresence>
        {onQuit && <button onClick={() => { stopMusic(); onQuit(); }} className="mt-8 text-sm text-white/40 transition-colors hover:text-white/70">Odustani</button>}
      </div>
    </div>
  );
}
