import { NextRequest, NextResponse } from "next/server";
import { AiService } from "@/lib/ai/ai-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { quickNotes, foodName, quantity, timeHint, simulateFailure, simulateTimeout, simulateInvalidResponse } = body;

    const result = await AiService.generateDescription(
      { quickNotes, foodName, quantity, timeHint },
      { simulateFailure, simulateTimeout, simulateInvalidResponse }
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to generate description",
        suggestedDescription: "Freshly prepared wholesome food surplus ready for community redistribution.",
        isFallback: true,
      },
      { status: 500 }
    );
  }
}
