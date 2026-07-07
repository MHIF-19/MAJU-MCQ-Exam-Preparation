import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MAJU MCQ Exam Preparation — Turn Study Materials into Interactive Quizzes",
  description:
    "Upload your lecture slides, PDFs, or documents and let AI generate personalized quizzes. Practice smarter with MAJU MCQ Exam Preparation.",
  keywords: [
    "maju exam prep",
    "maju mcq prep",
    "quiz generator",
    "AI quiz",
    "study tool",
    "lecture slides quiz",
    "PDF quiz",
    "student study",
  ],
  openGraph: {
    title: "MAJU MCQ Exam Preparation",
    description:
      "Turn your study materials into interactive quizzes powered by AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark h-full antialiased`}>
      <body className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-violet-500/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
