import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const LIKE_SITE_NAME = "LIKE";

const normalizeOfferName = (value: unknown) => {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
};

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("category_clicks")
      .select("category")
      .eq("site_name", LIKE_SITE_NAME)
      .limit(10000);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const counts = (data || []).reduce<Record<string, number>>((acc, row) => {
      const offerName = normalizeOfferName(row.category);
      if (!offerName) return acc;
      acc[offerName] = (acc[offerName] || 0) + 1;
      return acc;
    }, {});

    return Response.json({ counts });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const offerName = normalizeOfferName(body.offer_name);

    if (!offerName) {
      return Response.json({ error: "offer_name is required" }, { status: 400 });
    }

    const { error } = await supabase.from("category_clicks").insert([
      {
        category: offerName,
        site_name: LIKE_SITE_NAME,
      },
    ]);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const { count, error: countError } = await supabase
      .from("category_clicks")
      .select("*", { count: "exact", head: true })
      .eq("site_name", LIKE_SITE_NAME)
      .eq("category", offerName);

    if (countError) {
      return Response.json({ error: countError.message }, { status: 500 });
    }

    return Response.json({ status: "ok", count: count || 0 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
