// app/api/companies/search/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

const ReqSchema = z.object({
  query: z.string().min(2),
  limit: z.number().int().min(1).max(50).default(25),
  // optional filters you might add later
  regions: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
});

type CompanyRow = {
  id: string; // stable-ish key for AG-Grid
  companyName: string;
  website: string;
  description: string;
  source: string; // e.g., "Google"
  resultType: "company";
  matchStatus: "Match" | "No Match" | "Neutral";
  significance: number; // 0-100
  relevance: number; // 0-100
  // Optional MVP placeholders (keep flat):
  regionFocus?: string;
  segment?: string;
  tags?: string; // comma-separated for AG Grid simplicity
};

// --- Google Custom Search (CSE) minimal fetch ---
// Set in Vercel + local .env:
// GOOGLE_API_KEY=...
// GOOGLE_CSE_ID=...
async function googleCseSearch(apiKey: string, cseId: string, q: string, num: number) {

  const url =
    "https://www.googleapis.com/customsearch/v1" +
    `?key=${encodeURIComponent(apiKey)}` +
    `&cx=${encodeURIComponent(cseId)}` +
    `&q=${encodeURIComponent(q)}` +
    `&num=${encodeURIComponent(String(Math.min(num, 10)))}`; // CSE num max is 10 per request

  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google CSE error: ${res.status} ${text}`);
  }
  return res.json() as Promise<{
    items?: Array<{
      title?: string;
      link?: string;
      snippet?: string;
      displayLink?: string;
    }>;
  }>;
}

function normalizeUrl(url: string) {
  try {
    const u = new URL(url);
    u.hash = "";
    // keep query for now; you can strip tracking later
    return u.toString();
  } catch {
    return url;
  }
}

function guessCompanyName(title: string, displayLink?: string) {
  // naive: prefer domain root label; fallback to first part of title
  if (displayLink) {
    const base = displayLink.replace(/^www\./, "").split(".")[0] || "";
    if (base) return base.charAt(0).toUpperCase() + base.slice(1);
  }
  const t = title.split("|")[0]?.split("—")[0]?.trim();
  return t || "Unknown";
}

function stableIdFrom(url: string) {
  // Simple stable key for AG-Grid rowId; OK for MVP
  return Buffer.from(url).toString("base64url").slice(0, 24);
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    const cseId = process.env.GOOGLE_CSE_ID;
    if (!apiKey || !cseId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing GOOGLE_API_KEY or GOOGLE_CSE_ID. Add them to .env.local and restart dev server.",
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const parsed = ReqSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { query, limit } = parsed.data;

    // Google CSE returns max 10 per request; for MVP, do 1–3 pages if needed
    const target = Math.min(limit, 30);
    const pages = Math.ceil(target / 10);
    const rawItems: any[] = [];

    for (let i = 0; i < pages; i++) {
      // you can support pagination with `start` param later; keep MVP simple
      const resp = await googleCseSearch(
        apiKey,
        cseId,
        `${query} company official site`,
        Math.min(10, target - i * 10)
      );
      rawItems.push(...(resp.items ?? []));
    }

    // Dedupe by normalized link
    const seen = new Set<string>();
    const rows: CompanyRow[] = [];

    for (const item of rawItems) {
      const link = normalizeUrl(item.link || "");
      if (!link || seen.has(link)) continue;
      seen.add(link);

      const title = item.title || "";
      const website = link;
      const description = item.snippet || "";
      const companyName = guessCompanyName(title, item.displayLink);

      rows.push({
        id: stableIdFrom(website),
        companyName,
        website,
        description,
        source: "Google",
        resultType: "company",
        // MVP defaults (you can compute via Gemini later)
        matchStatus: "Neutral",
        significance: 50,
        relevance: 50,
      });

      if (rows.length >= limit) break;
    }

    return NextResponse.json({
      ok: true,
      rows, // AG-Grid-ready: flat objects
      meta: { source: "Google", requested: limit, returned: rows.length },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
