import { SUPPORTED_EXTENSIONS } from "@/types";

async function extractPptxText(buffer: Buffer): Promise<string> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);
  const texts: string[] = [];

  const slideFiles = Object.keys(zip.files)
    .filter((name) => name.match(/ppt\/slides\/slide\d+\.xml/))
    .sort();

  for (const slideFile of slideFiles) {
    const content = await zip.files[slideFile].async("text");
    const textMatches = content.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
    if (textMatches) {
      const slideTexts = textMatches
        .map((match) => match.replace(/<[^>]+>/g, ""))
        .filter(Boolean);
      texts.push(slideTexts.join(" "));
    }
  }

  return texts.join("\n\n");
}

export async function parseDocumentBuffer(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  const extension = "." + fileName.toLowerCase().split(".").pop();

  if (!SUPPORTED_EXTENSIONS.includes(extension as typeof SUPPORTED_EXTENSIONS[number])) {
    throw new Error(`Unsupported file extension: ${extension}`);
  }

  let extractedText = "";

  try {
    if (extension === ".pdf") {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buffer), verbosity: 0 });
      const textResult = await parser.getText();
      extractedText = textResult.text;
    } else if (extension === ".doc" || extension === ".docx") {
      try {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
      } catch {
        extractedText = buffer.toString("utf-8");
      }
    } else if (extension === ".ppt" || extension === ".pptx") {
      try {
        // @ts-expect-error pptx-parser has no official types
        const pptxParser = await import("pptx-parser");
        const parse = pptxParser.default || pptxParser;
        const slides = await parse(buffer);

        if (Array.isArray(slides)) {
          extractedText = slides
            .map((slide: Record<string, unknown>, i: number) => {
              const texts: string[] = [];
              if (slide.title) texts.push(String(slide.title));
              if (slide.body) texts.push(String(slide.body));
              if (slide.text) texts.push(String(slide.text));
              if (slide.content) texts.push(String(slide.content));
              if (Array.isArray(slide.texts)) {
                texts.push(...(slide.texts as string[]));
              }
              return `Slide ${i + 1}: ${texts.join(" ")}`;
            })
            .join("\n\n");
        } else if (typeof slides === "object" && slides !== null) {
          extractedText = JSON.stringify(slides);
        }
      } catch {
        try {
          extractedText = await extractPptxText(buffer);
        } catch {
          extractedText = buffer.toString("utf-8");
        }
      }
    }
  } catch (err) {
    console.error(`Error parsing ${fileName}, using text fallback:`, err);
    extractedText = buffer.toString("utf-8");
  }

  return extractedText
    .replace(/\s+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
