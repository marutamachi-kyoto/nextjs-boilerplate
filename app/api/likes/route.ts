import { createClient } from "@supabase/supabase-js";

const LIKE_SITE_NAME = "LIKE";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const normalizeOfferName = (value: unknown) => {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
};

const getJstDateParts = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [year, month, day] = formatter.format(new Date()).split("-");

  return { year: Number(year), month: Number(month), day: Number(day) };
};

const getTodayWindow = () => {
  const { year, month, day } = getJstDateParts();
  const likeDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const since = new Date(Date.UTC(year, month - 1, day, -9, 0, 0, 0)).toISOString();
  const until = new Date(Date.UTC(year, month - 1, day + 1, -9, 0, 0, 0)).toISOString();

  return { likeDate, since, until };
};

async function getOfferCount(offerName: string, since: string, until: string) {
  const { data, error } = await getSupabase()
    .from("category_clicks")
    .select("site_name")
    .eq("category", offerName)
    .eq("site_name", LIKE_SITE_NAME)
    .gte("created_at", since)
    .lt("created_at", until)
    .limit(10000);

  if (error) throw error;
  return data?.length || 0;
}

export async function GET() {
  try {
    const { likeDate, since, until } = getTodayWindow();
    const { data, error } = await getSupabase()
      .from("category_clicks")
      .select("category")
      .eq("site_name", LIKE_SITE_NAME)
      .gte("created_at", since)
      .lt("created_at", until)
      .limit(10000);

    if (error) return Response.json({ error: error.message }, { status: 500 });

    const counts = (data || []).reduce<Record<string, number>>((acc, row) => {
      const offerName = normalizeOfferName(row.category);
      if (!offerName) return acc;
      acc[offerName] = (acc[offerName] || 0) + 1;
      return acc;
    }, {});

    return Response.json({ counts, likeDate });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { likeDate, since, until } = getTodayWindow();
    const body = await req.json();
    const offerName = normalizeOfferName(body.offer_name);

    if (!offerName) {
      return Response.json({ error: "offer_name is required" }, { status: 400 });
    }

    const { error } = await getSupabase().from("category_clicks").insert([
      {
        category: offerName,
        site_name: LIKE_SITE_NAME,
      },
    ]);

    if (error) return Response.json({ error: error.message }, { status: 500 });

    const count = await getOfferCount(offerName, since, until);
    return Response.json({ status: "ok", count, likeDate });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
