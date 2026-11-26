import { NextRequest, NextResponse } from "next/server";
import { AiService } from "@/lib/ai/ai-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl, imageBase64, imageName, hint, simulateFailure, simulateTimeout, simulateInvalidResponse } = body;

    const result = await AiService.classifyImage(
      { imageUrl, imageBase64, imageName, hint },
      { simulateFailure, simulateTimeout, simulateInvalidResponse }
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to classify image",
        category: "Unknown",
        suggestionText: "AI suggestion: Unknown",
        isFallback: true,
      },
      { status: 500 }
    );
  }
}
