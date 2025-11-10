import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  
  return NextResponse.json({
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
    hasSearchEngineId: !!searchEngineId,
    searchEngineId: searchEngineId || "NOT_SET",
  });
}
