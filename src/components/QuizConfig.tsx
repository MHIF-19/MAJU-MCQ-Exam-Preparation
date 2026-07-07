"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Zap,
  Target,
  Flame,
  ArrowRight,
  FileText,
  Sparkles,
} from "lucide-react";
import type { QuizConfig } from "@/types";

interface QuizConfigPanelProps {
  fileName: string;
  onStartQuiz: (config: QuizConfig) => void;
  onBack: () => void;
}

const questionCounts = [
  { value: 10 as const, label: "10", desc: "Quick Review", icon: Zap },
  { value: 20 as const, label: "20", desc: "Standard", icon: Target },
  { value: 40 as const, label: "40", desc: "Deep Dive", icon: Brain },
];

const difficulties = [
  {
    value: "Easy" as const,
    label: "Easy",
    desc: "Basic recall & definitions",
    icon: Sparkles,
    color: "from-emerald-500 to-green-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    textColor: "text-emerald-400",
  },
  {
    value: "Medium" as const,
    label: "Medium",
    desc: "Application & understanding",
    icon: Flame,
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    textColor: "text-amber-400",
  },
  {
    value: "Hard" as const,
    label: "Hard",
    desc: "Analysis & critical thinking",
    icon: Target,
    color: "from-red-500 to-rose-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    textColor: "text-red-400",
  },
];

export default function QuizConfigPanel({
  fileName,
  onStartQuiz,
  onBack,
}: QuizConfigPanelProps) {
  const [numQuestions, setNumQuestions] = useState<10 | 20 | 40>(10);
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">(
    "Medium"
  );

  const handleStart = () => {
    onStartQuiz({ numQuestions, difficulty });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto space-y-8"
    >
      {/* File info */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
      >
        <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white/70 truncate">{fileName}</p>
          <p className="text-xs text-white/30">Ready for quiz generation</p>
        </div>
        <button
          onClick={onBack}
          className="text-xs text-white/40 hover:text-white/60 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.05]"
        >
          Change file
        </button>
      </motion.div>

      {/* Number of Questions */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">
          Number of Questions
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {questionCounts.map((option, index) => {
            const Icon = option.icon;
            const isSelected = numQuestions === option.value;
            return (
              <motion.button
                key={option.value}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setNumQuestions(option.value)}
                className={`relative p-5 rounded-xl border-2 transition-all duration-300 text-center group ${
                  isSelected
                    ? "border-violet-500/50 bg-violet-500/10 shadow-lg shadow-violet-500/10"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="question-select"
                    className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div className="relative space-y-2">
                  <Icon
                    className={`w-5 h-5 mx-auto ${isSelected ? "text-violet-400" : "text-white/30 group-hover:text-white/50"} transition-colors`}
                  />
                  <p
                    className={`text-2xl font-bold ${isSelected ? "text-white" : "text-white/70"} transition-colors`}
                  >
                    {option.label}
                  </p>
                  <p
                    className={`text-xs ${isSelected ? "text-violet-300/70" : "text-white/30"} transition-colors`}
                  >
                    {option.desc}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Difficulty */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">
          Difficulty Level
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {difficulties.map((option, index) => {
            const Icon = option.icon;
            const isSelected = difficulty === option.value;
            return (
              <motion.button
                key={option.value}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                onClick={() => setDifficulty(option.value)}
                className={`relative p-5 rounded-xl border-2 transition-all duration-300 text-center group ${
                  isSelected
                    ? `${option.borderColor} ${option.bgColor} shadow-lg`
                    : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
                }`}
              >
                <div className="space-y-2">
                  <Icon
                    className={`w-5 h-5 mx-auto ${isSelected ? option.textColor : "text-white/30 group-hover:text-white/50"} transition-colors`}
                  />
                  <p
                    className={`text-lg font-bold ${isSelected ? "text-white" : "text-white/70"} transition-colors`}
                  >
                    {option.label}
                  </p>
                  <p
                    className={`text-xs ${isSelected ? "text-white/50" : "text-white/30"} transition-colors`}
                  >
                    {option.desc}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Start button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        onClick={handleStart}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold text-lg flex items-center justify-center gap-3 shadow-lg shadow-violet-500/20 transition-all duration-300"
      >
        <Sparkles className="w-5 h-5" />
        Generate Quiz
        <ArrowRight className="w-5 h-5" />
      </motion.button>
    </motion.div>
  );
}
