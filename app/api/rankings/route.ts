import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RankingItem = {
  id?: string;
  rank?: number;
  offer_name?: string;
  trend_keyword?: string;
  category?: string;
  reward?: number | null;
  final_score?: number;
  reason?: string;
  is_registered?: boolean;
  confidence_score?: number;
  updated_at?: string;
};

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("rankings")
      .select("*")
      .order("rank", { ascending: true });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    const rankings: RankingItem[] = (data || []).map((item: any) => ({
      id: item.id,
      rank: item.rank,
      offer_name: item.offer_name,
      trend_keyword: item.trend_keyword,
      category: item.category,
      reward: item.reward ?? null,
      final_score: item.final_score,
      reason: item.reason,
      is_registered: item.is_registered,
      confidence_score: item.confidence_score,
      updated_at: item.updated_at,
    }));

    const grouped = rankings.reduce<Record<string, RankingItem[]>>(
      (acc, item) => {
        const category = item.category || "一般";

        if (!acc[category]) {
          acc[category] = [];
        }

        acc[category].push(item);

        return acc;
      },
      {}
    );

    return NextResponse.json({
      ok: true,
      count: rankings.length,
      data: rankings,
      grouped,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "unknown error",
      },
      { status: 500 }
    );
  }
}
