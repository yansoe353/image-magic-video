
-- First, check if bucket already exists to avoid errors on rerun
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'payments') THEN
    -- Create the payments bucket for storing payment screenshots if it doesn't exist
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('payments', 'payments', true);

    -- Set up RLS policies for the payments bucket
    CREATE POLICY "Anyone can view payment screenshots"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'payments');

    -- Allow authenticated users to upload to the payments bucket
    CREATE POLICY "Authenticated users can upload payment screenshots"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'payments' 
        AND auth.role() = 'authenticated'
      );
  END IF;
END $$;
