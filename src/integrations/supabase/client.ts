import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// The setup screen prevents requests until a project has been configured.
export const supabase = createClient(
  SUPABASE_URL || "https://unconfigured.supabase.co",
  SUPABASE_PUBLISHABLE_KEY || "unconfigured"
);
