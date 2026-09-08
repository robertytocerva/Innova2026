import { createClient } from "@supabase/supabase-js";
import { config, hasSupabase } from "./index.js";

export const supabase = hasSupabase
  ? createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;
