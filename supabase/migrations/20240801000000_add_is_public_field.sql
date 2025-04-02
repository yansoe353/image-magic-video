
-- Add is_public column to user_content_history table
ALTER TABLE public.user_content_history 
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Create index for faster querying of public content
CREATE INDEX IF NOT EXISTS idx_user_content_history_is_public 
  ON public.user_content_history (is_public);

-- Update types.ts file to include the is_public field
COMMENT ON TABLE public.user_content_history IS 
  E'Table storing user generated content with public/private visibility flag';

-- Create policy to allow anyone to view public content
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Public content is viewable by everyone' 
    AND tablename = 'user_content_history'
  ) THEN
    CREATE POLICY "Public content is viewable by everyone" 
      ON public.user_content_history 
      FOR SELECT 
      USING (is_public = true);
  END IF;
END
$$;

-- Create storage bucket for user content if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user_content', 'User generated content', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow anyone to read files from the public folder
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Public files are viewable by everyone' 
    AND tablename = 'objects'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Public files are viewable by everyone" 
      ON storage.objects 
      FOR SELECT 
      USING (bucket_id = 'user_content' AND path LIKE 'public/%');
  END IF;
END
$$;
