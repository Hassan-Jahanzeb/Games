"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  motion,
  AnimatePresence,
  MotionConfig,
  useAnimation,
} from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Delete,
  Eraser,
  Grid3X3,
  Heart,
  Lightbulb,
  RotateCcw,
  Shuffle,
  SpellCheck,
  Timer,
  Trophy,
  XCircle,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Data & helpers                                                      */
/* ------------------------------------------------------------------ */

type GameId = "hangman" | "scramble" | "guess" | "sliding";

type Entry = { word: string; hint: string; topic: string; alts?: string[] };

const WORDS: Entry[] = [
  { word: "PLANET", topic: "Space", hint: "A world that orbits a star.", alts: ["PLATEN"] },
  { word: "GARDEN", topic: "Nature", hint: "A place where flowers and vegetables grow.", alts: ["DANGER", "GANDER", "RANGED"] },
  { word: "PYTHON", topic: "Computers", hint: "A popular programming language (and a snake).", },
  { word: "BRIDGE", topic: "Buildings", hint: "It helps you cross a river or a road.", },
  { word: "JUNGLE", topic: "Nature", hint: "A thick, hot rainforest full of animals.", },
  { word: "CASTLE", topic: "History", hint: "A big stone fort where kings and queens lived.", alts: ["CLEATS"] },
  { word: "ROCKET", topic: "Space", hint: "It blasts astronauts into space.", },
  { word: "PENCIL", topic: "School", hint: "You write with it and can erase the marks.", },
  { word: "ISLAND", topic: "Geography", hint: "Land completely surrounded by water.", },
  { word: "MUSEUM", topic: "Places", hint: "A building where old and special things are displayed.", },
  { word: "DOLPHIN", topic: "Animals", hint: "A clever sea mammal that clicks and whistles.", },
  { word: "VOLCANO", topic: "Science", hint: "A mountain that can erupt with lava.", },
  { word: "LIBRARY", topic: "School", hint: "A quiet place full of books to borrow.", },
  { word: "CACTUS", topic: "Nature", hint: "A spiky plant that lives in the desert.", },
  { word: "GALAXY", topic: "Space", hint: "Billions of stars held together by gravity.", },
  { word: "WINTER", topic: "Seasons", hint: "The coldest season of the year.", },
  { word: "ORANGE", topic: "Food", hint: "A round citrus fruit and also a colour.", alts: ["ONAGER"] },
  { word: "PIRATE", topic: "Stories", hint: "A sea robber who hunts for treasure.", },
  { word: "SCHOOL", topic: "School", hint: "Where students learn every day.", },
  { word: "MAGNET", topic: "Science", hint: "It pulls iron and steel towards it.", },
];

const MAX_MISTAKES = 6;
const MAX_TRIES = 6;

let lastWord = "";
function pickWord(): Entry {
  let entry: Entry;
  do {
    entry = WORDS[Math.floor(Math.random() * WORDS.length)];
  } while (entry.word === lastWord && WORDS.length > 1);
  lastWord = entry.word;
  return entry;
}

function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const COLORS = ["#8b5cf6", "#f97316", "#10b981", "#0ea5e9", "#f43f5e", "#facc15"];

const GAMES: {
  id: GameId;
  name: string;
  blurb: string;
  Icon: LucideIcon;
  button: string;
  soft: string;
}[] = [
  {
    id: "hangman",
    name: "Hangman",
    blurb: "Guess the word before you run out of lives.",
    Icon: SpellCheck,
    button: "from-violet-500 to-purple-600",
    soft: "bg-violet-100 text-violet-700",
  },
  {
    id: "scramble",
    name: "Word Scramble",
    blurb: "Tap the letters to build the right word.",
    Icon: Shuffle,
    button: "from-orange-400 to-rose-500",
    soft: "bg-orange-100 text-orange-700",
  },
  {
    id: "guess",
    name: "Word Guessing",
    blurb: "Use clues and colours to crack the secret word.",
    Icon: Lightbulb,
    button: "from-emerald-400 to-teal-600",
    soft: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "sliding",
    name: "Sliding Tile",
    blurb: "Slide the tiles into number order.",
    Icon: Grid3X3,
    button: "from-sky-400 to-blue-600",
    soft: "bg-sky-100 text-sky-700",
  },
];

