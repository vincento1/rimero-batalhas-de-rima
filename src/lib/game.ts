export const ESTADOS = [
  ["AC","Acre"],["AL","Alagoas"],["AP","Amapá"],["AM","Amazonas"],["BA","Bahia"],["CE","Ceará"],["DF","Distrito Federal"],["ES","Espírito Santo"],["GO","Goiás"],["MA","Maranhão"],["MT","Mato Grosso"],["MS","Mato Grosso do Sul"],["MG","Minas Gerais"],["PA","Pará"],["PB","Paraíba"],["PR","Paraná"],["PE","Pernambuco"],["PI","Piauí"],["RJ","Rio de Janeiro"],["RN","Rio Grande do Norte"],["RS","Rio Grande do Sul"],["RO","Rondônia"],["RR","Roraima"],["SC","Santa Catarina"],["SP","São Paulo"],["SE","Sergipe"],["TO","Tocantins"],
] as const;
export const flag = (uf: string) => `https://raw.githubusercontent.com/bgeneto/bandeiras-br/master/imagens/${uf}.png`;
export const SONHOS = ["Duelo Nacional de MCs", "Aniversário da Aldeia", "Seguir na carreira musical"];

export type Battle = { id: string; nome: string; nivel: number; local: string };
export type Ano = { idade: number; ovr: number; batalhas: number; vitorias: number; folinhas: number; titulos: number };
export type Player = { nome: string; uf: string; sonho: string; idade: number; ovr: number; hype: number; historico: Ano[]; log: string[]; mes: number };
export type Evento = { titulo: string; texto: string; opcoes: { label: string; chance: number; bom: [number, number, string]; ruim: [number, number, string] }[] };

const r = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = <T,>(a: readonly T[]) => a[r(0, a.length - 1)]!;

const TIPOS = ["Batalha da Praça", "Batalha do Terminal", "Roda do Viaduto", "Batalha da Quebrada", "Batalha do Skate", "Batalha da Escola", "Batalha do Centro", "Roda da Estação"];
export function convites(p: Player): Battle[] {
  const est = ESTADOS.find((e) => e[0] === p.uf)?.[1] ?? "";
  return Array.from({ length: 3 }, (_, i) => {
    const nivel = Math.max(35, Math.min(95, p.ovr + r(-8, 10) + i * 2));
    return { id: Math.random().toString(36).slice(2), nome: pick(TIPOS), nivel, local: est };
  });
}

/** Chance de vencer: 50% em overall igual, ±3% por ponto de diferença, limitada a 5–95%. */
export function chanceVitoria(ovr: number, nivel: number) {
  return Math.max(0.05, Math.min(0.95, 0.5 + (ovr - nivel) * 0.03));
}

export function batalhar(p: Player, b: Battle) {
  const fases = r(3, 5);
  let fase = 0;
  for (; fase < fases; fase++) if (Math.random() > chanceVitoria(p.ovr, b.nivel - fase)) break;
  const campeao = fase === fases;
  const vitorias = fase;
  const folinhas = campeao && Math.random() < 0.35 ? 1 : 0;
  const ganho = campeao ? (b.nivel > p.ovr ? 2 : 1) : vitorias > 0 && b.nivel > p.ovr ? 1 : 0;
  return { vitorias, batalhas: Math.min(fases, fase + 1), campeao, folinhas, ganho, fases };
}

export const EVENTOS: Evento[] = [
  { titulo: "Cypher na madrugada", texto: "Uns MCs te chamaram pra rimar até o sol nascer numa praça.", opcoes: [{ label: "Colar", chance: 0.6, bom: [2, 5, "Você treinou muito e saiu afiado."], ruim: [-1, -3, "Perdeu o sono e foi mal na semana."] }] },
  { titulo: "Treta na internet", texto: "Um MC te provocou num vídeo que tá viralizando.", opcoes: [{ label: "Responder com um som", chance: 0.5, bom: [1, 10, "Seu som estourou, todo mundo comentou!"], ruim: [-2, -5, "Ficou pior, virou meme."] }] },
  { titulo: "Convite pra gravar", texto: "Um produtor do bairro quer gravar um single contigo.", opcoes: [{ label: "Gravar", chance: 0.55, bom: [1, 8, "O single rodou nas rodas."], ruim: [0, -4, "Ninguém ouviu e o beat era ruim."] }] },
  { titulo: "Batalha de bairro rival", texto: "Te desafiaram pra uma batalha fora de casa sem aviso.", opcoes: [{ label: "Aceitar o desafio", chance: 0.45, bom: [3, 6, "Você calou a torcida rival."], ruim: [-2, -6, "Te amassaram no campo deles."] }] },
  { titulo: "Livro de poesia", texto: "Um amigo te emprestou um livro de poesia marginal.", opcoes: [{ label: "Ler tudo", chance: 0.75, bom: [2, 0, "Vocabulário novo pras rimas."], ruim: [-1, 0, "Travou na leitura e perdeu o ritmo."] }] },
];
export const sortearEvento = () => pick(EVENTOS);
export const rand = r;
