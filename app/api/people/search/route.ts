// app/api/people/search/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

const ReqSchema = z.object({
  query: z.string().min(2),
  limit: z.number().int().min(1).max(50).default(25),
  companyHint: z.string().optional(),
});

type PeopleRow = {
  id: string;
  personName: string;
  role: string;
  company: string;
  profileUrl: string;
  source: string; // Google
  resultType: "person";
  matchStatus: "Match" | "No Match" | "Neutral";
  significance: number;
  relevance: number;
  tags?: string;
};

async function googleCseSearch(apiKey: string, cseId: string, q: string, num: number) {

  const url =
    "https://www.googleapis.com/customsearch/v1" +
    `?key=${encodeURIComponent(apiKey)}` +
    `&cx=${encodeURIComponent(cseId)}` +
    `&q=${encodeURIComponent(q)}` +
    `&num=${encodeURIComponent(String(Math.min(num, 10)))}`;

  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google CSE error: ${res.status} ${text}`);
  }
  return res.json() as Promise<{ items?: Array<{ title?: string; link?: string; snippet?: string; displayLink?: string }> }>;
}

function normalizeUrl(url: string) {
  try {
    const u = new URL(url);
    u.hash = "";
    return u.toString();
  } catch {
    return url;
  }
}

function stableIdFrom(url: string) {
  return Buffer.from(url).toString("base64url").slice(0, 24);
}

function parsePersonTitle(title: string) {
  // Typical LinkedIn format: "Name - Role - Company | LinkedIn"
  const cleaned = title.replace("| LinkedIn", "").trim();
  const parts = cleaned.split(" - ").map((p) => p.trim());
  const personName = parts[0] || "Unknown";
  const role = parts[1] || "";
  const company = parts[2] || "";
  return { personName, role, company };
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

    const { query, limit, companyHint } = parsed.data;

    // Google query tuned for people profiles
    const q = [
      query,
      companyHint ? `"${companyHint}"` : "",
      "(site:linkedin.com/in OR site:linkedin.com/pub OR site:crunchbase.com/person OR site:about.me)",
    ]
      .filter(Boolean)
      .join(" ");

    const target = Math.min(limit, 30);
    const pages = Math.ceil(target / 10);
    const rawItems: any[] = [];

    for (let i = 0; i < pages; i++) {
      const resp = await googleCseSearch(apiKey, cseId, q, Math.min(10, target - i * 10));
      rawItems.push(...(resp.items ?? []));
    }

    const seen = new Set<string>();
    const rows: PeopleRow[] = [];

    for (const item of rawItems) {
      const link = normalizeUrl(item.link || "");
      if (!link || seen.has(link)) continue;
      seen.add(link);

      const title = item.title || "";
      const { personName, role, company } = parsePersonTitle(title);

      rows.push({
        id: stableIdFrom(link),
        personName,
        role,
        company,
        profileUrl: link,
        source: "Google",
        resultType: "person",
        matchStatus: "Neutral",
        significance: 50,
        relevance: 50,
      });

      if (rows.length >= limit) break;
    }

    return NextResponse.json({
      ok: true,
      rows,
      meta: { source: "Google", requested: limit, returned: rows.length },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
