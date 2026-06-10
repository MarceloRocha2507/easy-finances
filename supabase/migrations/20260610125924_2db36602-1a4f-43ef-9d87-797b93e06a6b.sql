CREATE TABLE public.anotacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  conteudo TEXT,
  fixado BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.anotacoes TO authenticated;
GRANT ALL ON public.anotacoes TO service_role;

ALTER TABLE public.anotacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notes" 
  ON public.anotacoes 
  FOR ALL 
  USING (auth.uid() = usuario_id) 
  WITH CHECK (auth.uid() = usuario_id);

CREATE TRIGGER update_anotacoes_updated_at 
  BEFORE UPDATE ON public.anotacoes 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();