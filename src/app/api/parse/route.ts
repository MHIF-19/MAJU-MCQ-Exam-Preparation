import { NextRequest, NextResponse } from "next/server";
import { MAX_FILE_SIZE, SUPPORTED_EXTENSIONS } from "@/types";
import { parseDocumentBuffer } from "@/lib/parser";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 20 MB limit." },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    const extension = "." + fileName.split(".").pop();

    if (!SUPPORTED_EXTENSIONS.includes(extension as typeof SUPPORTED_EXTENSIONS[number])) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported file type. Supported: ${SUPPORTED_EXTENSIONS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extractedText = await parseDocumentBuffer(buffer, file.name);

    if (!extractedText || extractedText.length < 50) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Could not extract enough text from the document. The file might be empty, image-based, or corrupted.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      text: extractedText,
      charCount: extractedText.length,
    });
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to parse the document. It might be corrupted or in an unsupported format.",
      },
      { status: 500 }
    );
  }
}
