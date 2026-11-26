export const ESTADOS = [
  ["AC","Acre"],["AL","Alagoas"],["AP","Amapá"],["AM","Amazonas"],["BA","Bahia"],["CE","Ceará"],["DF","Distrito Federal"],["ES","Espírito Santo"],["GO","Goiás"],["MA","Maranhão"],["MT","Mato Grosso"],["MS","Mato Grosso do Sul"],["MG","Minas Gerais"],["PA","Pará"],["PB","Paraíba"],["PR","Paraná"],["PE","Pernambuco"],["PI","Piauí"],["RJ","Rio de Janeiro"],["RN","Rio Grande do Norte"],["RS","Rio Grande do Sul"],["RO","Rondônia"],["RR","Roraima"],["SC","Santa Catarina"],["SP","São Paulo"],["SE","Sergipe"],["TO","Tocantins"],
] as const;
export const flag = (uf: string) => `https://raw.githubusercontent.com/bgeneto/bandeiras-br/master/imagens/${uf}.png`;
export const SONHOS = ["Duelo Nacional de MCs", "Aniversário da Aldeia", "Seguir na carreira musical"];

export type Battle = { id: string; nome: string; nivel: number; local: string };
export type Ano = { idade: number; ovr: number; batalha: string; uf: string; batalhas: number; vitorias: number; folinhas: number; tacas: number };
export type Player = { nome: string; uf: string; sonho: string; idade: number; ovr: number; historico: Ano[]; log: string[] };
export type Evento = { titulo: string; texto: string; opcoes: { label: string; chance: number; bom: [number, string]; ruim: [number, string] }[] };

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
  const folinhas = fase;
  const vitorias = campeao ? Math.max(0, fase - 1) : fase;
  const tacas = campeao ? 1 : 0;
  const ganho = campeao ? (b.nivel > p.ovr ? 2 : 1) : folinhas > 0 && b.nivel > p.ovr ? 1 : 0;
  return { vitorias, batalhas: Math.min(fases, fase + 1), campeao, folinhas, tacas, ganho, fases };
}

export const EVENTOS: Evento[] = [
  {
    titulo: "O jurado fez uma proposta",
    texto: "Na véspera de uma decisão, um jurado disse que pode segurar o placar por você. Todo mundo vai desconfiar se o resultado for estranho.",
    opcoes: [
      { label: "Subornar o jurado", chance: 0.45, bom: [4, "O placar veio a seu favor e a cena engoliu a decisão."], ruim: [-5, "O esquema vazou e os MCs passaram a questionar suas folinhas."] },
      { label: "Gravar a proposta e expor", chance: 0.55, bom: [3, "A gravação rodou o circuito e você saiu como o MC que não se vende."], ruim: [-2, "O jurado negou tudo e a organização fechou as portas para você."] },
    ],
  },
  {
    titulo: "Um veterano te provocou",
    texto: "Um MC famoso assistiu à sua batalha e postou que você só repete punch dos outros. A cena está esperando sua reação.",
    opcoes: [
      { label: "Responder com um diss", chance: 0.5, bom: [4, "Sua resposta virou o assunto da cena e calou o veterano."], ruim: [-4, "Ele respondeu melhor e sua rima virou meme."] },
      { label: "Desafiar para um duelo ao vivo", chance: 0.35, bom: [6, "Você encarou o favorito e ganhou o respeito até da torcida dele."], ruim: [-3, "Você travou no palco e o veterano dominou o duelo."] },
    ],
  },
  {
    titulo: "Uma vaga estava à venda",
    texto: "A seletiva lotou, mas um organizador ofereceu sua vaga por fora. Isso tira o lugar de outro MC e pode manchar sua passagem pela batalha.",
    opcoes: [
      { label: "Comprar a vaga", chance: 0.6, bom: [3, "Você entrou na chave e aproveitou a chance para rimar bem."], ruim: [-3, "A organização descobriu e cortou seu nome da seletiva."] },
      { label: "Denunciar o organizador", chance: 0.45, bom: [4, "A denúncia abriu uma nova seletiva justa e você entrou pelo próprio nome."], ruim: [-2, "Nada foi provado e você ficou marcado com a organização."] },
    ],
  },
  {
    titulo: "O sorteio da chave pode ser roubado",
    texto: "Você descobriu como cair no lado mais fraco da chave, longe do favorito. Se perceberem a manipulação, sua campanha perde a moral.",
    opcoes: [
      { label: "Manipular o sorteio", chance: 0.55, bom: [3, "A chave abriu caminho e você avançou sem enfrentar o favorito."], ruim: [-4, "O sorteio foi refeito ao vivo e sua manipulação ficou evidente."] },
      { label: "Pedir o favorito logo na estreia", chance: 0.4, bom: [5, "Você derrubou o favorito e ninguém mais duvidou do seu nível."], ruim: [-2, "O favorito foi superior, mas você saiu sem dever nada a ninguém."] },
    ],
  },
  {
    titulo: "A rima que não era sua",
    texto: "Um amigo escreveu uma punch perfeita para você usar na próxima roda. Ela pode salvar sua noite, mas alguém ali conhece o autor.",
    opcoes: [
      { label: "Usar a punch como se fosse sua", chance: 0.5, bom: [4, "A plateia explodiu e ninguém ligou a rima ao verdadeiro autor."], ruim: [-5, "O autor apareceu no meio da roda e te chamou de plagiador ao vivo."] },
      { label: "Dividir o crédito e chamar o autor", chance: 0.7, bom: [2, "A parceria rendeu uma rima forte e uma nova amizade no circuito."], ruim: [-1, "A entrega saiu travada e a punch não teve o impacto esperado."] },
    ],
  },
  {
    titulo: "Show pago ou noite na batalha",
    texto: "Um show pequeno marcou data no mesmo dia de uma grande roda. O palco paga sua passagem, mas a batalha pode mudar sua carreira.",
    opcoes: [
      { label: "Faltar à batalha e fazer o show", chance: 0.65, bom: [3, "O show abriu portas na música e trouxe gente nova para suas rimas."], ruim: [-3, "O show ficou vazio e a batalha perdeu o respeito pela sua ausência."] },
      { label: "Cancelar o show e ir para a roda", chance: 0.5, bom: [4, "Sua apresentação foi a melhor da noite e rendeu novos convites."], ruim: [-2, "Você caiu cedo e ainda ficou mal com quem organizou o show."] },
    ],
  },
];
export const sortearEvento = () => pick(EVENTOS);
export const rand = r;
