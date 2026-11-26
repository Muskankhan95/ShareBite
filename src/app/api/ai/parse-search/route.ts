import { NextRequest, NextResponse } from "next/server";
import { AiService } from "@/lib/ai/ai-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, simulateFailure, simulateTimeout, simulateInvalidResponse } = body;

    const result = await AiService.parseSearchQuery(
      query || "",
      { simulateFailure, simulateTimeout, simulateInvalidResponse }
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to parse natural language search",
        summary: "All available nearby food",
        rawQuery: "",
        isFallback: true,
      },
      { status: 500 }
    );
  }
}
