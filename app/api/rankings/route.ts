import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("rankings")
    .select("*")
    .order("final_score", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // カテゴリ別に分ける
  const grouped: any = {};

  for (const item of data || []) {
    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }
    grouped[item.category].push(item);
  }

  // 各カテゴリ20件まで
  Object.keys(grouped).forEach((cat) => {
    grouped[cat] = grouped[cat].slice(0, 20);
  });

  return Response.json(grouped);
}
