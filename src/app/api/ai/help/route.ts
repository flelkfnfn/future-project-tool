import { NextRequest, NextResponse } from "next/server";

type HistoryEntry = {
  user: string;
  text: string;
};

function normalizeHistory(rawHistory: unknown): HistoryEntry[] {
  if (!Array.isArray(rawHistory)) {
    return [];
  }

  return rawHistory
    .map((entry) => {
      if (
        !entry ||
        typeof entry !== "object" ||
        typeof (entry as { text?: unknown }).text !== "string"
      ) {
        return null;
      }
      const userValue =
        typeof (entry as { user?: unknown }).user === "string"
          ? (entry as { user: string }).user
          : "participant";
      const textValue = (entry as { text: string }).text.trim();
      if (!textValue) {
        return null;
      }
      return {
        user: userValue,
        text: textValue,
      };
    })
    .filter((entry): entry is HistoryEntry => entry !== null);
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, history } = await req.json();

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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const systemPrompt = process.env.GEMINI_SYSTEM_PROMPT;
    const historyEntries = normalizeHistory(history);
    const historyText =
      historyEntries.length > 0
        ? historyEntries
            .map((entry) => `${entry.user}: ${entry.text}`)
            .join("\n")
        : "";
    const composedPrompt = historyText
      ? `${historyText}\n\n현재 질문: ${prompt}`
      : prompt;
    const fullPrompt = systemPrompt
      ? `${systemPrompt}\n\n${composedPrompt}`
      : composedPrompt;

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
