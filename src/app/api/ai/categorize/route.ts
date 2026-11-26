import { NextRequest, NextResponse } from "next/server";
import { AiService } from "@/lib/ai/ai-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { foodName, notes, ingredients, simulateFailure, simulateTimeout, simulateInvalidResponse } = body;

    const result = await AiService.smartCategorize(
      { foodName, notes, ingredients },
      { simulateFailure, simulateTimeout, simulateInvalidResponse }
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to categorize food",
        category: "Cooked meals",
        suggestedAllergens: ["Vegetarian"],
        isFallback: true,
      },
      { status: 500 }
    );
  }
}