/* ------------------------------------------------------------------ */
/* Shared UI                                                           */
/* ------------------------------------------------------------------ */

function Confetti({ delay = 0 }: { delay?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: delay + Math.random() * 0.4,
        duration: 1.6 + Math.random() * 1.4,
        rotate: Math.random() * 900 - 450,
        drift: Math.random() * 120 - 60,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 8,
      })),
    [delay]
  );

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      aria-hidden
    >
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-0 block rounded-sm"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size * 1.5,
            background: p.color,
          }}
          initial={{ y: -30, x: 0, opacity: 1, rotate: 0 }}
          animate={{
            y: "105vh",
            x: p.drift,
            opacity: [1, 1, 0],
            rotate: p.rotate,
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}

function ResultCard({
  won,
  message,
  onAgain,
  onHome,
  delay = 0,
}: {
  won: boolean;
  message: string;
  onAgain: () => void;
  onHome: () => void;
  delay?: number;
}) {
  return (
    <>
      {won && <Confetti delay={delay} />}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 20, delay }}
        className={`mt-6 rounded-2xl border p-6 text-center ${
          won
            ? "border-emerald-200 bg-emerald-50"
            : "border-rose-200 bg-rose-50"
        }`}
        role="status"
      >
        <motion.div
          initial={{ scale: 0, rotate: -25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 14, delay: delay + 0.15 }}
          className="mx-auto mb-2 w-fit"
        >
          {won ? (
            <Trophy className="text-amber-500" size={44} />
          ) : (
            <XCircle className="text-rose-500" size={44} />
          )}
        </motion.div>
        <h3
          className={`text-2xl font-extrabold ${
            won ? "text-emerald-700" : "text-rose-700"
          }`}
        >
          {won ? "You won!" : "Good try!"}
        </h3>
        <p className="mt-1 text-slate-600">{message}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAgain}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white"
          >
            <RotateCcw size={16} />
            Play again
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={onHome}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700"
          >
            All games
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}

function ClueBox({
  show,
  topic,
  hint,
  tone,
}: {
  show: boolean;
  topic: string;
  hint: string;
  tone: string;
}) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <p className={`mx-auto mt-3 max-w-md rounded-xl px-4 py-3 text-sm ${tone}`}>
            <span className="font-bold">{topic}:</span> {hint}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Game 1: Hangman                                                     */
/* ------------------------------------------------------------------ */

