"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCcw,
  Lightbulb,
  Award,
  Volume2,
  VolumeX,
  Flame,
  Zap,
  CheckCircle2,
  XCircle,
  BookOpen,
} from "lucide-react";

// Student word bank with difficulty tiers & academic categories
const WORD_BANK = [
  { word: "GALAXY", hint: "A massive system of billions of stars, gas, and dust held by gravity.", category: "ASTRONOMY", level: 1 },
  { word: "PHOTOSYNTHESIS", hint: "Process by which green plants convert light into chemical energy.", category: "BIOLOGY", level: 2 },
  { word: "GRAVITY", hint: "The invisible force that pulls objects toward each other.", category: "PHYSICS", level: 1 },
  { word: "ALGORITHM", hint: "A step-by-step set of instructions designed to solve a specific problem.", category: "COMPUTER SCIENCE", level: 2 },
  { word: "ECOSYSTEM", hint: "A biological community of interacting organisms and their physical environment.", category: "ECOLOGY", level: 1 },
  { word: "MOLECULE", hint: "A group of atoms bonded together representing the smallest unit of a chemical compound.", category: "CHEMISTRY", level: 2 },
];

const MAX_WRONG = 6;
const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

// Confetti burst particles on victory
const CONFETTI = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  x: (i % 2 === 0 ? 1 : -1) * (100 + (i * 15) % 180),
  y: -80 - (i * 20) % 220,
  rotation: (i * 60) % 360,
  scale: 0.7 + (i % 3) * 0.4,
  delay: (i % 6) * 0.05,
  color: ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"][i % 5],
}));

