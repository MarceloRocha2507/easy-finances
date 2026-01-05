import { z } from "zod";

/**
 * Validation schemas for financial operations
 */

// Maximum values for financial operations
const MAX_AMOUNT = 999999.99;
const MAX_DESCRIPTION_LENGTH = 200;
const MAX_NAME_LENGTH = 100;
const MAX_PARCELAS = 120;

// Compra no cartão schema
export const CompraSchema = z.object({
  cartaoId: z.string().uuid("ID do cartão inválido"),
  descricao: z
    .string()
    .trim()
    .min(1, "Descrição é obrigatória")
    .max(MAX_DESCRIPTION_LENGTH, `Descrição deve ter no máximo ${MAX_DESCRIPTION_LENGTH} caracteres`),
  valorTotal: z
    .number()
    .positive("Valor deve ser maior que zero")
    .max(MAX_AMOUNT, `Valor máximo é R$ ${MAX_AMOUNT.toLocaleString("pt-BR")}`),
  tipoLancamento: z.enum(["unica", "parcelada", "fixa"], {
    errorMap: () => ({ message: "Tipo de lançamento inválido" }),
  }),
  mesInicio: z.date({
    errorMap: () => ({ message: "Data de início inválida" }),
  }),
  parcelas: z
    .number()
    .int("Número de parcelas deve ser inteiro")
    .min(1, "Mínimo 1 parcela")
    .max(MAX_PARCELAS, `Máximo ${MAX_PARCELAS} parcelas`)
    .optional(),
  parcelaInicial: z
    .number()
    .int("Parcela inicial deve ser um número inteiro")
    .min(1, "Parcela inicial mínima é 1")
    .optional(),
  categoriaId: z.string().uuid("ID da categoria inválido").optional().nullable(),
  mesesFuturos: z
    .number()
    .int()
    .min(1)
    .max(60, "Máximo 60 meses")
    .optional(),
}).refine(
  (data) => {
    if (data.tipoLancamento === "parcelada") {
      return data.parcelas !== undefined && data.parcelas >= 2;
    }
    return true;
  },
  {
    message: "Compra parcelada deve ter pelo menos 2 parcelas",
    path: ["parcelas"],
  }
).refine(
  (data) => {
    if (data.parcelaInicial && data.parcelas) {
      return data.parcelaInicial <= data.parcelas;
    }
    return true;
  },
  {
    message: "Parcela inicial não pode ser maior que o total de parcelas",
    path: ["parcelaInicial"],
  }
);

// Atualização de valor de compra schema
export const AtualizarValorCompraSchema = z.object({
  compraId: z.string().uuid("ID da compra inválido"),
  novoValorTotal: z
    .number()
    .positive("Valor deve ser maior que zero")
    .max(MAX_AMOUNT, `Valor máximo é R$ ${MAX_AMOUNT.toLocaleString("pt-BR")}`),
});

// Profile update schema
export const ProfileUpdateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .max(MAX_NAME_LENGTH, `Nome deve ter no máximo ${MAX_NAME_LENGTH} caracteres`)
    .optional(),
});

// Password change schema
export const PasswordChangeSchema = z.object({
  currentPassword: z
    .string()
    .min(1, "Senha atual é obrigatória"),
  newPassword: z
    .string()
    .min(6, "A senha deve ter pelo menos 6 caracteres")
    .max(72, "A senha deve ter no máximo 72 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

// Transaction schema
export const TransactionSchema = z.object({
  description: z
    .string()
    .trim()
    .max(MAX_DESCRIPTION_LENGTH, `Descrição deve ter no máximo ${MAX_DESCRIPTION_LENGTH} caracteres`)
    .optional()
    .nullable(),
  amount: z
    .number()
    .positive("Valor deve ser maior que zero")
    .max(MAX_AMOUNT, `Valor máximo é R$ ${MAX_AMOUNT.toLocaleString("pt-BR")}`),
  type: z.enum(["income", "expense"]),
  date: z.string().optional(),
  categoryId: z.string().uuid().optional().nullable(),
});

// Meta (goal) schema
export const MetaSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(1, "Título é obrigatório")
    .max(MAX_DESCRIPTION_LENGTH, `Título deve ter no máximo ${MAX_DESCRIPTION_LENGTH} caracteres`),
  valorAlvo: z
    .number()
    .positive("Valor alvo deve ser maior que zero")
    .max(MAX_AMOUNT, `Valor máximo é R$ ${MAX_AMOUNT.toLocaleString("pt-BR")}`),
  valorAtual: z
    .number()
    .min(0, "Valor atual não pode ser negativo")
    .max(MAX_AMOUNT)
    .optional(),
  dataLimite: z.date().optional().nullable(),
  cor: z.string().max(20).optional(),
  icone: z.string().max(50).optional(),
});

// Type exports
export type CompraInput = z.infer<typeof CompraSchema>;
export type AtualizarValorCompraInput = z.infer<typeof AtualizarValorCompraSchema>;
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;
export type PasswordChangeInput = z.infer<typeof PasswordChangeSchema>;
export type TransactionInput = z.infer<typeof TransactionSchema>;
export type MetaInput = z.infer<typeof MetaSchema>;
