import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export interface SocExampleListItem {
  slug: string;
  scenario: string;
  title: string;
  subtitle: string;
  cia_category: string;
  tier_flow: string;
  expires_at: string;
}

export async function GET() {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from("soc_example_cache")
    .select("slug, scenario, example, expires_at")
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items: SocExampleListItem[] = (data ?? []).map((row) => {
    const ex = row.example as Record<string, unknown>;
    return {
      slug: row.slug,
      scenario: row.scenario,
      title: (ex?.title as string) ?? row.scenario,
      subtitle: (ex?.subtitle as string) ?? "",
      cia_category: (ex?.cia_category as string) ?? "",
      tier_flow: (ex?.tier_flow as string) ?? "",
      expires_at: row.expires_at,
    };
  });

  return NextResponse.json(items);
}
