
CREATE TABLE public.monitorhub_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT true,
  hub_url text NOT NULL DEFAULT 'https://sqaccuorasgvxmxpjbgg.supabase.co/functions/v1',
  owner_user_id uuid,
  send_saldo boolean NOT NULL DEFAULT true,
  send_total_a_pagar boolean NOT NULL DEFAULT true,
  send_events boolean NOT NULL DEFAULT true,
  last_sync_at timestamptz,
  last_sync_status text,
  last_sync_error text,
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.monitorhub_config TO authenticated;
GRANT ALL ON public.monitorhub_config TO service_role;

ALTER TABLE public.monitorhub_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read config" ON public.monitorhub_config
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert config" ON public.monitorhub_config
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update config" ON public.monitorhub_config
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete config" ON public.monitorhub_config
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_monitorhub_config_updated_at
  BEFORE UPDATE ON public.monitorhub_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.monitorhub_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('metric','event','sync')),
  detail text,
  status text NOT NULL CHECK (status IN ('ok','error')),
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.monitorhub_log TO authenticated;
GRANT ALL ON public.monitorhub_log TO service_role;

ALTER TABLE public.monitorhub_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read log" ON public.monitorhub_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_monitorhub_log_created_at ON public.monitorhub_log (created_at DESC);

INSERT INTO public.monitorhub_config (enabled) VALUES (true);
