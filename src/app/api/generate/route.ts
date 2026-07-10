import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import type { QuizQuestion } from "@/types";

export const maxDuration = 60;

function parseGeminiApiKeys(): string[] {
  const rawKeys = [
    process.env.GEMINI_API_KEYS,
    process.env.GEMINI_API_KEY_LIST,
    process.env.GEMINI_API_KEY,
  ]
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!rawKeys) {
    return [];
  }

  return Array.from(
    new Set(
      rawKeys
        .split(/[\n,]+/)
        .map((key) => key.trim())
        .filter(Boolean)
    )
  );
}

function shuffleArray<T>(items: T[]): T[] {
  const cloned = [...items];
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
}

async function generateWithRotatingApiKey(
  prompt: string,
  config: { temperature: number; maxOutputTokens: number }
) {
  const apiKeys = shuffleArray(parseGeminiApiKeys());

  if (apiKeys.length === 0) {
    throw new Error(
      "Gemini API key is not configured. Set GEMINI_API_KEYS or GEMINI_API_KEY in your environment variables."
    );
  }

  let lastError: unknown;

  for (const apiKey of apiKeys) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      return await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config,
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Failed to generate quiz with the provided Gemini API keys.");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, numQuestions, difficulty } = body;

    if (!text || !numQuestions || !difficulty) {
      return NextResponse.json(
        { success: false, error: "Missing required fields." },
        { status: 400 }
      );
    }

    const prompt = `You are an expert university professor. Study all provided material carefully.
Generate exactly ${numQuestions} multiple-choice questions with ${difficulty} difficulty.

RULES:
- Questions must be STRICTLY based on the provided content only.
- The questions must be distributed across the entire study material naturally. Do NOT focus only on the beginning. Cover all major topics and chapters present in the material.
- Each question must have exactly 4 options.
- Only ONE option should be correct.
- The "correct" field is the 0-based index of the correct option.
- Include a brief one-line explanation for why the answer is correct.
- Include the topic name from the content that the question relates to.
- Set the difficulty to "${difficulty}".
- Vary question types: factual recall, conceptual understanding, and application.
- Make wrong options plausible but clearly incorrect to someone who studied.
- For ${difficulty} difficulty:
  ${difficulty === "Easy" ? "- Focus on basic definitions, key terms, and straightforward facts." : ""}
  ${difficulty === "Medium" ? "- Include application questions, comparisons, and understanding of relationships." : ""}
  ${difficulty === "Hard" ? "- Include analysis, synthesis, edge cases, and nuanced understanding." : ""}

OUTPUT FORMAT:
Return ONLY a valid JSON array. No markdown, no code blocks, no extra text.
Each element must follow this exact schema:
{
  "question": "string",
  "options": ["string", "string", "string", "string"],
  "correct": number,
  "explanation": "string",
  "topic": "string",
  "difficulty": "${difficulty}"
}

STUDY MATERIAL:
${text.substring(0, 80000)}`;

    const response = await generateWithRotatingApiKey(prompt, {
      temperature: 0.7,
      maxOutputTokens: 16384,
    });

    const responseText = response.text?.trim() || "";

    let jsonText = responseText;
    if (jsonText.startsWith("```")) {
      jsonText = jsonText
        .replace(/^```(?:json)?\s*\n?/, "")
        .replace(/\n?```\s*$/, "");
    }

    let questions: QuizQuestion[];
    try {
      questions = JSON.parse(jsonText);
    } catch {
      const arrayMatch = jsonText.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        questions = JSON.parse(arrayMatch[0]);
      } else {
        return NextResponse.json(
          {
            success: false,
            error:
              "AI generated an invalid response. Please try again.",
          },
          { status: 500 }
        );
      }
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "AI did not generate any valid questions. Please try again.",
        },
        { status: 500 }
      );
    }

    const validQuestions = questions.filter(
      (q) =>
        q.question &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        typeof q.correct === "number" &&
        q.correct >= 0 &&
        q.correct <= 3 &&
        q.explanation &&
        q.topic
    );

    if (validQuestions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "AI generated questions with invalid structure. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      questions: validQuestions.slice(0, numQuestions),
    });
  } catch (error) {
    console.error("Generate error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    if (errorMessage.includes("API key")) {
      return NextResponse.json(
        { success: false, error: "Invalid Gemini API key." },
        { status: 401 }
      );
    }

    if (errorMessage.includes("quota") || errorMessage.includes("rate")) {
      return NextResponse.json(
        {
          success: false,
          error: "API rate limit reached. Please try again in a moment.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage || "Failed to generate quiz. Please try again.",
      },
      { status: 500 }
    );
  }
}
