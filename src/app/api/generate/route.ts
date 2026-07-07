import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import type { QuizQuestion } from "@/types";

export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Gemini API key is not configured. Set GEMINI_API_KEY in your environment variables.",
      },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { text, numQuestions, difficulty } = body;

    if (!text || !numQuestions || !difficulty) {
      return NextResponse.json(
        { success: false, error: "Missing required fields." },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

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

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 16384,
      },
    });

    const responseText = response.text?.trim() || "";

    // Clean the response - remove markdown code blocks if present
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
      // Try to extract JSON array from the response
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

    // Validate the questions
    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "AI did not generate any valid questions. Please try again.",
        },
        { status: 500 }
      );
    }

    // Validate each question structure
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
        error: "Failed to generate quiz. Please check your internet connection and try again.",
      },
      { status: 500 }
    );
  }
}
