export const APP_VERSION = "1.0.0";
export const APP_VERSION_DATE = "2026-02-24";

export type ChangeType = "feature" | "fix" | "improvement";

export interface ChangeEntry {
  type: ChangeType;
  description: string;
}

export interface VersionEntry {
  version: string;
  date: string;
  title: string;
  changes: ChangeEntry[];
}

export const CHANGELOG: VersionEntry[] = [
  {
    version: "1.0.0",
    date: "2026-02-24",
    title: "Lançamento oficial",
    changes: [
      { type: "feature", description: "Dashboard completo com visão geral financeira" },
      { type: "feature", description: "Gestão de transações com importação" },
      { type: "feature", description: "Controle de cartões de crédito e faturas" },
      { type: "feature", description: "Metas de economia e investimentos" },
      { type: "feature", description: "Relatórios e exportações" },
      { type: "feature", description: "Assistente financeiro com IA" },
      { type: "feature", description: "Notificações e alertas inteligentes" },
      { type: "feature", description: "Suporte a PWA para uso offline" },
    ],
  },
];
