"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Brain,
  Zap,
  Shield,
  ArrowRight,
  Upload,
  BookOpen,
  Globe,
  ChevronLeft,
} from "lucide-react";
import FileUpload from "@/components/FileUpload";
import QuizConfig from "@/components/QuizConfig";
import LoadingScreen from "@/components/LoadingScreen";
import QuizGame from "@/components/QuizGame";
import ResultScreen from "@/components/ResultScreen";
import { PRELOADED_SUBJECTS } from "@/lib/subjects";
import type { AppStep, QuizConfig as QuizConfigType, QuizQuestion, QuizResult } from "@/types";

export default function Home() {
  const [step, setStep] = useState<AppStep>("upload");
  const [activeSubStep, setActiveSubStep] = useState<"select" | "upload">("select");
  const [extractedText, setExtractedText] = useState("");
  const [fileName, setFileName] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quizConfig, setQuizConfig] = useState<QuizConfigType | null>(null);
  const [preloadedLoading, setPreloadedLoading] = useState(false);

  const handleFileProcessed = useCallback((text: string, name: string) => {
    setExtractedText(text);
    setFileName(name);
    setStep("configure");
    setError(null);
  }, []);

  const handleLoadPreloaded = useCallback(async (subjectId: string) => {
    const subject = PRELOADED_SUBJECTS.find((s) => s.id === subjectId);
    if (!subject) return;

    setStep("loading");
    setPreloadedLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/preloaded", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || `Failed to load notes for ${subject.title}`);
      }

      setExtractedText(data.text);
      setFileName(subject.title);
      setStep("configure");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load preloaded slides.";
      setError(message);
      setStep("upload");
      setActiveSubStep("select");
    } finally {
      setPreloadedLoading(false);
    }
  }, []);

  const handleStartQuiz = useCallback(
    async (config: QuizConfigType) => {
      setQuizConfig(config);
      setStep("loading");
      setError(null);

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: extractedText,
            numQuestions: config.numQuestions,
            difficulty: config.difficulty,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to generate quiz.");
        }

        setQuestions(data.questions);
        setStep("quiz");
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "An unexpected error occurred. Please try again.";
        setError(message);
        setStep("configure");
      }
    },
    [extractedText]
  );

  const handleQuizComplete = useCallback((result: QuizResult) => {
    setQuizResult(result);
    setStep("result");
  }, []);

  const handleRetry = useCallback(() => {
    setQuizResult(null);
    setStep("quiz");
  }, []);

  const handleNewQuiz = useCallback(() => {
    setQuizResult(null);
    setQuestions([]);
    setStep("configure");
  }, []);

  const handleHome = useCallback(() => {
    setStep("upload");
    setActiveSubStep("select");
    setExtractedText("");
    setFileName("");
    setQuestions([]);
    setQuizResult(null);
    setQuizConfig(null);
    setError(null);
  }, []);

  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col justify-between">
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-500/[0.07] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-fuchsia-500/[0.05] rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/[0.03] rounded-full blur-[120px]" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative z-10 flex-1 flex flex-col justify-between">
        {/* Header - shown on non-quiz steps */}
        {step !== "quiz" && (
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-b border-white/[0.04]"
          >
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
              <button
                onClick={handleHome}
                className="flex items-center gap-2.5 group"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg text-white tracking-tight group-hover:text-violet-300 transition-colors">
                  MAJU MCQ
                  <span className="text-violet-400 ml-0.5">Prep</span>
                </span>
              </button>

              <div className="hidden md:flex items-center gap-1 text-xs text-white/30">
                <span className="px-2 py-1 rounded bg-white/[0.04]">
                  Vibe Coded by Muhammad Hammad FA24-BSCS-0202 using Antigravity
                </span>
              </div>
            </div>
          </motion.header>
        )}

        {/* Main content */}
        <div
          className={`max-w-6xl mx-auto px-6 w-full flex-1 flex flex-col justify-center ${step === "quiz" ? "py-6" : "py-12 md:py-20"}`}
        >
          {error && step === "upload" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center"
            >
              <p className="text-sm text-red-300">{error}</p>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {/* Upload Step */}
            {step === "upload" && (
              <motion.div
                key="upload-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12 w-full"
              >
                {activeSubStep === "select" ? (
                  <>
                    {/* Hero */}
                    <div className="text-center space-y-5">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-sm text-violet-300"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        MAJU Exam Preparation Platform
                      </motion.div>

                      <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-bold tracking-tight text-white"
                      >
                        MAJU MCQ
                        <br />
                        <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                          Exam Preparation
                        </span>
                      </motion.h1>

                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-base md:text-lg text-white/40 max-w-xl mx-auto leading-relaxed"
                      >
                        Select a course below to practice AI-generated MCQs from official slides, or upload your own lecture notes to get started.
                      </motion.p>
                    </div>

                    {/* Three Cards Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                      {/* Card 1: Upload Your Notes */}
                      <motion.div
                        whileHover={{ y: -6, scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] p-6 flex flex-col justify-between overflow-hidden group cursor-pointer"
                        onClick={() => setActiveSubStep("upload")}
                      >
                        {/* Glow background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-fuchsia-600/10 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                        
                        <div className="space-y-4 relative z-10">
                          <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                            <Upload className="w-6 h-6 text-violet-400" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-xl font-bold text-white group-hover:text-violet-300 transition-colors">
                              Upload Your Notes
                            </h3>
                            <p className="text-sm text-white/50 leading-relaxed">
                              Upload one or multiple lecture slides (PDF, DOCX, PPTX) and generate AI-powered MCQs.
                            </p>
                          </div>
                        </div>

                        <div className="mt-8 pt-4 border-t border-white/[0.04] flex items-center justify-between relative z-10">
                          <span className="text-xs text-white/30">Up to 10 files (50 MB)</span>
                          <span className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition-colors">
                            [Open]
                          </span>
                        </div>
                      </motion.div>

                      {/* Dynamic Course Cards */}
                      {PRELOADED_SUBJECTS.map((subject) => {
                        const isCCE = subject.id === "cce";
                        const iconColor = isCCE ? "text-emerald-400" : "text-amber-400";
                        const iconBg = isCCE ? "bg-emerald-500/10" : "bg-amber-500/10";
                        const glowStyle = isCCE 
                          ? "group-hover:from-emerald-600/10 group-hover:to-teal-600/10" 
                          : "group-hover:from-amber-600/10 group-hover:to-orange-600/10";
                        const hoverText = isCCE ? "group-hover:text-emerald-300" : "group-hover:text-amber-300";
                        const btnBg = isCCE ? "bg-emerald-600 hover:bg-emerald-500" : "bg-amber-600 hover:bg-amber-500";
                        const Icon = isCCE ? Globe : BookOpen;

                        return (
                          <motion.div
                            key={subject.id}
                            whileHover={{ y: -6, scale: 1.01 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] p-6 flex flex-col justify-between overflow-hidden group cursor-pointer"
                            onClick={() => handleLoadPreloaded(subject.id)}
                          >
                            {/* Dynamic glow overlay */}
                            <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity blur-xl ${glowStyle}`} />
                            
                            <div className="space-y-4 relative z-10">
                              <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
                                <Icon className={`w-6 h-6 ${iconColor}`} />
                              </div>
                              <div className="space-y-2">
                                <h3 className={`text-xl font-bold text-white ${hoverText} transition-colors`}>
                                  {subject.title}
                                </h3>
                                <p className="text-sm text-white/50 leading-relaxed">
                                  {subject.description}
                                </p>
                              </div>
                            </div>

                            <div className="mt-8 pt-4 border-t border-white/[0.04] flex items-center justify-between relative z-10">
                              <span className="text-xs text-white/30">Official MAJU Slides</span>
                              <span className={`px-4 py-1.5 rounded-lg ${btnBg} text-xs font-semibold text-white transition-colors`}>
                                [Start]
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="space-y-6 w-full">
                    <div className="max-w-2xl mx-auto flex justify-start">
                      <button
                        onClick={() => setActiveSubStep("select")}
                        className="text-sm text-white/40 hover:text-white/70 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/[0.05]"
                      >
                        <ChevronLeft className="w-4 h-4" /> Back to Courses
                      </button>
                    </div>
                    <FileUpload onFileProcessed={handleFileProcessed} />
                  </div>
                )}
              </motion.div>
            )}

            {/* Configure Step */}
            {step === "configure" && (
              <motion.div
                key="configure"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8 w-full"
              >
                <div className="text-center space-y-3">
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-bold text-white"
                  >
                    Configure Your Quiz
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-white/40"
                  >
                    Choose how many questions and how challenging you want them
                  </motion.p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-2xl mx-auto p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center"
                  >
                    <p className="text-sm text-red-300">{error}</p>
                  </motion.div>
                )}

                <QuizConfig
                  fileName={fileName}
                  onStartQuiz={handleStartQuiz}
                  onBack={handleHome}
                />
              </motion.div>
            )}

            {/* Loading Step */}
            {step === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                <LoadingScreen />
              </motion.div>
            )}

            {/* Quiz Step */}
            {step === "quiz" && questions.length > 0 && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                {/* Minimal header for quiz */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={handleHome}
                    className="flex items-center gap-2 group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="font-bold text-sm text-white/60 group-hover:text-white transition-colors">
                      MAJU MCQ<span className="text-violet-400">Prep</span>
                    </span>
                  </button>

                  {quizConfig && (
                    <div className="flex items-center gap-2 text-xs text-white/30">
                      <span>{quizConfig.difficulty}</span>
                      <span>•</span>
                      <span>{questions.length} Qs</span>
                    </div>
                  )}
                </div>

                <QuizGame
                  questions={questions}
                  onComplete={handleQuizComplete}
                />
              </motion.div>
            )}

            {/* Result Step */}
            {step === "result" && quizResult && (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                <ResultScreen
                  result={quizResult}
                  onRetry={handleRetry}
                  onNewQuiz={handleNewQuiz}
                  onHome={handleHome}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {step !== "quiz" && (
          <footer className="border-t border-white/[0.04] py-6 text-center text-xs text-white/20">
            <div className="max-w-6xl mx-auto px-6">
              © {new Date().getFullYear()} MAJU MCQ Exam Preparation. Designed for students preparing for exams.
            </div>
          </footer>
        )}
      </div>
    </main>
  );
}
