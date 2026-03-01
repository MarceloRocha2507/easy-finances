import type { Category } from '@/hooks/useCategories';

/**
 * Mapeamento built-in de palavras-chave por nome de categoria.
 * Usado para sugestão automática local (sem consulta ao banco).
 */
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Alimentação': [
    'ifood', 'restaurante', 'mercado', 'padaria', 'lanche', 'pizza', 'burger',
    'cafe', 'café', 'almoço', 'almoco', 'jantar', 'supermercado', 'hortifruti',
    'açougue', 'acougue', 'feira', 'comida', 'marmita', 'sushi', 'hamburguer',
    'delivery', 'rappi', 'zé delivery', 'ze delivery', 'pão', 'pao', 'doce',
    'sorvete', 'lanchonete', 'cantina', 'refeitório', 'refeição',
  ],
  'Transporte': [
    'uber', '99', 'gasolina', 'estacionamento', 'onibus', 'ônibus', 'metro',
    'metrô', 'pedagio', 'pedágio', 'combustivel', 'combustível', 'posto',
    'taxi', 'táxi', 'corrida', 'brt', 'trem', 'passagem', 'bilhete unico',
    'sem parar', 'conectcar', 'veloe', 'etanol', 'diesel', 'gnv',
  ],
  'Moradia': [
    'aluguel', 'condominio', 'condomínio', 'iptu', 'agua', 'água', 'luz',
    'energia', 'gas', 'gás', 'internet', 'telefone', 'celular', 'fibra',
    'conta de luz', 'conta de agua', 'conta de gás', 'seguro residencial',
    'manutenção', 'manutencao', 'reforma', 'pintura',
  ],
  'Saúde': [
    'farmacia', 'farmácia', 'medico', 'médico', 'consulta', 'exame',
    'hospital', 'clinica', 'clínica', 'dentista', 'plano de saude',
    'plano de saúde', 'remedio', 'remédio', 'drogaria', 'laboratorio',
    'laboratório', 'fisioterapia', 'psicólogo', 'psicologo', 'terapia',
    'vacina', 'cirurgia', 'ortopedia', 'oftalmologista', 'droga raia',
    'drogasil', 'pague menos', 'panvel',
  ],
  'Lazer': [
    'cinema', 'netflix', 'spotify', 'show', 'teatro', 'bar', 'festa',
    'jogo', 'viagem', 'hotel', 'parque', 'museu', 'ingresso', 'evento',
    'disney', 'prime video', 'hbo', 'youtube premium', 'deezer', 'globoplay',
    'passeio', 'praia', 'camping', 'pousada', 'airbnb', 'booking',
  ],
  'Compras': [
    'roupa', 'tenis', 'tênis', 'sapato', 'loja', 'amazon', 'mercado livre',
    'shopee', 'shein', 'magazine', 'eletronico', 'eletrônico', 'celular',
    'notebook', 'tablet', 'acessorio', 'acessório', 'presente', 'decoração',
    'decoracao', 'movel', 'móvel', 'eletrodomestico', 'eletrodoméstico',
    'aliexpress', 'casas bahia', 'americanas', 'kabum', 'ponto frio',
  ],
  'Educação': [
    'faculdade', 'curso', 'escola', 'livro', 'apostila', 'mensalidade',
    'matricula', 'matrícula', 'material escolar', 'udemy', 'alura',
    'coursera', 'workshop', 'palestra', 'treinamento', 'aula', 'professor',
    'idioma', 'inglês', 'ingles', 'espanhol', 'creche', 'universidade',
  ],
};

/**
 * Busca a categoria correspondente com base nas palavras-chave built-in.
 * Compara a descrição (case-insensitive) com as keywords e retorna o
 * category_id da primeira categoria cujo name dá match.
 */
export function findCategoryByKeywords(
  description: string,
  categories: Category[],
): string | null {
  if (!description || description.length < 2) return null;

  const descLower = description.toLowerCase();

  for (const [categoryName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (descLower.includes(keyword)) {
        // Encontrar a categoria pelo nome (match flexível sem acento)
        const cat = categories.find(
          (c) => normalizeName(c.name) === normalizeName(categoryName),
        );
        if (cat) return cat.id;
      }
    }
  }

  return null;
}

/** Remove acentos e converte para minúscula para comparação */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
