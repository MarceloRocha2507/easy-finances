declare const __BUILD_DATE__: string;

export const APP_VERSION = "1.0.0";
export const APP_BUILD_DATE = __BUILD_DATE__;

// Número de build = minutos desde o lançamento
const LAUNCH_DATE = new Date("2026-02-24T00:00:00Z");
const buildDate = new Date(APP_BUILD_DATE);
export const APP_BUILD_NUMBER = Math.floor(
  (buildDate.getTime() - LAUNCH_DATE.getTime()) / 60000
);

export const APP_VERSION_DISPLAY = `Build #${APP_BUILD_NUMBER}`;

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
