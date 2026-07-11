import { NextRequest, NextResponse } from "next/server";
import type { QuizQuestion } from "@/types";

export const maxDuration = 120;

// Helper to parse keys from env names (comma/newline/semicolon separated)
function parseKeysFromEnv(varNames: string[]): string[] {
  const raw = varNames
    .map((n) => process.env[n])
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!raw) return [];

  return Array.from(
    new Set(
      raw
        .split(/[\n,;]+/)
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );
}

function getOpenRouterApiKey(): string {
  const keys = parseKeysFromEnv(["OPENROUTER_API_KEYS", "OPENROUTER_API_KEY"]);
  if (keys.length === 0) {
    throw new Error("No API keys configured for OpenRouter (OPENROUTER_API_KEYS).");
  }
  return keys[0];
}

const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-oss-120bZ";
const OPENROUTER_ENDPOINT = process.env.OPENROUTER_ENDPOINT || "https://openrouter.ai/api/v1/chat/completions";

async function callOpenRouter(apiKey: string, prompt: string, config: { temperature: number; maxOutputTokens: number }) {
  const body = {
    model: OPENROUTER_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: config.temperature,
    max_output_tokens: config.maxOutputTokens,
  } as any;

  const res = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    const err: any = new Error(`OpenRouter error: ${res.status} ${res.statusText} ${txt}`);
    err.status = res.status;
    err.body = txt;
    throw err;
  }

  const data = await res.json();

  const text =
    data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || data?.output?.[0]?.content || "";

  return { text };
}

async function generateWithConfiguredApiKey(
  prompt: string,
  config: { temperature: number; maxOutputTokens: number }
) {
  const apiKey = getOpenRouterApiKey();
  return callOpenRouter(apiKey, prompt, config);
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

Study material:
${text.substring(0, 60000)}`;

    const rawResponse = await generateWithConfiguredApiKey(prompt, {
      temperature: 0.5,
      maxOutputTokens: 8072,
    });

    // Normalize response from different providers
    let responseText = "";
    try {
      if (!rawResponse) responseText = "";
      else if (typeof rawResponse === "string") responseText = rawResponse;
      else if (typeof rawResponse.text === "string") responseText = rawResponse.text;
      else if (typeof (rawResponse as any).result === "string") responseText = (rawResponse as any).result;
      else if ((rawResponse as any).choices?.[0]?.message?.content)
        responseText = (rawResponse as any).choices[0].message.content;
      else if ((rawResponse as any).choices?.[0]?.text)
        responseText = (rawResponse as any).choices[0].text;
      else if ((rawResponse as any).output?.[0]?.content)
        responseText = (rawResponse as any).output[0].content;
      else responseText = JSON.stringify(rawResponse);
    } catch (e) {
      responseText = String(rawResponse);
    }

    responseText = (responseText || "").trim();

    // Clean the response - remove markdown code blocks if present
    let jsonText = responseText;
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
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
            error: "AI generated an invalid response. Please try again.",
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

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    const statusCode = (error as any)?.status;

    // Detect invalid API key / unauthorized
    if (
      statusCode === 401 ||
      statusCode === 403 ||
      errorMessage.toLowerCase().includes("unauthor") ||
      (errorMessage.toLowerCase().includes("invalid") && errorMessage.toLowerCase().includes("key"))
    ) {
      return NextResponse.json({ success: false, error: "Invalid API key. Check your OPENROUTER_API_KEYS in .env.local" }, { status: 401 });
    }

    if (errorMessage.includes("quota") || errorMessage.includes("rate")) {
      return NextResponse.json({ success: false, error: "API rate limit reached. Please try again in a moment." }, { status: 429 });
    }

    return NextResponse.json({ success: false, error: errorMessage || "Failed to generate quiz. Please try again." }, { status: 500 });
  }
}
