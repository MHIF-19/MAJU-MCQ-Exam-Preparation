# MAJU MCQ Exam Preparation

MAJU MCQ Exam Preparation is a modern, AI-powered Next.js 16 application designed to help students prepare for exams at Mohammad Ali Jinnah University (MAJU). The app converts study materials (PDF, Word DOC/DOCX, PowerPoint PPT/PPTX) into interactive, engaging quizzes using Google Gemini AI.

## Key Features

- **Upload Your Notes**: Upload one or multiple study files (up to 10 files, max 50 MB total) to generate questions covering all uploaded material naturally.
- **Preloaded Course Slides**: Direct preparation cards for:
  - *Civic & Community Engagement (CCE)*
  - *Ideology & Constitution of Pakistan (ICP)*
- **AI Quiz Generation**: Powered by **Google Gemini 2.5 Flash** to generate multiple-choice questions distributed across all topics.
- **Interactive Quiz Flow**: Duolingo/Kahoot-style interactive gameplay featuring hot streaks, correct/incorrect feedback, in-depth explanations, and progress timelines.
- **Result Metrics**: Detailed score evaluation, time tracking, grade ratings, and interactive score-based confetti effects.
- **Extensible Subjects Design**: Easily add a new preloaded subject by simply adding its directory and defining it in `src/lib/subjects.ts`.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Parsing Engines**: `pdf-parse`, `mammoth`, `pptx-parser`, `jszip`
- **AI Client**: `@google/genai` (Gemini 2.5 Flash)

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory and add your Google Gemini API Key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to start practicing.

## Project Structure

- `public/preloaded/`: Contains the preloaded slide content (e.g. `cce/`, `icp/`).
- `src/app/api/preloaded/`: API route responsible for dynamically parsing preloaded materials.
- `src/app/api/parse/`: API route for individual document parsing.
- `src/app/api/generate/`: API route for prompt engineering and Gemini generation.