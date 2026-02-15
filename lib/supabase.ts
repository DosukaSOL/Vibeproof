import { createClient } from '@supabase/supabase-js';

// Debug logs (temporary)
console.log("SUPABASE URL =", process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log(
  "SUPABASE KEY =",
  (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "").slice(0, 20)
);

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
