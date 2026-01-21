
-- Criar tabela de auditoria para rastrear alterações em compras e parcelas
CREATE TABLE IF NOT EXISTS public.auditoria_cartao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tabela TEXT NOT NULL,
  registro_id UUID NOT NULL,
  acao TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  dados_anteriores JSONB,
  dados_novos JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.auditoria_cartao ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Users can view their own audit logs"
ON public.auditoria_cartao
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own audit logs"
ON public.auditoria_cartao
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_auditoria_cartao_user ON public.auditoria_cartao(user_id);
CREATE INDEX idx_auditoria_cartao_registro ON public.auditoria_cartao(registro_id);
CREATE INDEX idx_auditoria_cartao_created ON public.auditoria_cartao(created_at DESC);

-- Função de auditoria para compras_cartao
CREATE OR REPLACE FUNCTION public.audit_compras_cartao()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.auditoria_cartao (user_id, tabela, registro_id, acao, dados_anteriores)
    VALUES (OLD.user_id, 'compras_cartao', OLD.id, 'DELETE', to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.auditoria_cartao (user_id, tabela, registro_id, acao, dados_anteriores, dados_novos)
    VALUES (OLD.user_id, 'compras_cartao', OLD.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.auditoria_cartao (user_id, tabela, registro_id, acao, dados_novos)
    VALUES (NEW.user_id, 'compras_cartao', NEW.id, 'INSERT', to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função de auditoria para parcelas_cartao
CREATE OR REPLACE FUNCTION public.audit_parcelas_cartao()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Buscar user_id da compra pai
  IF TG_OP = 'DELETE' THEN
    SELECT user_id INTO v_user_id FROM compras_cartao WHERE id = OLD.compra_id;
    INSERT INTO public.auditoria_cartao (user_id, tabela, registro_id, acao, dados_anteriores)
    VALUES (v_user_id, 'parcelas_cartao', OLD.id, 'DELETE', to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    SELECT user_id INTO v_user_id FROM compras_cartao WHERE id = NEW.compra_id;
    -- Só auditar mudanças significativas (não pagamento normal)
    IF OLD.ativo != NEW.ativo OR OLD.valor != NEW.valor THEN
      INSERT INTO public.auditoria_cartao (user_id, tabela, registro_id, acao, dados_anteriores, dados_novos)
      VALUES (v_user_id, 'parcelas_cartao', OLD.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    SELECT user_id INTO v_user_id FROM compras_cartao WHERE id = NEW.compra_id;
    INSERT INTO public.auditoria_cartao (user_id, tabela, registro_id, acao, dados_novos)
    VALUES (v_user_id, 'parcelas_cartao', NEW.id, 'INSERT', to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers de auditoria
CREATE TRIGGER trg_audit_compras_cartao
AFTER INSERT OR UPDATE OR DELETE ON public.compras_cartao
FOR EACH ROW EXECUTE FUNCTION public.audit_compras_cartao();

CREATE TRIGGER trg_audit_parcelas_cartao
AFTER INSERT OR UPDATE OR DELETE ON public.parcelas_cartao
FOR EACH ROW EXECUTE FUNCTION public.audit_parcelas_cartao();
