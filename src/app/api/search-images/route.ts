import { NextRequest, NextResponse } from "next/server";

// Google Custom Search API
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_SEARCH_ENGINE_ID;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ error: "Query mancante" }, { status: 400 });
    }

    // Se non ci sono le credenziali Google, usa un fallback
    if (!GOOGLE_API_KEY || !GOOGLE_CX) {
      console.warn("Google API non configurata, usando fallback");
      return NextResponse.json({
        images: [],
        error: "Google Custom Search API non configurata. Aggiungi GOOGLE_API_KEY e GOOGLE_SEARCH_ENGINE_ID nel file .env",
      }, { status: 200 });
    }

    // Chiamata a Google Custom Search API
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(query)}&searchType=image&num=10&imgSize=medium&safe=active`;

    const response = await fetch(searchUrl);
    const data = await response.json();

    if (!response.ok) {
      console.error("Google Search API error:", data);
      return NextResponse.json(
        { error: data.error?.message || "Errore nella ricerca" },
        { status: response.status }
      );
    }

    // Estrai le immagini dai risultati
    const images = (data.items || []).map((item: any) => ({
      url: item.link,
      thumbnail: item.image?.thumbnailLink || item.link,
      title: item.title,
      source: item.displayLink,
    }));

    return NextResponse.json({ images });
  } catch (error: any) {
    console.error("Error searching images:", error);
    return NextResponse.json(
      { error: error.message || "Errore del server" },
      { status: 500 }
    );
  }
}
