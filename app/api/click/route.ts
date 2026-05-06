import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { category, site_name } = body;

    const { error } = await supabase
      .from("category_clicks")
      .insert([
        {
          category,
          site_name,
        },
      ]);

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return Response.json({
      status: "ok",
    });

  } catch (error: any) {
    return Response.json(
      {
        error: error.message,
      },
      { status: 500 }
    );
  }
}
