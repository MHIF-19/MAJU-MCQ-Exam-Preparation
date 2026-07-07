"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Brain, Loader2, Sparkles } from "lucide-react";

const funFacts = [
  "Quizzes improve long-term retention by up to 50%",
  "Active recall is the most effective study technique",
  "Testing yourself beats re-reading by 3x",
  "Spaced repetition + quizzes = memory mastery",
  "The testing effect: retrieval strengthens memory",
  "Students who self-test score 30% higher on exams",
];

export default function LoadingScreen() {
  const [factIndex, setFactIndex] = useState(0);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const factInterval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % funFacts.length);
    }, 3000);

    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    return () => {
      clearInterval(factInterval);
      clearInterval(dotInterval);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-lg mx-auto flex flex-col items-center text-center space-y-10 py-10"
    >
      {/* Animated brain icon */}
      <div className="relative">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center"
        >
          <Brain className="w-12 h-12 text-violet-400" />
        </motion.div>

        {/* Orbiting sparkles */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              rotate: 360,
            }}
            transition={{
              repeat: Infinity,
              duration: 3,
              delay: i * 1,
              ease: "linear",
            }}
            className="absolute inset-0"
            style={{ transformOrigin: "center center" }}
          >
            <Sparkles
              className="w-4 h-4 text-fuchsia-400/60 absolute"
              style={{
                top: i === 0 ? "-8px" : i === 1 ? "50%" : "auto",
                bottom: i === 2 ? "-8px" : "auto",
                left: i === 1 ? "-8px" : "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Loading text */}
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
          <h2 className="text-xl font-semibold text-white">
            Generating your quiz{dots}
          </h2>
        </div>
        <p className="text-sm text-white/40">
          AI is crafting personalized questions from your study material
        </p>
      </div>

      {/* Animated progress dots */}
      <div className="flex items-center gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
            className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
          />
        ))}
      </div>

      {/* Fun facts */}
      <motion.div
        key={factIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="px-6 py-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
      >
        <p className="text-xs text-white/30 uppercase tracking-wider mb-1">
          Did you know?
        </p>
        <p className="text-sm text-white/60">{funFacts[factIndex]}</p>
      </motion.div>
    </motion.div>
  );
}
