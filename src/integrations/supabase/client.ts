
import { createClient } from '@supabase/supabase-js';

// Use environment variables for Supabase URL and key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rhbpeivthnmvzhblnvya.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoYnBlaXZ0aG5tdnpoYmxudnlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMTQ4MDAsImV4cCI6MjA1Nzg5MDgwMH0.XzviG_Ir2UKIpMR2Vsh8RE3rppQvz7awjNZvfF7eVMI';

// Fallback hardcoding for Supabase URL to ensure we don't get "supabaseUrl is required" error
if (!supabaseUrl) {
  console.warn('VITE_SUPABASE_URL is missing, using fallback URL');
}

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);