export default function WordGuessApp() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [shakeKey, setShakeKey] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Native Synthesized Audio Effects
  const playTone = useCallback(
    (freq: number, type: OscillatorType = "sine", duration = 0.12) => {
      if (!soundEnabled) return;
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
          )();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch {
        // Autoplay policy fallback
      }
    },
    [soundEnabled]
  );

  const playWinChime = useCallback(() => {
    [329.63, 392.00, 523.25, 659.25, 783.99].forEach((freq, idx) => {
      setTimeout(() => playTone(freq, "triangle", 0.25), idx * 90);
    });
  }, [playTone]);

  const playLoseTone = useCallback(() => {
    [220, 196, 174, 146].forEach((freq, idx) => {
      setTimeout(() => playTone(freq, "sawtooth", 0.25), idx * 110);
    });
  }, [playTone]);

  const currentWordObj = WORD_BANK[currentIndex];
  const word = currentWordObj.word;

  const wrongGuesses = Array.from(guessedLetters).filter(
    (letter) => !word.includes(letter)
  );
  const wrongCount = wrongGuesses.length;
  const livesLeft = MAX_WRONG - wrongCount;
  const isWon =
    word.length > 0 && word.split("").every((letter) => guessedLetters.has(letter));
  const isLost = wrongCount >= MAX_WRONG;

  // Restart or cycle word
  const nextWord = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % WORD_BANK.length);
    setGuessedLetters(new Set());
    setShowHint(false);
  }, []);

  const resetGame = useCallback(() => {
    setGuessedLetters(new Set());
    setShowHint(false);
  }, []);

  // Handle Win/Loss triggers
  useEffect(() => {
    if (isWon) {
      setScore((prev) => prev + 15 + streak * 5);
      setStreak((prev) => prev + 1);
      playWinChime();
    } else if (isLost) {
      setStreak(0);
      playLoseTone();
    }
  }, [isWon, isLost, playWinChime, playLoseTone]);

  // Handle player letter guess
  const handleGuess = useCallback(
    (letter: string) => {
      if (isWon || isLost || guessedLetters.has(letter)) return;

      const isCorrect = word.includes(letter);
      setGuessedLetters((prev) => new Set(prev).add(letter));

      if (isCorrect) {
        playTone(523.25, "sine", 0.1);
      } else {
        setShakeKey(letter);
        setTimeout(() => setShakeKey(null), 400);
        playTone(180, "square", 0.15);
      }
    },
    [isWon, isLost, guessedLetters, word, playTone]
  );

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (/^[A-Z]$/.test(key)) {
        handleGuess(key);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleGuess]);

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col justify-between p-4 sm:p-8 font-sans select-none relative overflow-hidden">
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Floating Victory Confetti Particles */}
      <AnimatePresence>
        {isWon && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
            {CONFETTI.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  x: p.x,
                  y: p.y,
                  scale: p.scale,
                  rotate: p.rotation,
                }}
                transition={{
                  duration: 1.8,
                  ease: "easeOut",
                  delay: p.delay,
                  repeat: Infinity,
                  repeatDelay: 0.8,
                }}
                style={{ backgroundColor: p.color }}
                className="absolute w-3 h-3 sm:w-4 sm:h-4 rounded-sm shadow-sm"
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Navbar / Top Stats */}
      <header className="w-full max-w-4xl mx-auto flex justify-between items-center bg-slate-50/90 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-slate-200/80 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-200">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">
              LEXICON<span className="text-indigo-600">.STUDY</span>
            </h1>
            <p className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase mt-0.5">
              Interactive Vocabulary
            </p>
          </div>
        </div>

        {/* Dashboard Metrics */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 text-amber-800 text-xs font-bold">
            <Award className="w-4 h-4 text-amber-500" />
            <span>{score} PTS</span>
          </div>

          <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-200 text-orange-800 text-xs font-bold">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>{streak} STREAK</span>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-600 transition-colors"
            title="Toggle Audio"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-indigo-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          <button
            onClick={resetGame}
            className="p-2 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-600 transition-colors"
            title="Reset Current Word"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-6 my-auto z-10 py-4">
        {/* Category Pill & Lives Indicator */}
        <div className="w-full flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full text-xs font-bold tracking-wide uppercase">
              {currentWordObj.category}
            </span>
            <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-600 rounded-full text-[11px] font-semibold">
              Level {currentWordObj.level}
            </span>
          </div>

          {/* Clean Segmented Health Gauge */}
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            <div className="flex gap-1">
              {Array.from({ length: MAX_WRONG }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 sm:w-4 h-2 rounded-full transition-all duration-300 ${
                    i < livesLeft
                      ? "bg-indigo-600 shadow-sm shadow-indigo-300"
                      : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Minimalist Visual Indicator Box */}
        <div className="relative w-full max-w-md h-36 sm:h-40 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-center shadow-inner overflow-hidden">
          <svg
            viewBox="0 0 100 100"
            className="h-full stroke-slate-800 fill-none stroke-[3.5] stroke-linecap-round stroke-linejoin-round"
          >
            {/* Architectural Frame */}
            <line x1="20" y1="88" x2="80" y2="88" className="stroke-slate-300 stroke-[4]" />
            <line x1="35" y1="88" x2="35" y2="12" className="stroke-slate-300 stroke-[4]" />
            <line x1="35" y1="12" x2="68" y2="12" className="stroke-slate-300 stroke-[4]" />
            <line x1="68" y1="12" x2="68" y2="24" className="stroke-indigo-400 stroke-[2]" />

            {/* Smooth Dynamic Figurine */}
            {wrongCount >= 1 && (
              <motion.circle
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                cx="68"
                cy="32"
                r="7"
                className="fill-indigo-50 stroke-indigo-600 stroke-[3]"
              />
            )}
            {wrongCount >= 2 && (
              <motion.line
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                x1="68"
                y1="39"
                x2="68"
                y2="62"
                className="stroke-indigo-600 stroke-[3]"
              />
            )}
            {wrongCount >= 3 && (
              <motion.line
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                x1="68"
                y1="46"
                x2="56"
                y2="38"
                className="stroke-indigo-600 stroke-[3]"
              />
            )}
            {wrongCount >= 4 && (
              <motion.line
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                x1="68"
                y1="46"
                x2="80"
                y2="38"
                className="stroke-indigo-600 stroke-[3]"
              />
            )}
            {wrongCount >= 5 && (
              <motion.line
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                x1="68"
                y1="62"
                x2="56"
                y2="76"
                className="stroke-indigo-600 stroke-[3]"
              />
            )}
            {wrongCount >= 6 && (
              <motion.line
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                x1="68"
                y1="62"
                x2="80"
                y2="76"
                className="stroke-rose-500 stroke-[3.5]"
              />
            )}
          </svg>
        </div>

        {/* Academic Definition Hint */}
        <div className="flex flex-col items-center min-h-[36px] w-full max-w-lg">
          {!showHint ? (
            <button
              onClick={() => setShowHint(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-3.5 py-1.5 rounded-full transition-colors border border-slate-200"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Reveal Educational Definition</span>
            </button>
          ) : (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs sm:text-sm text-slate-600 text-center bg-indigo-50/70 border border-indigo-200 px-4 py-2 rounded-xl font-medium"
            >
              <strong className="text-indigo-900">Definition:</strong> {currentWordObj.hint}
            </motion.p>
          )}
        </div>

        {/* Word Tiles with Smooth Spring Pop-In Animations */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5 my-2">
          {word.split("").map((letter, idx) => {
            const isGuessed = guessedLetters.has(letter) || isLost;
            return (
              <div
                key={idx}
                className="relative w-10 h-12 sm:w-12 sm:h-14 bg-slate-50 border-2 border-slate-200 rounded-xl flex items-center justify-center font-extrabold text-xl sm:text-2xl text-slate-800 shadow-sm overflow-hidden"
              >
                <AnimatePresence>
                  {isGuessed && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0, y: 12 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 22,
                        delay: idx * 0.03,
                      }}
                      className={
                        !guessedLetters.has(letter) && isLost
                          ? "text-rose-500"
                          : "text-indigo-600"
                      }
                    >
                      {letter}
                    </motion.span>
                  )}
                </AnimatePresence>
                <div className="absolute bottom-1 w-6 h-0.5 bg-slate-300 rounded-full" />
              </div>
            );
          })}
        </div>

        {/* Victory / Defeat Modal Bar */}
        <AnimatePresence>
          {(isWon || isLost) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl w-full max-w-lg border shadow-sm ${
                isWon
                  ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                  : "bg-rose-50 text-rose-900 border-rose-200"
              }`}
            >
              <div className="flex items-center gap-2.5 font-bold text-sm sm:text-base">
                {isWon ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Word Solved! Academic bonus awarded.</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-600" />
                    <span>The word was <strong className="underline">{word}</strong></span>
                  </>
                )}
              </div>
              <button
                onClick={nextWord}
                className="mt-3 sm:mt-0 text-xs bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-md shadow-slate-200"
              >
                Next Challenge →
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sleek On-Screen Keyboard */}
        <div className="w-full flex flex-col gap-1.5 sm:gap-2 items-center mt-2">
          {KEYBOARD_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1 sm:gap-1.5 justify-center w-full">
              {row.map((key) => {
                const isGuessed = guessedLetters.has(key);
                const isCorrect = isGuessed && word.includes(key);
                const isWrong = isGuessed && !word.includes(key);
                const isShaking = shakeKey === key;

                return (
                  <motion.button
                    key={key}
                    disabled={isGuessed || isWon || isLost}
                    onClick={() => handleGuess(key)}
                    animate={
                      isShaking
                        ? { x: [-4, 4, -4, 4, 0] }
                        : { scale: 1 }
                    }
                    whileTap={{ scale: 0.92 }}
                    transition={{ duration: 0.2 }}
                    className={`w-8 h-10 sm:w-11 sm:h-12 rounded-lg font-bold text-xs sm:text-sm transition-colors border shadow-2xs ${
                      isCorrect
                        ? "bg-emerald-600 border-emerald-700 text-white shadow-emerald-200"
                        : isWrong
                        ? "bg-slate-100 border-slate-200 text-slate-300"
                        : "bg-white border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 text-slate-700"
                    }`}
                  >
                    {key}
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Modern Footer */}
      <footer className="text-center text-[11px] font-semibold text-slate-400 z-10">
        Use standard touch input or press physical keyboard keys A–Z to play.
      </footer>
    </main>
  );
}