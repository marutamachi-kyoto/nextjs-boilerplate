import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_URL = "https://poikatu-ai.vercel.app";
const MOPPY_OFFER_IMAGES_URL = `${BASE_URL}/api/moppy-offer-images`;

type RankingItem = {
  category?: string | null;
  rank?: number | null;
  offer_name?: string | null;
  reward?: number | null;
  image_url?: string | null;
  primary_site_url?: string | null;
  updated_at?: string | null;
};

type MoppyOfferImage = {
  title?: string | null;
  imageUrl?: string | null;
  url?: string | null;
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function normalizeText(text?: string | null) {
  return (text || "")
    .toLowerCase()
    .replace(/\u3000/g, "")
    .replace(/\s+/g, "")
    .replace(/[【】\[\]（）()・･ーｰ]/g, "")
    .trim();
}

function getMoppySiteId(url?: string | null) {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("site_id") || parsed.searchParams.get("s_id") || "";
  } catch {
    return "";
  }
}

async function attachOfferImages(rankings: RankingItem[]) {
  try {
    const response = await fetch(`${MOPPY_OFFER_IMAGES_URL}?match=${Date.now()}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return rankings.map((item, index) =>
        index === 0 || Number(item.rank) === 1 ? { ...item, image_url: null } : item
      );
    }

    const json = await response.json();
    const offers = (Array.isArray(json.data) ? json.data : []).filter(
      (offer: MoppyOfferImage) => offer.title && offer.imageUrl
    ) as MoppyOfferImage[];

    const offersByTitle = new Map(
      offers.map((offer) => [normalizeText(offer.title), offer])
    );
    const offersBySiteId = new Map(
      offers
        .map((offer) => [getMoppySiteId(offer.url), offer] as const)
        .filter(([siteId]) => Boolean(siteId))
    );

    return rankings.map((item, index) => {
      if (index === 0 || Number(item.rank) === 1) {
        return { ...item, image_url: null };
      }

      const itemSiteId = getMoppySiteId(item.primary_site_url);
      const matchedOffer =
        (itemSiteId && offersBySiteId.get(itemSiteId)) ||
        offersByTitle.get(normalizeText(item.offer_name));

      return matchedOffer?.imageUrl
        ? { ...item, image_url: matchedOffer.imageUrl }
        : item;
    });
  } catch (error) {
    console.error(error);
    return rankings.map((item, index) =>
      index === 0 || Number(item.rank) === 1 ? { ...item, image_url: null } : item
    );
  }
}

export async function GET() {
  try {
    const { data, error } = await getSupabase()
      .from("rankings")
      .select("category, rank, offer_name, reward, primary_site_url, updated_at")
      .order("rank", { ascending: true })
      .limit(50);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const rankings = Array.isArray(data) ? await attachOfferImages(data as RankingItem[]) : [];

    return NextResponse.json({
      ok: true,
      count: rankings.length,
      data: rankings,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "unknown error" },
      { status: 500 }
    );
  }
}
