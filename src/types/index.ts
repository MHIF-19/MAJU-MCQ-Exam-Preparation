export interface QuizQuestion {
  question: string;
  options: [string, string, string, string];
  correct: number;
  explanation: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

export interface QuizConfig {
  numQuestions: 10 | 20 | 40;
  difficulty: "Easy" | "Medium" | "Hard";
}

export interface QuizState {
  questions: QuizQuestion[];
  currentIndex: number;
  answers: (number | null)[];
  isSubmitted: boolean[];
  score: number;
  startTime: number;
  endTime: number | null;
}

export interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  score: number;
  percentage: number;
  timeTaken: number; // in seconds
}

export interface UploadResponse {
  success: boolean;
  text?: string;
  error?: string;
}

export interface GenerateResponse {
  success: boolean;
  questions?: QuizQuestion[];
  error?: string;
}

export type AppStep = "upload" | "configure" | "loading" | "quiz" | "result";

export const SUPPORTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
  "text/plain",
] as const;

export const SUPPORTED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".txt",
] as const;

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB (individual file limit)
export const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50 MB (total limit)
export const MAX_FILE_COUNT = 10; // max 10 files

export interface SubjectConfig {
  id: string;
  title: string;
  description: string;
  folder: string;
}

