import { NextRequest, NextResponse } from "next/server";
import { AiService } from "@/lib/ai/ai-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history, userRole, simulateFailure, simulateTimeout, simulateInvalidResponse } = body;

    const result = await AiService.answerAssistant(
      { message: message || "", history, userRole },
      { simulateFailure, simulateTimeout, simulateInvalidResponse }
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to process question",
        content: "I am currently running in offline fallback mode. Please consult the platform navigation tabs or review the Food Safety declarations.",
        isFallback: true,
      },
      { status: 500 }
    );
  }
}
