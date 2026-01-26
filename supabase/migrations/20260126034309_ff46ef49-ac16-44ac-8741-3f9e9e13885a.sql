-- Criar tabela bancos
CREATE TABLE public.bancos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  codigo TEXT,
  cor TEXT NOT NULL DEFAULT '#6366f1',
  logo_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_bancos_user_id ON public.bancos(user_id);

-- RLS
ALTER TABLE public.bancos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own banks"
  ON public.bancos FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own banks"
  ON public.bancos FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own banks"
  ON public.bancos FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own banks"
  ON public.bancos FOR DELETE USING (auth.uid() = user_id);

-- Adicionar coluna banco_id em cartoes
ALTER TABLE public.cartoes ADD COLUMN banco_id UUID REFERENCES public.bancos(id) ON DELETE SET NULL;

-- Índice para performance
CREATE INDEX idx_cartoes_banco_id ON public.cartoes(banco_id);

-- Trigger para updated_at
CREATE TRIGGER set_bancos_updated_at
  BEFORE UPDATE ON public.bancos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Criar bucket para logos de bancos
INSERT INTO storage.buckets (id, name, public) VALUES ('bank-logos', 'bank-logos', true);

-- Políticas de storage para logos
CREATE POLICY "Bank logos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'bank-logos');

CREATE POLICY "Users can upload bank logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'bank-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their bank logos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'bank-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their bank logos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'bank-logos' AND auth.uid()::text = (storage.foldername(name))[1]);