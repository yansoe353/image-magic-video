
-- Ensure public content is viewable by everyone, including anonymous users
ALTER POLICY "Public content is viewable by everyone" 
  ON public.user_content_history 
  FOR SELECT 
  USING (is_public = true);

-- Create policy to allow anyone (including anonymous users) to access public files
CREATE POLICY "Public files are viewable by everyone including anonymous" 
  ON storage.objects 
  FOR SELECT 
  TO anon
  USING (bucket_id = 'user_content' AND path LIKE 'public/%');
