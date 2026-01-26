-- Reativar triggers de auditoria
ALTER TABLE parcelas_cartao ENABLE TRIGGER trg_audit_parcelas_cartao;
ALTER TABLE compras_cartao ENABLE TRIGGER trg_audit_compras_cartao;