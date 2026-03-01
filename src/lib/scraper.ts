import * as cheerio from "cheerio";
import type { ScrapedProduct } from "@/types";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error("Fetch failed");
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

function extractJsonLd($: cheerio.CheerioAPI): Partial<ScrapedProduct> | null {
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    try {
      const json = JSON.parse($(scripts[i]).html() || "{}");
      const data = Array.isArray(json)
        ? json.find((x: { "@type"?: string }) => x["@type"]?.includes("Product"))
        : json;

      if (data?.["@type"]?.includes("Product")) {
        const name = data.name || data.title;
        const description = data.description;
        const image = typeof data.image === "string" ? data.image : data.image?.[0];
        const offers = data.offers;
        let price: number | undefined;
        let currency = "RUB";

        if (offers) {
          const offer = Array.isArray(offers) ? offers[0] : offers;
          price = parseFloat(offer?.price);
          currency = offer?.priceCurrency || currency;
        }

        if (name) {
          return { title: name, description, price, currency, imageUrl: image };
        }
      }
    } catch {
      continue;
    }
  }
  return null;
}

function extractOg($: cheerio.CheerioAPI): Partial<ScrapedProduct> {
  const result: Partial<ScrapedProduct> = {};
  result.title = $('meta[property="og:title"]').attr("content") || undefined;
  result.description = $('meta[property="og:description"]').attr("content") || undefined;
  result.imageUrl = $('meta[property="og:image"]').attr("content") || undefined;
  const priceAmount = $('meta[property="og:price:amount"]').attr("content");
  if (priceAmount) result.price = parseFloat(priceAmount);
  result.currency = $('meta[property="og:price:currency"]').attr("content") || undefined;
  return result;
}

function extractMeta($: cheerio.CheerioAPI): Partial<ScrapedProduct> {
  const result: Partial<ScrapedProduct> = {};
  if (!result.title) result.title = $("title").text().trim() || undefined;
  if (!result.description) {
    result.description =
      $('meta[name="description"]').attr("content")?.trim() || undefined;
  }
  return result;
}

function extractPrice(html: string): { price?: number; currency?: string } {
  const pricePatterns = [
    /(?:price|цена)[:\s]*(\d[\d\s]*[.,]?\d*)\s*([₽€$]|RUB|EUR|USD)/gi,
    /(\d[\d\s]*[.,]?\d*)\s*([₽€$]|RUB|EUR|USD)/gi,
    /(?:price|цена)[:\s]*(\d[\d\s]*[.,]?\d*)/gi,
  ];

  for (const pattern of pricePatterns) {
    const match = pattern.exec(html);
    if (match) {
      const priceStr = match[1].replace(/\s/g, "").replace(",", ".");
      const price = parseFloat(priceStr);
      if (!isNaN(price) && price > 0) {
        const curr = match[2]?.toUpperCase();
        const currencyMap: Record<string, string> = { "₽": "RUB", "€": "EUR", "$": "USD" };
        return { price, currency: curr ? (currencyMap[curr] || curr) : "RUB" };
      }
    }
  }
  return {};
}

export async function scrapeProduct(url: string): Promise<ScrapedProduct> {
  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    const result: ScrapedProduct = { originalUrl: url };

    const jsonLd = extractJsonLd($);
    const og = extractOg($);
    const meta = extractMeta($);

    if (jsonLd?.title) {
      Object.assign(result, jsonLd);
    } else {
      result.title = og.title || meta.title;
      result.description = og.description || meta.description;
      result.imageUrl = og.imageUrl;
      result.price = og.price;
      result.currency = og.currency;
    }

    if (result.price == null) {
      const extracted = extractPrice(html);
      result.price = extracted.price;
      result.currency = result.currency || extracted.currency;
    }

    return result;
  } catch {
    return { originalUrl: url };
  }
}
