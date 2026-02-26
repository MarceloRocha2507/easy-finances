
CREATE TABLE public.radar_ignorados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  descricao_pattern TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.radar_ignorados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ignored patterns" ON public.radar_ignorados
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ignored patterns" ON public.radar_ignorados
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ignored patterns" ON public.radar_ignorados
  FOR DELETE USING (auth.uid() = user_id);
