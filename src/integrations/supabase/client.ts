
import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types/supabase';

// Hardcode the Supabase URL and anon key since environment variables aren't working properly
const supabaseUrl = "https://rhbpeivthnmvzhblnvya.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoYnBlaXZ0aG5tdnpoYmxudnlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMTQ4MDAsImV4cCI6MjA1Nzg5MDgwMH0.XzviG_Ir2UKIpMR2Vsh8RE3rppQvz7awjNZvfF7eVMI";

// Create and export the Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
