import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://ijimozjfdffejbczwyzb.supabase.co";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_SvuPtQUmXamt1a1_JpU6Jg_Bf3Fshqr";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
