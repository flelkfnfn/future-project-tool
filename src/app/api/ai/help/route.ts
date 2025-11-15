import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { ok: false, error: "Prompt is required" },
        { status: 400 }
      );
    }

    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (!googleApiKey) {
      console.error("GOOGLE_API_KEY is not set in environment variables.");
      return NextResponse.json(
        { ok: false, error: "AI service not configured" },
        { status: 500 }
      );
    }

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(googleApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const systemPrompt = process.env.GEMINI_SYSTEM_PROMPT;
    let fullPrompt = prompt;
    if (systemPrompt) {
      fullPrompt = `${systemPrompt}\n\n${prompt}`;
    }

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const aiResponseText = response.text();

    return NextResponse.json({ ok: true, text: aiResponseText });
  } catch (error) {
    console.error("AI help API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { ok: false, error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}
