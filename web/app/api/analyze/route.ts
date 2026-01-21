import { MessageModel } from "@/models/MessageModel";
import { NextResponse, NextRequest } from "next/server";
import { AnalyzeService } from "@/lib/AnalyzeService";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const username = searchParams.get("username");
  const limit = parseInt(searchParams.get("limit") || "80", 10);

  if (!username) {
    return NextResponse.json(
      { error: "username is required" },
      { status: 400 },
    );
  }

  const messages = await MessageModel.getLastMessagesByUsername(
    username,
    limit,
  );

  if (messages.length === 0) {
    return NextResponse.json(
      { error: "Сообщений не найдено" },
      { status: 404 },
    );
  }

  const analysis = await AnalyzeService.analyzeUser({
    messages,
  });

  return NextResponse.json(analysis);
}
