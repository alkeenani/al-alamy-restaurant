import { supabase } from "./supabase";

export async function testSupabaseConnection() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug");

  return { data, error };
}
