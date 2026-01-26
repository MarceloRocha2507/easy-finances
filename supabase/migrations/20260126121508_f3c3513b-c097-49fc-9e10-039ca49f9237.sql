-- Desabilitar triggers de auditoria temporariamente
ALTER TABLE parcelas_cartao DISABLE TRIGGER trg_audit_parcelas_cartao;
ALTER TABLE compras_cartao DISABLE TRIGGER trg_audit_compras_cartao;