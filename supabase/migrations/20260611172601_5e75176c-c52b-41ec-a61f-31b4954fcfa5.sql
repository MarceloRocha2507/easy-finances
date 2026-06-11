ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ajuste_estimado NUMERIC DEFAULT 0;

-- Grant permissions (if needed, although profiles usually already have them)
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;