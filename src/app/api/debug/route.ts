import { NextResponse } from "next/server";

// Same parsing logic as the generator but non-sensitive — only returns prefixes
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
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );
}

function parseProviderKeys(): { provider: string; apiKey: string }[] {
  const providers: { provider: string; apiKey: string }[] = [];
  const openrouter = parseKeysFromEnv(["OPENROUTER_API_KEYS", "OPENROUTER_API_KEY"]);
  for (const k of openrouter) providers.push({ provider: "openrouter", apiKey: k });
  return providers;
}

function getRandomIndex(max: number) {
  return Math.floor(Math.random() * max);
}

export function GET() {
  try {
    const pool = parseProviderKeys();
    if (pool.length === 0) {
      return NextResponse.json({ success: false, error: 'No OpenRouter keys configured.' }, { status: 400 });
    }

    const start = getRandomIndex(pool.length);
    const entry = pool[start];

    return NextResponse.json({
      success: true,
      provider: entry.provider,
      prefix: entry.apiKey.slice(0, 6),
      poolCount: pool.length,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
