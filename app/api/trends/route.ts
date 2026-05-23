import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const getTrendWord = (item: {
  offer_name?: string | null;
  trend_keyword?: string | null;
  category?: string | null;
}) => {
  return item.offer_name || item.trend_keyword || item.category || "";
};

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("rankings")
      .select("offer_name, trend_keyword, category, rank")
      .order("updated_at", { ascending: false })
      .order("rank", { ascending: true })
      .limit(50);

    if (error) {
      throw error;
    }

    const words = (data || [])
      .map((item, index) => ({
        word: getTrendWord(item),
        score: Math.max(100 - index * 2, 10),
        category: item.category,
      }))
      .filter((item) => item.word);

    return NextResponse.json({
      data: words,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e.message,
      },
      { status: 500 }
    );
  }
}
