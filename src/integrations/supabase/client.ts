
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://rhbpeivthnmvzhblnvya.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoYnBlaXZ0aG5tdnpoYmxudnlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMTQ4MDAsImV4cCI6MjA1Nzg5MDgwMH0.XzviG_Ir2UKIpMR2Vsh8RE3rppQvz7awjNZvfF7eVMI";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Check that URL and key are defined before creating client
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error("Supabase URL or publishable key is missing");
}

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
