
-- Create the payments table for offline payment processing
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reference_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_type TEXT NOT NULL,
  package_name TEXT NOT NULL,
  amount TEXT NOT NULL,
  image_credits INTEGER NOT NULL,
  video_credits INTEGER NOT NULL,
  screenshot_url TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
);

-- Add indexes for faster querying
CREATE INDEX IF NOT EXISTS payment_requests_user_id_idx ON public.payment_requests (user_id);
CREATE INDEX IF NOT EXISTS payment_requests_status_idx ON public.payment_requests (status);

-- Add RLS policies
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Policy for users to see their own payments
CREATE POLICY "Users can view their own payment requests"
  ON public.payment_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for users to insert their own payment requests
CREATE POLICY "Users can insert their own payment requests"
  ON public.payment_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for admins to view all payments
CREATE POLICY "Admins can view all payment requests"
  ON public.payment_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id AND raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- Policy for admins to update payment status
CREATE POLICY "Admins can update payment request status"
  ON public.payment_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id AND raw_user_meta_data->>'is_admin' = 'true'
    )
  );
