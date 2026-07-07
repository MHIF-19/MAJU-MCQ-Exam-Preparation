"use client";

import { motion } from "framer-motion";
import {
  Trophy,
  RotateCcw,
  Sparkles,
  Home,
  Clock,
  CheckCircle2,
  XCircle,
  Target,
  Star,
  Flame,
  Crown,
} from "lucide-react";
import type { QuizResult } from "@/types";
import Confetti from "./Confetti";

interface ResultScreenProps {
  result: QuizResult;
  onRetry: () => void;
  onNewQuiz: () => void;
  onHome: () => void;
}

function getPerformanceData(percentage: number) {
  if (percentage >= 90)
    return {
      message: "Outstanding! You've mastered this material! 🏆",
      emoji: "🏆",
      icon: Crown,
      color: "from-yellow-500 to-amber-500",
      textColor: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      grade: "A+",
    };
  if (percentage >= 80)
    return {
      message: "Excellent work! You're nearly there! 🌟",
      emoji: "🌟",
      icon: Star,
      color: "from-emerald-500 to-green-500",
      textColor: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      grade: "A",
    };
  if (percentage >= 70)
    return {
      message: "Good job! Keep up the great work! 💪",
      emoji: "💪",
      icon: Target,
      color: "from-blue-500 to-cyan-500",
      textColor: "text-blue-400",
      bgColor: "bg-blue-500/10",
      grade: "B",
    };
  if (percentage >= 60)
    return {
      message: "Not bad! A little more practice will help! 📚",
      emoji: "📚",
      icon: Flame,
      color: "from-amber-500 to-orange-500",
      textColor: "text-amber-400",
      bgColor: "bg-amber-500/10",
      grade: "C",
    };
  return {
    message: "Don't give up! Review the material and try again! 💡",
    emoji: "💡",
    icon: Sparkles,
    color: "from-violet-500 to-fuchsia-500",
    textColor: "text-violet-400",
    bgColor: "bg-violet-500/10",
    grade: "D",
  };
}

export default function ResultScreen({
  result,
  onRetry,
  onNewQuiz,
  onHome,
}: ResultScreenProps) {
  const perf = getPerformanceData(result.percentage);
  const PerfIcon = perf.icon;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  return (
    <>
      {result.percentage >= 80 && <Confetti />}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl mx-auto space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              bounce: 0.5,
              delay: 0.2,
            }}
            className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${perf.color} mx-auto flex items-center justify-center shadow-lg`}
          >
            <PerfIcon className="w-10 h-10 text-white" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-3xl font-bold text-white">Quiz Complete!</h2>
            <p className="text-white/50 mt-2 text-lg">{perf.message}</p>
          </motion.div>
        </div>

        {/* Score circle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center"
        >
          <div className="relative w-44 h-44">
            {/* Background ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-white/[0.05]"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                stroke="url(#gradient)"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                initial={{ strokeDashoffset: 264 }}
                animate={{
                  strokeDashoffset:
                    264 - (264 * result.percentage) / 100,
                }}
                transition={{ delay: 0.7, duration: 1.5, ease: "easeOut" }}
                strokeDasharray="264"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#d946ef" />
                </linearGradient>
              </defs>
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-4xl font-bold text-white"
              >
                {result.percentage}%
              </motion.span>
              <span className="text-sm text-white/40">Score</span>
            </div>
          </div>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {[
            {
              label: "Total",
              value: result.totalQuestions,
              icon: Target,
              color: "text-violet-400",
            },
            {
              label: "Correct",
              value: result.correctAnswers,
              icon: CheckCircle2,
              color: "text-emerald-400",
            },
            {
              label: "Wrong",
              value: result.wrongAnswers,
              icon: XCircle,
              color: "text-red-400",
            },
            {
              label: "Time",
              value: formatTime(result.timeTaken),
              icon: Clock,
              color: "text-cyan-400",
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center space-y-2"
              >
                <Icon className={`w-5 h-5 mx-auto ${stat.color}`} />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/40">{stat.label}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Grade badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex justify-center"
        >
          <div
            className={`px-6 py-2 rounded-full ${perf.bgColor} border border-white/[0.06]`}
          >
            <span className={`text-sm font-medium ${perf.textColor}`}>
              Grade: {perf.grade} • {result.correctAnswers}/{result.totalQuestions} correct
            </span>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRetry}
            className="flex-1 py-3.5 rounded-xl border-2 border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06] text-white font-medium flex items-center justify-center gap-2 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Retry Quiz
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNewQuiz}
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Generate New Quiz
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onHome}
            className="flex-1 py-3.5 rounded-xl border-2 border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06] text-white font-medium flex items-center justify-center gap-2 transition-all"
          >
            <Home className="w-4 h-4" />
            Return Home
          </motion.button>
        </motion.div>
      </motion.div>
    </>
  );
}
