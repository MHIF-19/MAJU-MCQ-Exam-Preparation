"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Clock,
  Hash,
  Lightbulb,
  Trophy,
  Zap,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { QuizQuestion, QuizResult } from "@/types";

interface QuizGameProps {
  questions: QuizQuestion[];
  onComplete: (result: QuizResult) => void;
}

export default function QuizGame({ questions, onComplete }: QuizGameProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  const question = questions[currentIndex];
  const progress = ((currentIndex + (isSubmitted ? 1 : 0)) / questions.length) * 100;

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmit = useCallback(() => {
    if (selectedOption === null || isSubmitted) return;
    setIsSubmitted(true);
    setShowExplanation(true);

    const isCorrect = selectedOption === question.correct;
    if (isCorrect) {
      setScore((prev) => prev + 1);
      setStreak((prev) => {
        const newStreak = prev + 1;
        setBestStreak((best) => Math.max(best, newStreak));
        return newStreak;
      });
    } else {
      setStreak(0);
    }
  }, [selectedOption, isSubmitted, question.correct]);

  const handleNext = useCallback(() => {
    if (currentIndex === questions.length - 1) {
      // Quiz complete
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      const correctAnswers = score + (selectedOption === question.correct ? 0 : 0);
      // Score was already updated in handleSubmit
      onComplete({
        totalQuestions: questions.length,
        correctAnswers: score,
        wrongAnswers: questions.length - score,
        score: score,
        percentage: Math.round((score / questions.length) * 100),
        timeTaken,
      });
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
      setShowExplanation(false);
    }
  }, [currentIndex, questions.length, startTime, score, onComplete, selectedOption, question.correct]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "1" && e.key <= "4" && !isSubmitted) {
        setSelectedOption(parseInt(e.key) - 1);
      }
      if (e.key === "Enter") {
        if (!isSubmitted && selectedOption !== null) {
          handleSubmit();
        } else if (isSubmitted) {
          handleNext();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitted, selectedOption, handleSubmit, handleNext]);

  const getOptionStyle = (index: number) => {
    if (!isSubmitted) {
      if (selectedOption === index) {
        return "border-violet-500/50 bg-violet-500/10 ring-2 ring-violet-500/30";
      }
      return "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.05]";
    }

    if (index === question.correct) {
      return "border-emerald-500/50 bg-emerald-500/10";
    }
    if (index === selectedOption && index !== question.correct) {
      return "border-red-500/50 bg-red-500/10";
    }
    return "border-white/[0.05] bg-white/[0.01] opacity-50";
  };

  const getOptionIcon = (index: number) => {
    if (!isSubmitted) return null;
    if (index === question.correct) {
      return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    }
    if (index === selectedOption && index !== question.correct) {
      return <XCircle className="w-5 h-5 text-red-400" />;
    }
    return null;
  };

  const difficultyColor = {
    Easy: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    Medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    Hard: "text-red-400 bg-red-500/10 border-red-500/20",
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white/50">
            <Hash className="w-4 h-4" />
            <span className="text-sm font-medium">
              {currentIndex + 1}/{questions.length}
            </span>
          </div>
          <div className="flex items-center gap-2 text-white/50">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-mono">{formatTime(elapsed)}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {streak > 1 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20"
            >
              <Zap className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs font-bold text-orange-400">
                {streak} streak!
              </span>
            </motion.div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08]">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-sm font-bold text-white">
              {score}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Progress bar */}
      <Progress
        value={progress}
        className="h-2 bg-white/[0.05]"
      />

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Question header */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${difficultyColor[question.difficulty]}`}
              >
                {question.difficulty}
              </span>
              <span className="text-xs text-white/30">•</span>
              <span className="text-xs text-white/40">{question.topic}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-white leading-relaxed">
              {question.question}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                onClick={() => {
                  if (!isSubmitted) setSelectedOption(index);
                }}
                disabled={isSubmitted}
                className={`w-full p-4 md:p-5 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-4 group ${getOptionStyle(index)} ${!isSubmitted ? "cursor-pointer" : "cursor-default"}`}
              >
                {/* Option letter */}
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
                    !isSubmitted && selectedOption === index
                      ? "bg-violet-500 text-white"
                      : isSubmitted && index === question.correct
                        ? "bg-emerald-500 text-white"
                        : isSubmitted &&
                            index === selectedOption &&
                            index !== question.correct
                          ? "bg-red-500 text-white"
                          : "bg-white/[0.06] text-white/40 group-hover:bg-white/[0.1] group-hover:text-white/60"
                  }`}
                >
                  {String.fromCharCode(65 + index)}
                </span>

                <span
                  className={`flex-1 text-sm md:text-base ${
                    isSubmitted && index === question.correct
                      ? "text-emerald-300"
                      : isSubmitted &&
                          index === selectedOption &&
                          index !== question.correct
                        ? "text-red-300"
                        : "text-white/80"
                  }`}
                >
                  {option}
                </span>

                {getOptionIcon(index)}

                {/* Keyboard hint */}
                {!isSubmitted && (
                  <span className="hidden md:flex w-6 h-6 rounded items-center justify-center text-xs text-white/20 bg-white/[0.04] border border-white/[0.06]">
                    {index + 1}
                  </span>
                )}
              </motion.button>
            ))}
          </div>

          {/* Explanation */}
          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div
                  className={`p-4 rounded-xl flex items-start gap-3 ${
                    selectedOption === question.correct
                      ? "bg-emerald-500/10 border border-emerald-500/20"
                      : "bg-amber-500/10 border border-amber-500/20"
                  }`}
                >
                  <Lightbulb
                    className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      selectedOption === question.correct
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }`}
                  />
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        selectedOption === question.correct
                          ? "text-emerald-300"
                          : "text-amber-300"
                      }`}
                    >
                      {selectedOption === question.correct
                        ? "Correct! 🎉"
                        : "Not quite right"}
                    </p>
                    <p className="text-sm text-white/50 mt-1">
                      {question.explanation}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action button */}
          <div className="flex justify-end pt-2">
            {!isSubmitted ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={selectedOption === null}
                className={`px-8 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all duration-300 ${
                  selectedOption !== null
                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/20"
                    : "bg-white/[0.05] text-white/30 cursor-not-allowed"
                }`}
              >
                Submit Answer
                <span className="hidden md:inline text-xs opacity-50">
                  ↵
                </span>
              </motion.button>
            ) : (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-violet-500/20 transition-all duration-300"
              >
                {currentIndex === questions.length - 1
                  ? "See Results"
                  : "Next Question"}
                <ArrowRight className="w-4 h-4" />
                <span className="hidden md:inline text-xs opacity-50">
                  ↵
                </span>
              </motion.button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