function Hangman({
  onWin,
  onRestart,
  onHome,
}: {
  onWin: () => void;
  onRestart: () => void;
  onHome: () => void;
}) {
  const [entry] = useState(() => pickWord());
  const word = entry.word;
  const [guessed, setGuessed] = useState<string[]>([]);
  const [clue, setClue] = useState(false);
  const shake = useAnimation();

  const mistakes = guessed.filter((l) => !word.includes(l)).length;
  const won = word.split("").every((c) => guessed.includes(c));
  const lost = !won && mistakes >= MAX_MISTAKES;
  const over = won || lost;

  const guess = useCallback(
    (letter: string) => {
      if (over || guessed.includes(letter)) return;
      const next = [...guessed, letter];
      setGuessed(next);
      if (!word.includes(letter)) {
        shake.start({ x: [0, -10, 10, -7, 7, 0], transition: { duration: 0.4 } });
      } else if (word.split("").every((c) => next.includes(c))) {
        onWin();
      }
    },
    [over, guessed, word, onWin, shake]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^[a-zA-Z]$/.test(e.key)) guess(e.key.toUpperCase());
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [guess]);

  const draw = {
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: { duration: 0.4, ease: "easeOut" as const },
  };

  return (
    <div>
      <div className="mb-3 flex justify-center gap-1.5" aria-label={`${MAX_MISTAKES - mistakes} lives left`}>
        {Array.from({ length: MAX_MISTAKES }, (_, i) => {
          const alive = i < MAX_MISTAKES - mistakes;
          return (
            <motion.span
              key={i}
              animate={{ scale: alive ? 1 : 0.7, opacity: alive ? 1 : 0.25 }}
              transition={{ type: "spring", stiffness: 400, damping: 12 }}
            >
              <Heart size={22} className="text-rose-500" fill="currentColor" />
            </motion.span>
          );
        })}
      </div>

      <motion.div animate={shake} className="mb-4 flex justify-center">
        <svg
          viewBox="0 0 220 210"
          className={`h-48 w-52 transition-colors duration-500 ${
            lost ? "text-rose-500" : "text-slate-700"
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          role="img"
          aria-label={`Hangman drawing, ${mistakes} mistakes`}
        >
          <motion.path
            d="M30 190 H190 M60 190 V20 H145 V45"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
          />
          {mistakes >= 1 && <motion.circle cx="145" cy="62" r="17" {...draw} />}
          {mistakes >= 2 && <motion.path d="M145 79 V125" {...draw} />}
          {mistakes >= 3 && <motion.path d="M145 90 L120 110" {...draw} />}
          {mistakes >= 4 && <motion.path d="M145 90 L170 110" {...draw} />}
          {mistakes >= 5 && <motion.path d="M145 125 L120 155" {...draw} />}
          {mistakes >= 6 && <motion.path d="M145 125 L170 155" {...draw} />}
        </svg>
      </motion.div>

      <div className="mb-3 flex flex-wrap justify-center gap-2">
        {word.split("").map((ch, i) => {
          const shown = guessed.includes(ch);
          const reveal = lost && !shown;
          return (
            <div
              key={i}
              className={`flex h-12 w-9 items-center justify-center border-b-4 text-2xl font-extrabold sm:h-14 sm:w-11 ${
                reveal ? "border-rose-300" : "border-violet-300"
              }`}
            >
              <AnimatePresence>
                {(shown || reveal) && (
                  <motion.span
                    initial={{ y: -16, opacity: 0, scale: 0.4 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 420, damping: 14 }}
                    className={reveal ? "text-rose-500" : "text-slate-800"}
                  >
                    {ch}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {!over && (
        <div className="mb-5 text-center">
          <button
            onClick={() => setClue((c) => !c)}
            className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-200"
          >
            <Lightbulb size={16} />
            {clue ? "Hide clue" : "Need a clue?"}
          </button>
          <ClueBox show={clue} topic={entry.topic} hint={entry.hint} tone="bg-violet-50 text-violet-800" />
        </div>
      )}

      {!over ? (
        <div className="grid grid-cols-7 gap-2 sm:grid-cols-9">
          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => {
            const used = guessed.includes(letter);
            const correct = word.includes(letter);
            return (
              <motion.button
                key={letter}
                disabled={used}
                onClick={() => guess(letter)}
                whileHover={used ? undefined : { y: -2 }}
                whileTap={used ? undefined : { scale: 0.88 }}
                animate={used ? { scale: [1, 1.2, 1] } : {}}
                className={`h-11 rounded-lg text-sm font-bold ${
                  used
                    ? correct
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-400 line-through"
                    : "bg-slate-100 text-slate-700 hover:bg-violet-100"
                }`}
              >
                {letter}
              </motion.button>
            );
          })}
        </div>
      ) : (
        <ResultCard
          won={won}
          delay={0.4}
          message={won ? `Great job! The word was ${word}.` : `The word was ${word}. Try another one!`}
          onAgain={onRestart}
          onHome={onHome}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Game 2: Word Scramble                                               */
/* ------------------------------------------------------------------ */

type Tile = { id: number; ch: string };

function Scramble({
  onWin,
  onRestart,
  onHome,
}: {
  onWin: () => void;
  onRestart: () => void;
  onHome: () => void;
}) {
  const [entry] = useState(() => pickWord());
  const word = entry.word;
  const accepted = useMemo(() => [word, ...(entry.alts ?? [])], [word, entry.alts]);

  const scrambleTiles = useCallback(
    (tiles: Tile[]) => {
      let out = shuffle(tiles);
      for (let i = 0; i < 20 && out.map((t) => t.ch).join("") === word; i++) {
        out = shuffle(tiles);
      }
      return out;
    },
    [word]
  );

  const [pool, setPool] = useState<Tile[]>(() =>
    scrambleTiles(word.split("").map((ch, id) => ({ id, ch })))
  );
  const [placed, setPlaced] = useState<Tile[]>([]);
  const [status, setStatus] = useState<"play" | "wrong" | "win">("play");
  const [clue, setClue] = useState(false);
  const [tries, setTries] = useState(0);

  const pick = useCallback(
    (tile: Tile) => {
      if (status !== "play") return;
      const nextPlaced = [...placed, tile];
      setPlaced(nextPlaced);
      setPool((p) => p.filter((t) => t.id !== tile.id));

      if (nextPlaced.length === word.length) {
        const attempt = nextPlaced.map((t) => t.ch).join("");
        if (accepted.includes(attempt)) {
          setStatus("win");
          onWin();
        } else {
          setStatus("wrong");
          setTries((n) => n + 1);
          setTimeout(() => {
            setPool(scrambleTiles(nextPlaced));
            setPlaced([]);
            setStatus("play");
          }, 900);
        }
      }
    },
    [status, placed, word.length, accepted, onWin, scrambleTiles]
  );

  const unpick = useCallback(
    (tile: Tile) => {
      if (status !== "play") return;
      setPlaced((p) => p.filter((t) => t.id !== tile.id));
      setPool((p) => [...p, tile]);
    },
    [status]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || status !== "play") return;
      if (e.key === "Backspace" && placed.length) {
        unpick(placed[placed.length - 1]);
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        const tile = pool.find((t) => t.ch === e.key.toUpperCase());
        if (tile) pick(tile);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pool, placed, status, pick, unpick]);

  const reshuffle = () => setPool((p) => shuffle(p));
  const clearAll = () => {
    if (status !== "play") return;
    setPool((p) => [...p, ...placed]);
    setPlaced([]);
  };

  const tileClass =
    "flex h-12 w-12 items-center justify-center rounded-xl text-2xl font-extrabold shadow-sm sm:h-14 sm:w-14";

  return (
    <LayoutGroupBox>
      <p className="text-center text-sm text-slate-500">
        Tap the letters in the right order. You can also type on your keyboard.
      </p>

      {/* answer slots */}
      <motion.div
        animate={status === "wrong" ? { x: [0, -10, 10, -8, 8, 0] } : { x: 0 }}
        transition={{ duration: 0.45 }}
        className="my-6 flex flex-wrap justify-center gap-2"
      >
        {word.split("").map((_, i) => {
          const tile = placed[i];
          return (
            <div
              key={i}
              className={`flex h-14 w-14 items-center justify-center rounded-xl border-2 border-dashed transition-colors sm:h-16 sm:w-16 ${
                status === "win"
                  ? "border-emerald-400 bg-emerald-50"
                  : status === "wrong"
                    ? "border-rose-400 bg-rose-50"
                    : "border-orange-200 bg-orange-50/40"
              }`}
            >
              {tile && (
                <motion.button
                  layoutId={`tile-${tile.id}`}
                  onClick={() => unpick(tile)}
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                  className={`${tileClass} ${
                    status === "win"
                      ? "bg-emerald-500 text-white"
                      : status === "wrong"
                        ? "bg-rose-500 text-white"
                        : "bg-orange-500 text-white"
                  }`}
                  aria-label={`Remove letter ${tile.ch}`}
                >
                  {tile.ch}
                </motion.button>
              )}
            </div>
          );
        })}
      </motion.div>

      {/* letter pool */}
      <div className="flex min-h-16 flex-wrap justify-center gap-2 sm:min-h-[4.5rem]">
        {pool.map((tile) => (
          <motion.button
            key={tile.id}
            layoutId={`tile-${tile.id}`}
            layout
            onClick={() => pick(tile)}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
            className={`${tileClass} bg-white text-orange-700 ring-2 ring-orange-200 hover:ring-orange-400`}
          >
            {tile.ch}
          </motion.button>
        ))}
      </div>

      {status !== "win" && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <SmallBtn onClick={reshuffle} icon={<Shuffle size={16} />}>Shuffle</SmallBtn>
          <SmallBtn onClick={clearAll} icon={<Eraser size={16} />}>Clear</SmallBtn>
          <SmallBtn onClick={() => setClue((c) => !c)} icon={<Lightbulb size={16} />}>
            {clue ? "Hide clue" : "Clue"}
          </SmallBtn>
        </div>
      )}

      <div className="text-center">
        <ClueBox show={clue && status !== "win"} topic={entry.topic} hint={entry.hint} tone="bg-orange-50 text-orange-800" />
        {tries > 0 && status !== "win" && (
          <p className="mt-3 text-sm text-slate-400">Wrong tries: {tries}</p>
        )}
      </div>

      {status === "win" && (
        <ResultCard
          won
          delay={0.2}
          message={`Correct! The word is ${word}${tries ? ` (after ${tries} wrong ${tries === 1 ? "try" : "tries"})` : " on the first try"}.`}
          onAgain={onRestart}
          onHome={onHome}
        />
      )}
    </LayoutGroupBox>
  );
}

function LayoutGroupBox({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

function SmallBtn({
  children,
  icon,
  onClick,
}: {
  children: ReactNode;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
    >
      {icon}
      {children}
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/* Game 3: Word Guessing (clues + colour feedback)                     */
/* ------------------------------------------------------------------ */

type Mark = "hit" | "near" | "miss";

function evaluate(guess: string, word: string): Mark[] {
  const result: Mark[] = Array(word.length).fill("miss");
  const remaining: Record<string, number> = {};
  for (let i = 0; i < word.length; i++) {
    if (guess[i] === word[i]) result[i] = "hit";
    else remaining[word[i]] = (remaining[word[i]] || 0) + 1;
  }
  for (let i = 0; i < word.length; i++) {
    if (result[i] !== "hit" && remaining[guess[i]] > 0) {
      result[i] = "near";
      remaining[guess[i]]--;
    }
  }
  return result;
}

const MARK_STYLE: Record<Mark, string> = {
  hit: "border-emerald-500 bg-emerald-500 text-white",
  near: "border-amber-400 bg-amber-400 text-white",
  miss: "border-slate-400 bg-slate-400 text-white",
};

function FlipRow({ guess, word }: { guess: string; word: string }) {
  const marks = evaluate(guess, word);
  return (
    <div className="flex justify-center gap-1.5">
      {guess.split("").map((ch, i) => (
        <motion.div
          key={i}
          initial={{ rotateX: 90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          transition={{ delay: i * 0.12, duration: 0.35, ease: "easeOut" }}
          style={{ transformPerspective: 500 }}
          className={`flex h-11 w-11 items-center justify-center rounded-lg border-2 text-xl font-extrabold sm:h-12 sm:w-12 ${MARK_STYLE[marks[i]]}`}
        >
          {ch}
        </motion.div>
      ))}
    </div>
  );
}

function Guess({
  onWin,
  onRestart,
  onHome,
}: {
  onWin: () => void;
  onRestart: () => void;
  onHome: () => void;
}) {
  const [entry] = useState(() => pickWord());
  const word = entry.word;
  const len = word.length;

  const [rows, setRows] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [clue, setClue] = useState(false);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [msg, setMsg] = useState("");

  const won = rows.includes(word);
  const lost = !won && rows.length >= MAX_TRIES;
  const over = won || lost;

  const flash = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 1500);
  };

  const type = useCallback(
    (ch: string) => {
      if (over) return;
      setCurrent((c) => (c.length < len ? c + ch : c));
    },
    [over, len]
  );

  const del = useCallback(() => {
    if (!over) setCurrent((c) => c.slice(0, -1));
  }, [over]);

  const submit = useCallback(() => {
    if (over) return;
    if (current.length < len) {
      setMsg(`Type all ${len} letters first`);
      setTimeout(() => setMsg(""), 1500);
      return;
    }
    setRows((r) => [...r, current]);
    setCurrent("");
    if (current === word) onWin();
  }, [over, current, len, word, onWin]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      } else if (e.key === "Backspace") del();
      else if (/^[a-zA-Z]$/.test(e.key)) type(e.key.toUpperCase());
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [submit, del, type]);

  const known = word.split("").map((ch, i) =>
    revealed.includes(i) || rows.some((r) => r[i] === ch) ? ch : ""
  );

  const revealLetter = () => {
    const hidden = known.map((k, i) => (k ? -1 : i)).filter((i) => i >= 0);
    if (!hidden.length || revealed.length >= 2) return;
    setRevealed((r) => [...r, hidden[Math.floor(Math.random() * hidden.length)]]);
  };

  const letterState = useMemo(() => {
    const rank: Record<Mark, number> = { miss: 0, near: 1, hit: 2 };
    const map: Record<string, Mark> = {};
    rows.forEach((r) =>
      evaluate(r, word).forEach((m, i) => {
        const ch = r[i];
        if (!map[ch] || rank[m] > rank[map[ch]]) map[ch] = m;
      })
    );
    return map;
  }, [rows, word]);

  const keyboard = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

  return (
    <div className="text-center">
      <p className="text-sm text-slate-500">
        Guess the {len}-letter word in {MAX_TRIES} tries. Green is right, yellow is in the word but misplaced.
      </p>

      {/* secret word bar */}
      <div className="my-4 flex justify-center gap-1.5">
        {known.map((k, i) => (
          <div
            key={i}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-lg font-bold text-emerald-700"
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={k || (over ? word[i] : "?")}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 14 }}
                className={k || over ? "" : "text-emerald-300"}
              >
                {k || (over ? word[i] : "?")}
              </motion.span>
            </AnimatePresence>
          </div>
        ))}
      </div>

      {!over && (
        <div className="mb-4 flex flex-wrap justify-center gap-3">
          <SmallBtn onClick={() => setClue((c) => !c)} icon={<Lightbulb size={16} />}>
            {clue ? "Hide clue" : "Get clue"}
          </SmallBtn>
          <SmallBtn onClick={revealLetter} icon={<Sparkles size={16} />}>
            Reveal a letter ({2 - revealed.length} left)
          </SmallBtn>
        </div>
      )}
      <ClueBox show={clue && !over} topic={entry.topic} hint={entry.hint} tone="bg-emerald-50 text-emerald-800" />

      {/* grid */}
      <div className="mt-5 flex flex-col gap-1.5">
        {Array.from({ length: MAX_TRIES }, (_, r) => {
          if (r < rows.length) return <FlipRow key={`s${r}`} guess={rows[r]} word={word} />;
          const active = r === rows.length && !over;
          return (
            <div key={`e${r}`} className="flex justify-center gap-1.5">
              {Array.from({ length: len }, (_, i) => {
                const ch = active ? current[i] : undefined;
                return (
                  <div
                    key={i}
                    className={`flex h-11 w-11 items-center justify-center rounded-lg border-2 text-xl font-extrabold text-slate-800 transition-colors sm:h-12 sm:w-12 ${
                      active && i === current.length
                        ? "border-emerald-400 bg-emerald-50/50"
                        : ch
                          ? "border-slate-400"
                          : "border-slate-200"
                    }`}
                  >
                    {ch && (
                      <motion.span
                        key={ch + i}
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 16 }}
                      >
                        {ch}
                      </motion.span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="h-8">
        <AnimatePresence>
          {msg && (
            <motion.p
              key={msg}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 text-sm font-semibold text-rose-500"
            >
              {msg}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {!over ? (
        <div className="mt-2 flex flex-col gap-1.5">
          {keyboard.map((row, ri) => (
            <div key={row} className="flex justify-center gap-1">
              {ri === 2 && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={submit}
                  className="rounded-lg bg-emerald-500 px-3 text-xs font-bold text-white sm:px-4"
                >
                  Enter
                </motion.button>
              )}
              {row.split("").map((ch) => {
                const m = letterState[ch];
                return (
                  <motion.button
                    key={ch}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => type(ch)}
                    className={`h-11 w-7 rounded-md text-sm font-bold sm:w-9 ${
                      m === "hit"
                        ? "bg-emerald-500 text-white"
                        : m === "near"
                          ? "bg-amber-400 text-white"
                          : m === "miss"
                            ? "bg-slate-300 text-slate-500"
                            : "bg-slate-100 text-slate-700 hover:bg-emerald-100"
                    }`}
                  >
                    {ch}
                  </motion.button>
                );
              })}
              {ri === 2 && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={del}
                  aria-label="Delete letter"
                  className="flex items-center rounded-lg bg-slate-200 px-3 text-slate-700 sm:px-4"
                >
                  <Delete size={18} />
                </motion.button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <ResultCard
          won={won}
          delay={len * 0.12 + 0.5}
          message={
            won
              ? `You found ${word} in ${rows.length} ${rows.length === 1 ? "try" : "tries"}!`
              : `The secret word was ${word}.`
          }
          onAgain={onRestart}
          onHome={onHome}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Game 4: Sliding Tile                                                */
/* ------------------------------------------------------------------ */

function isSolved(tiles: number[]) {
  return tiles.every((t, i) => t === (i === tiles.length - 1 ? 0 : i + 1));
}

function shuffleBoard(size: number): number[] {
  const total = size * size;
  const tiles = Array.from({ length: total }, (_, i) => (i + 1) % total);
  let empty = total - 1;
  let prev = -1;
  for (let step = 0; step < total * 25; step++) {
    const r = Math.floor(empty / size);
    const c = empty % size;
    const options: number[] = [];
    if (r > 0) options.push(empty - size);
    if (r < size - 1) options.push(empty + size);
    if (c > 0) options.push(empty - 1);
    if (c < size - 1) options.push(empty + 1);
    const choices = options.filter((o) => o !== prev);
    const next = choices[Math.floor(Math.random() * choices.length)];
    [tiles[empty], tiles[next]] = [tiles[next], tiles[empty]];
    prev = empty;
    empty = next;
  }
  return isSolved(tiles) ? shuffleBoard(size) : tiles;
}

/** Slide a tile (and every tile between it and the gap) towards the gap. */
function slide(tiles: number[], size: number, pos: number): number[] | null {
  const empty = tiles.indexOf(0);
  const r = Math.floor(pos / size);
  const c = pos % size;
  const er = Math.floor(empty / size);
  const ec = empty % size;
  if (pos === empty || (r !== er && c !== ec)) return null;

  const next = [...tiles];
  const step = r === er ? (c < ec ? -1 : 1) : r < er ? -size : size;
  for (let p = empty; p !== pos; p += step) next[p] = next[p + step];
  next[pos] = 0;
  return next;
}

function Sliding({
  onWin,
  onRestart,
  onHome,
}: {
  onWin: () => void;
  onRestart: () => void;
  onHome: () => void;
}) {
  const [size, setSize] = useState(3);
  const [tiles, setTiles] = useState<number[]>(() => shuffleBoard(3));
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [started, setStarted] = useState(false);
  const won = isSolved(tiles);

  useEffect(() => {
    if (!started || won) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [started, won]);

  const press = useCallback(
    (pos: number) => {
      if (isSolved(tiles)) return;
      const next = slide(tiles, size, pos);
      if (!next) return;
      setTiles(next);
      setMoves((m) => m + 1);
      setStarted(true);
      if (isSolved(next)) onWin();
    },
    [tiles, size, onWin]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const empty = tiles.indexOf(0);
      const r = Math.floor(empty / size);
      const c = empty % size;
      let target = -1;
      if (e.key === "ArrowLeft" && c < size - 1) target = empty + 1;
      if (e.key === "ArrowRight" && c > 0) target = empty - 1;
      if (e.key === "ArrowUp" && r < size - 1) target = empty + size;
      if (e.key === "ArrowDown" && r > 0) target = empty - size;
      if (target >= 0) {
        e.preventDefault();
        press(target);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [tiles, size, press]);

  const changeSize = (s: number) => {
    setSize(s);
    setTiles(shuffleBoard(s));
    setMoves(0);
    setSeconds(0);
    setStarted(false);
  };

  const placed = tiles.filter((t, i) => t !== 0 && t === i + 1).length;
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mb-4 flex justify-center gap-2">
        {[3, 4].map((s) => (
          <button
            key={s}
            onClick={() => changeSize(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              size === s
                ? "bg-sky-600 text-white"
                : "bg-sky-100 text-sky-700 hover:bg-sky-200"
            }`}
          >
            {s === 3 ? "Easy 3×3" : "Hard 4×4"}
          </button>
        ))}
      </div>

      <div className="mb-4 flex justify-center gap-3">
        <Stat label="Moves" value={String(moves)} />
        <Stat label="Time" value={time} icon={<Timer size={14} />} />
        <Stat label="In place" value={`${placed}/${size * size - 1}`} />
      </div>

      <div className="relative mx-auto aspect-square w-full max-w-sm rounded-2xl bg-slate-200 p-1.5">
        <div className="relative h-full w-full">
          {Array.from({ length: size * size - 1 }, (_, k) => k + 1).map((n) => {
            const pos = tiles.indexOf(n);
            const r = Math.floor(pos / size);
            const c = pos % size;
            const home = pos === n - 1;
            return (
              <motion.button
                key={n}
                initial={false}
                onClick={() => press(pos)}
                animate={{ left: `${(c * 100) / size}%`, top: `${(r * 100) / size}%` }}
                transition={{ type: "spring", stiffness: 520, damping: 38 }}
                whileTap={{ scale: 0.93 }}
                style={{ width: `${100 / size}%`, height: `${100 / size}%` }}
                className="absolute p-1"
                aria-label={`Tile ${n}`}
              >
                <span
                  className={`flex h-full w-full items-center justify-center rounded-xl text-2xl font-extrabold shadow-sm transition-colors duration-300 sm:text-3xl ${
                    home
                      ? "bg-gradient-to-br from-sky-400 to-blue-600 text-white"
                      : "bg-white text-slate-700"
                  }`}
                >
                  {n}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Tap a tile (or a row of tiles) to slide it. Arrow keys work too. Blue tiles are in the right place.
      </p>

      {won ? (
        <ResultCard
          won
          message={`Solved in ${moves} moves and ${time}!`}
          onAgain={onRestart}
          onHome={onHome}
        />
      ) : (
        <div className="mt-4">
          <SmallBtn onClick={onRestart} icon={<RotateCcw size={16} />}>
            New puzzle
          </SmallBtn>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="min-w-20 rounded-xl bg-sky-50 px-4 py-2">
      <p className="flex items-center justify-center gap-1 text-xs text-slate-500">
        {icon}
        {label}
      </p>
      <p className="text-lg font-bold text-sky-700">{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function WinBadge({ wins }: { wins: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-amber-700">
      <Trophy size={18} />
      <span className="text-sm font-semibold">Wins</span>
      <motion.span
        key={wins}
        initial={{ scale: 1.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 12 }}
        className="inline-block min-w-4 text-center text-lg font-extrabold"
      >
        {wins}
      </motion.span>
    </div>
  );
}

export default function GamesPage() {
  const [active, setActive] = useState<GameId | null>(null);
  const [round, setRound] = useState(0);
  const [wins, setWins] = useState(0);

  const addWin = useCallback(() => setWins((w) => w + 1), []);
  const restart = useCallback(() => setRound((r) => r + 1), []);
  const home = useCallback(() => setActive(null), []);

  const info = GAMES.find((g) => g.id === active);

  const renderGame = () => {
    const props = { onWin: addWin, onRestart: restart, onHome: home };
    switch (active) {
      case "hangman":
        return <Hangman key={round} {...props} />;
      case "scramble":
        return <Scramble key={round} {...props} />;
      case "guess":
        return <Guess key={round} {...props} />;
      case "sliding":
        return <Sliding key={round} {...props} />;
      default:
        return null;
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-sky-50 text-slate-900">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <AnimatePresence mode="wait">
            {!active || !info ? (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="py-6 text-center"
              >
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                  Word &amp; Puzzle Games
                </h1>
                <p className="mx-auto mt-3 max-w-md text-slate-500">
                  Pick a game and start playing.
                </p>
                <div className="mt-5">
                  <WinBadge wins={wins} />
                </div>

                <div className="mx-auto mt-10 grid max-w-xl gap-4 sm:grid-cols-2">
                  {GAMES.map((g) => (
                    <motion.button
                      key={g.id}
                      onClick={() => {
                        setRound((r) => r + 1);
                        setActive(g.id);
                      }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className={`flex items-center gap-4 rounded-2xl bg-gradient-to-br ${g.button} p-5 text-left text-white shadow-md`}
                    >
                      <span className="rounded-xl bg-white/20 p-3">
                        <g.Icon size={30} strokeWidth={1.8} />
                      </span>
                      <span>
                        <span className="block text-lg font-bold">{g.name}</span>
                        <span className="block text-sm text-white/85">{g.blurb}</span>
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <button
                    onClick={home}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-white"
                  >
                    <ArrowLeft size={18} />
                    All games
                  </button>
                  <WinBadge wins={wins} />
                </div>

                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-xl p-2.5 ${info.soft}`}>
                      <info.Icon size={24} />
                    </span>
                    <h1 className="text-2xl font-extrabold sm:text-3xl">{info.name}</h1>
                  </div>
                  <motion.button
                    whileHover={{ rotate: -15 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={restart}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
                  >
                    <RotateCcw size={16} />
                    Restart
                  </motion.button>
                </div>

                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
                  {renderGame()}
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </MotionConfig>
  );
}