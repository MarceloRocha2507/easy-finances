
-- Add dispositivos_extras column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dispositivos_extras integer NOT NULL DEFAULT 0;

-- Create device_sessions table
CREATE TABLE public.device_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_name text NOT NULL,
  device_type text NOT NULL,
  ip_address text,
  last_active_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  session_token text NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own device sessions"
ON public.device_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own device sessions"
ON public.device_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own device sessions"
ON public.device_sessions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own device sessions"
ON public.device_sessions FOR DELETE
USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_device_sessions_user_active ON public.device_sessions (user_id, is_active);
CREATE INDEX idx_device_sessions_session_token ON public.device_sessions (session_token);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.device_sessions;
