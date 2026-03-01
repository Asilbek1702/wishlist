import { NextResponse } from "next/server";
import { scrapeProduct } from "@/lib/scraper";
import { z } from "zod";

const schema = z.object({
  url: z.string().url("Некорректный URL"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message },
        { status: 400 }
      );
    }

    const product = await scrapeProduct(parsed.data.url);
    return NextResponse.json(product);
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json(
      { error: "Не удалось получить данные" },
      { status: 500 }
    );
  }
}
