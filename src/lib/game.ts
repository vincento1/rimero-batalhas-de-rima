import { BATALHAS_CONSOLIDADAS, type BatalhaConsolidada } from "./batalhas-dados";

export const ESTADOS = [
  ["AC","Acre"],["AL","Alagoas"],["AP","Amapá"],["AM","Amazonas"],["BA","Bahia"],["CE","Ceará"],["DF","Distrito Federal"],["ES","Espírito Santo"],["GO","Goiás"],["MA","Maranhão"],["MT","Mato Grosso"],["MS","Mato Grosso do Sul"],["MG","Minas Gerais"],["PA","Pará"],["PB","Paraíba"],["PR","Paraná"],["PE","Pernambuco"],["PI","Piauí"],["RJ","Rio de Janeiro"],["RN","Rio Grande do Norte"],["RS","Rio Grande do Sul"],["RO","Rondônia"],["RR","Roraima"],["SC","Santa Catarina"],["SP","São Paulo"],["SE","Sergipe"],["TO","Tocantins"],
] as const;
export const flag = (uf: string) => `https://raw.githubusercontent.com/bgeneto/bandeiras-br/master/imagens/${uf}.png`;
export const SONHOS = ["Duelo Nacional de MCs", "Aniversário da Aldeia", "Seguir na carreira musical"];

export type Battle = {
  id: string;
  nome: string;
  nivel: number;
  local: string;
  uf?: string | undefined;
  reputacao?: string | undefined;
  mudancaEstado?: boolean | undefined;
};

export type TorneioEtapaResultado = {
  jogou: boolean;
  campeao: boolean;
  faseAlcancada: string;
};

export type Ano = {
  idade: number;
  ovr: number;
  delta: number;
  batalha: string;
  nivelBatalha?: number | undefined;
  uf: string;
  batalhas: number;
  twolalas: number; // vitórias por 2x0 (mais raras)
  folinhas: number; // títulos daquela batalha na temporada (máximo = número de edições)
  tacas: number;    // apenas títulos grandes (Nacional, Aniversário, Estadual, etc.)
  seletiva?: TorneioEtapaResultado | undefined;
  regional?: TorneioEtapaResultado | undefined;
  estadual?: TorneioEtapaResultado | undefined;
  nacional?: TorneioEtapaResultado | undefined;
};

export type Player = {
  nome: string;
  uf: string;
  sonho: string;
  idade: number;
  ovr: number;
  potencial: number;
  picoIdade: number;
  sorte: number;
  seletivasGanhas: number;
  regionaisGanhas: number;
  estaduaisGanhos: number;
  nacionaisGanhos: number;
  anosSuspensao: number; // anos restantes de suspensão (1 ano = exatamente 1 temporada de fora)
  status?: string | null | undefined;
  batalhaAtualNome?: string | undefined;
  vacilosBatalhaAtual: number; // se chegar a 3, a batalha atual expulsa o MC
  batalhasBanidas: string[];
  aposentado?: boolean | undefined;
  historico: Ano[];
  log: string[];
};

export type Consequencia = {
  delta: number;
  texto: string;
  suspensaoAnos?: number;
  novoStatus?: string | null;
};

export type Evento = {
  titulo: string;
  texto: string;
  proposta: {
    acao: string;
    chance: number;
    ehCompraDeVaga?: boolean;
    bom: Consequencia;
    ruim: Consequencia;
  };
};

const r = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = <T,>(a: readonly T[]) => a[r(0, a.length - 1)]!;
export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export function criarPerfilCarreira() {
  return {
    ovr: r(48, 56),
    potencial: r(74, 95),
    picoIdade: r(23, 28),
    sorte: r(-2, 2),
  };
}

const BATALHAS_GENERICAS_NOMES = [
  "Batalha da Praça Central",
  "Roda Cultural da Estação",
  "Duelo do Skatepark",
  "Batalha da Quadra",
  "Roda da Quebrada",
  "Batalha da Pista",
  "Duelo do Bairro",
  "Roda dos Trilhos",
  "Batalha da Orla",
  "Duelo da Passarela",
];

/**
 * Bônus de nível aplicado às batalhas conforme OVR do MC.
 * Cresce devagar no início, mais rápido no alto nível.
 * Nunca deixa o nivel ultrapassar 94 (evita quebrar o jogo no nível 99).
 */
function bonusNivelPorOvr(ovr: number): number {
  if (ovr <= 60) return 0;
  if (ovr <= 70) return Math.floor((ovr - 60) * 0.4);   // até +4
  if (ovr <= 80) return 4 + Math.floor((ovr - 70) * 0.7); // até +11
  if (ovr <= 90) return 11 + Math.floor((ovr - 80) * 1.0); // até +21
  return 21 + Math.floor((ovr - 90) * 0.6);             // cresce menos em 91-99 (até +27 no 99 → cap em 94 segura)
}

export function convites(p: Player): Battle[] {
  const est = ESTADOS.find((e) => e[0] === p.uf)?.[1] ?? p.uf;
  const lista: Battle[] = [];
  const nomesNaLista = new Set<string>();
  const bonus = bonusNivelPorOvr(p.ovr);

  // 1. Se o MC tem uma batalha atual e não foi banido dela, ela fica como primeira opção
  if (p.batalhaAtualNome && !p.batalhasBanidas.includes(p.batalhaAtualNome)) {
    const historicoBatalha = p.historico.filter((h) => h.batalha === p.batalhaAtualNome);
    const ultimoAno = historicoBatalha.at(-1);
    const nivelBase = ultimoAno?.nivelBatalha ?? clamp(p.ovr - 2, 38, 92);
    const batalhaOriginal = BATALHAS_CONSOLIDADAS.find((b) => b.nome === p.batalhaAtualNome);
    const localAtual = batalhaOriginal ? `${batalhaOriginal.cidade}, ${batalhaOriginal.uf}` : est;
    const ufAtual = batalhaOriginal?.uf ?? p.uf;

    lista.push({
      id: "atual",
      nome: p.batalhaAtualNome,
      nivel: clamp(nivelBase + r(-1, 1), 36, 94),
      local: localAtual,
      uf: ufAtual,
      reputacao: batalhaOriginal?.reputacao,
    });
    nomesNaLista.add(p.batalhaAtualNome);
  }

  // 2. Batalhas oficiais mapeadas do estado do jogador (da planilha consolidada)
  const batalhasDoEstado = BATALHAS_CONSOLIDADAS.filter(
    (b) => b.uf === p.uf && !nomesNaLista.has(b.nome) && !p.batalhasBanidas.includes(b.nome)
  );

  // 3. Batalhas comunitárias/genéricas do estado (nível de entrada e base local)
  const genericasDoEstado: Battle[] = BATALHAS_GENERICAS_NOMES.filter(
    (n) => !nomesNaLista.has(n) && !p.batalhasBanidas.includes(n)
  ).map((nome, idx) => ({
    id: `gen-${p.uf}-${idx}`,
    nome,
    nivel: clamp(40 + r(-3, 6), 36, 52),
    local: `${est} (Local)`,
    uf: p.uf,
    reputacao: "Toda a cidade",
  }));

  // Pool local unindo as oficiais do estado e genéricas (filtrando por compatibilidade de OVR)
  // O bônus escala o nível das batalhas junto com o MC, sem deixar ultrapassar 94
  const oficiaisMapeadas: Battle[] = batalhasDoEstado.map((b) => ({
    id: `oficial-${b.nome}`,
    nome: b.nome,
    nivel: clamp(b.nivelBase + bonus + r(-2, 2), 38, 94),
    local: `${b.cidade}, ${b.uf}`,
    uf: b.uf,
    reputacao: b.reputacao,
  }));

  const incluirGenericas = p.ovr < 62 || oficiaisMapeadas.length < 3;
  const poolBruto = incluirGenericas ? [...oficiaisMapeadas, ...genericasDoEstado] : oficiaisMapeadas;
  const compativeis = poolBruto.filter((b) => Math.abs(b.nivel - p.ovr) <= 14);
  const poolBase = compativeis.length >= 2 ? compativeis : poolBruto;
  const poolLocal = [...poolBase].sort(
    (a, b) => (Math.abs(a.nivel - p.ovr) + r(-5, 5)) - (Math.abs(b.nivel - p.ovr) + r(-5, 5))
  );

  // Adiciona opções do estado compatíveis com a progressão do MC
  for (const b of poolLocal) {
    if (lista.length >= 3) break;
    if (!nomesNaLista.has(b.nome)) {
      lista.push(b);
      nomesNaLista.add(b.nome);
    }
  }

  // 4. Proposta rara de outro estado (mudança de estado para representar no Nacional)
  // ~20% de chance para qualquer MC, ou ~35% se já tiver OVR >= 58
  const chanceOutroEstado = p.ovr >= 58 ? 0.35 : 0.20;
  if (Math.random() < chanceOutroEstado) {
    const batalhasOutroEstado = BATALHAS_CONSOLIDADAS.filter(
      (b) => b.uf !== p.uf && !nomesNaLista.has(b.nome) && !p.batalhasBanidas.includes(b.nome)
    );

    if (batalhasOutroEstado.length > 0) {
      // Prioriza batalhas reconhecidas e compatíveis com o OVR do MC
      const relevantes = batalhasOutroEstado.filter(
        (b) => b.nivelBase >= p.ovr - 12 && (b.reputacao === "Nacional" || b.reputacao === "Estadual" || b.nivelBase >= p.ovr - 5)
      );
      const escolhida = pick(relevantes.length > 0 ? relevantes : batalhasOutroEstado);
      lista.push({
        id: `externa-${escolhida.nome}`,
        nome: escolhida.nome,
        nivel: clamp(escolhida.nivelBase + bonus + r(-1, 2), 40, 94),
        local: `${escolhida.cidade}, ${escolhida.uf}`,
        uf: escolhida.uf,
        reputacao: escolhida.reputacao,
        mudancaEstado: true,
      });
      nomesNaLista.add(escolhida.nome);
    }
  }

  // Fallback caso a lista fique com menos de 3
  while (lista.length < 3) {
    const nomeFallback = pick(BATALHAS_GENERICAS_NOMES);
    if (!nomesNaLista.has(nomeFallback)) {
      lista.push({
        id: Math.random().toString(36).slice(2),
        nome: nomeFallback,
        nivel: clamp(p.ovr + r(-3, 3), 36, 94),
        local: `${est} (Local)`,
        uf: p.uf,
      });
      nomesNaLista.add(nomeFallback);
    }
  }

  return lista;
}

/**
 * Chance de vitória calibrada:
 * Se a diferença de OVR for grande (ex: 80 vs 60), o MC tem vitória esmagadora (98%).
 * Se a diferença for negativa (ex: 53 vs 70), a chance por batalha é mínima (~1%), evitando títulos fáceis.
 */
export function chanceVitoria(ovr: number, nivel: number) {
  const dif = ovr - nivel;
  if (dif >= 15) return 0.98;
  if (dif >= 10) return 0.88;
  if (dif >= 6) return 0.76;
  if (dif >= 3) return 0.65;
  if (dif >= 1) return 0.55;
  if (dif === 0) return 0.50;
  if (dif >= -2) return 0.42;
  if (dif >= -5) return 0.30;
  if (dif >= -8) return 0.18;
  if (dif >= -12) return 0.08;
  if (dif >= -16) return 0.03;
  return 0.01;
}

/** Chance de twolala (2x0 direto sem terceiro round / réplica) quando vence o duelo */
export function chanceTwolala(ovr: number, nivel: number) {
  const base = 0.22;
  const dif = (ovr - nivel) * 0.02;
  return clamp(base + dif, 0.08, 0.55);
}

/**
 * Checa quantos anos consecutivos o MC disputou batalhas muito mais fracas que seu OVR.
 * Se tiver 5+ anos, gera um aviso claro.
 * Retorna também o desconto de OVR nos torneios maiores por falta de ritmo de elite.
 */
export function checarRitmoEnfrentamento(p: Player, nivelBatalhaAtual?: number): {
  penalidadeTorneio: number;
  anosEmBatalhaFraca: number;
  alertaConforto?: string | undefined;
} {
  let anosEmBatalhaFraca = 0;

  for (let i = p.historico.length - 1; i >= 0; i--) {
    const h = p.historico[i];
    if (!h) break;
    const nivel = h.nivelBatalha ?? (h.ovr - 12);
    if (h.ovr - nivel >= 10) {
      anosEmBatalhaFraca += 1;
    } else {
      break;
    }
  }

  const nivelAtual = nivelBatalhaAtual ?? (p.historico.at(-1)?.nivelBatalha ?? p.ovr);
  const atualEhFraca = p.ovr - nivelAtual >= 10;
  if (atualEhFraca) {
    anosEmBatalhaFraca += 1;
  }

  let penalidadeTorneio = 0;
  if (atualEhFraca) {
    penalidadeTorneio = clamp(Math.round((p.ovr - nivelAtual - 8) * 0.35), 2, 5);
  }

  let alertaConforto: string | undefined;
  if (anosEmBatalhaFraca >= 5) {
    alertaConforto = `Você está há ${anosEmBatalhaFraca} anos em batalhas muito abaixo do seu nível. A falta de enfrentamento adequado durante o ano está pesando contra você no Regional e Estadual!`;
  }

  return {
    penalidadeTorneio,
    anosEmBatalhaFraca,
    alertaConforto,
  };
}

/** Calcula a evolução anual do OVR com base na idade, potencial, sorte e desempenho no ano. */
export function calcularEvolucaoAnual(
  p: Player,
  stats: { batalhas: number; folinhas: number; tacas: number; twolalas: number; nivelBatalha: number; pulou?: boolean },
) {
  const potencial = p.potencial ?? 82;
  const pico = p.picoIdade ?? 25;
  const sorte = p.sorte ?? 0;

  if (stats.pulou) {
    if (p.idade <= 18) return r(0, 1);
    if (p.idade >= pico + 4) return r(-2, 0);
    return r(-1, 0);
  }

  let base = 0;
  if (p.idade <= 17) base = r(2, 4);
  else if (p.idade <= 21) base = r(1, 3);
  else if (p.idade <= pico) base = r(0, 2);
  else if (p.idade <= pico + 4) base = r(-1, 1);
  else base = r(-2, 0);

  // Aproximação do potencial esperado antes do auge
  if (p.idade < pico && p.ovr < potencial) {
    const distancia = potencial - p.ovr;
    if (distancia >= 18) base += 1;
  } else if (p.ovr >= potencial && p.idade >= pico) {
    base -= 1;
  }

  // Desempenho na temporada de folinhas
  if (stats.folinhas >= 4) base += 1;
  if (stats.folinhas === 0 && p.idade > 20) base -= 1;

  // Toque de sorte do ano
  const rollSorte = Math.random() < 0.25 + sorte * 0.05 ? 1 : Math.random() < 0.15 - sorte * 0.04 ? -1 : 0;
  return clamp(base + rollSorte, -3, 6);
}

/**
 * Simula a temporada inteira na batalha escolhida.
 * Cada edição da batalha rende no MÁXIMO 1 folinha (se for o campeão daquela noite).
 */
export function batalhar(p: Player, b: Battle, edicoesForcadas?: number) {
  const edicoes = edicoesForcadas ?? r(12, 18);
  let duelosTotais = 0;
  let folinhas = 0;
  let twolalas = 0;
  const tacas = 0;

  for (let ed = 0; ed < edicoes; ed++) {
    const fases = r(3, 4);
    let fase = 0;
    for (; fase < fases; fase++) {
      duelosTotais += 1;
      const venceu = Math.random() < chanceVitoria(p.ovr, b.nivel - fase);
      if (!venceu) {
        break;
      }
      if (Math.random() < chanceTwolala(p.ovr, b.nivel - fase)) {
        twolalas += 1;
      }
    }
    const campeaoDaEdicao = fase === fases;
    if (campeaoDaEdicao) {
      folinhas += 1;
    }
  }

  const ganho = calcularEvolucaoAnual(p, {
    batalhas: duelosTotais,
    folinhas,
    tacas,
    twolalas,
    nivelBatalha: b.nivel,
  });

  return {
    edicoes,
    batalhas: duelosTotais,
    twolalas,
    folinhas,
    tacas,
    campeao: folinhas > 0,
    ganho,
  };
}

/**
 * Circuito do Nacional: Etapa 1 - Seletiva
 */
export type SeletivaConvite = {
  temSeletiva: boolean;
  chamado: boolean;
  nivelSeletiva: number;
  motivo: string;
};

export function checarSeletiva(p: Player, b: Battle): SeletivaConvite {
  if (p.historico.length === 0 || b.nivel < 40) {
    return {
      temSeletiva: false,
      chamado: false,
      nivelSeletiva: b.nivel,
      motivo: p.historico.length === 0
        ? "Na 1ª temporada você ainda está se firmando na cena local."
        : "Esta batalha não tem seletiva para o Nacional.",
    };
  }

  // Nível da seletiva respeita o patamar da batalha (levemente equilibrado)
  const nivelSeletiva = clamp(b.nivel + r(-2, 1), 38, Math.min(86, p.ovr));
  const anosDeCasa = p.historico.filter((h) => h.batalha === b.nome).length + 1;

  const difNivel = p.ovr - nivelSeletiva;
  let chanceChamado = clamp(0.52 + difNivel * 0.04, 0.22, 0.95);

  let porGratidao = false;
  if (anosDeCasa >= 4) {
    chanceChamado = Math.max(chanceChamado, 0.92);
    porGratidao = true;
  } else if (anosDeCasa >= 3) {
    chanceChamado += 0.28;
    porGratidao = true;
  } else if (anosDeCasa >= 2) {
    chanceChamado += 0.15;
  }

  const chamado = Math.random() < chanceChamado;

  let motivo = "";
  if (chamado) {
    motivo = porGratidao && p.ovr < nivelSeletiva
      ? "Você foi chamado para a Seletiva pelo seu histórico na batalha!"
      : `Você foi convocado para a Seletiva da ${b.nome}!`;
  } else {
    motivo = "A seletiva atraiu muitos MCs de fora e você ficou sem vaga este ano.";
  }

  return {
    temSeletiva: true,
    chamado,
    nivelSeletiva,
    motivo,
  };
}

/** Proposta de seletiva externa de nível menor antes de disputar */
export type PropostaExterna = {
  batalhaNome: string;
  nivel: number;
};

export function sortearPropostaExterna(p: Player, bAtual: Battle): PropostaExterna | null {
  if (p.ovr >= 85) {
    // ── MCs de ELITE (85+): batalhas de alto nível, chance alta ──
    const baseChance = 0.60 + clamp((p.ovr - 85) * 0.015, 0, 0.20); // 60% a 80%
    if (Math.random() > baseChance) return null;

    // Batalhas de prestígio do Sudeste que convocam os melhores
    const nomesElite = [
      "Batalha do Coliseu",
      "Roda dos Escolhidos",
      "Duelo da Elite",
      "Batalha Interestadual",
      "Seletiva Aberta do Sudeste",
      "Desafio dos Pesos Pesados",
      "Desafio do Sudeste",
    ];
    const candidatos = nomesElite.filter((n) => n !== bAtual.nome);

    // Para OVR >= 93 pode vir até 2 propostas – retorna sempre a melhor (maior nível)
    const qtd = p.ovr >= 93 ? 2 : 1;
    const escolhidos: PropostaExterna[] = [];
    const usados = new Set<string>();
    for (let i = 0; i < qtd; i++) {
      const disponiveis = candidatos.filter((n) => !usados.has(n));
      if (disponiveis.length === 0) break;
      const nome = pick(disponiveis);
      usados.add(nome);
      // Nível desafiador mas não impossível
      const nivel = clamp(p.ovr - r(2, 5), 70, 92);
      escolhidos.push({ batalhaNome: nome, nivel });
    }

    if (escolhidos.length === 0) return null;
    return escolhidos.reduce((best, cur) => (cur.nivel > best.nivel ? cur : best));
  }

  // ── MCs COM OVR < 85: batalhas menores de bairro/interior, chance moderada ──
  const chanceBase = p.ovr >= 70 ? 0.35 : p.ovr >= 55 ? 0.22 : 0.12;
  if (Math.random() > chanceBase) return null;

  // Batalhas acessíveis para quem ainda está crescendo
  const nomesMenores = [
    "Batalha da Cohab",
    "Roda do Interior",
    "Duelo do Bairro",
    "Roda da Periferia",
    "Batalha da Quebrada",
    "Duelo do Conjunto",
    "Roda do Complexo",
    "Batalha da Vila",
  ];
  const candidatos = nomesMenores.filter((n) => n !== bAtual.nome);
  const nome = pick(candidatos);
  // Nível proporcional ao OVR, mas sempre abaixo para ser uma "segunda chance" acessível
  const nivel = clamp(p.ovr - r(4, 8), 38, 78);
  return { batalhaNome: nome, nivel };
}

/**
 * Segunda chance na Seletiva:
 * Se você tiver um OVR bom e for da casa há um tempo, ao cair na seletiva da sua batalha
 * pode receber uma proposta de outra seletiva para ter uma segunda chance sem atrito/traição.
 */
export function checarSegundaChanceSeletiva(p: Player, bAtualNome: string): {
  temSegundaChance: boolean;
  batalhaNome: string;
  nivel: number;
} {
  const anosDeCasa = p.historico.filter((h) => h.batalha === bAtualNome).length + 1;
  const temOverBom = p.ovr >= 52;
  const daCasa = anosDeCasa >= 2;

  if (temOverBom && daCasa && Math.random() < 0.75) {
    const nomesVizinhos = ["Batalha da Cohab", "Roda do Interior", "Duelo do Bairro", "Batalha da Quadra", "Roda da Esquina"];
    const nome = pick(nomesVizinhos.filter((n) => n !== bAtualNome));
    const nivel = clamp(p.ovr - r(1, 4), 40, 85);
    return { temSegundaChance: true, batalhaNome: nome, nivel };
  }

  return { temSegundaChance: false, batalhaNome: "", nivel: 0 };
}

export type FaseTorneio = {
  nome: string;
  passou: boolean;
  placar: "2-0" | "2-1" | "1-2" | "0-2";
  detalhe: string;
};

export function simularFasesTorneio(ovr: number, nivelMedio: number): {
  campeao: boolean;
  fases: FaseTorneio[];
} {
  const nomesFases = [
    "1ª Fase (Oitavas)",
    "Quartas de Final",
    "Semifinal",
    "Grande Final",
  ];

  const fases: FaseTorneio[] = [];
  let campeao = true;

  for (let i = 0; i < nomesFases.length; i++) {
    const nivelFase = nivelMedio - (3 - i);
    const venceu = Math.random() < chanceVitoria(ovr, nivelFase);
    const two = venceu ? Math.random() < chanceTwolala(ovr, nivelFase) : Math.random() < 0.25;

    const placar: "2-0" | "2-1" | "1-2" | "0-2" = venceu
      ? (two ? "2-0" : "2-1")
      : (two ? "0-2" : "1-2");

    if (venceu) {
      fases.push({
        nome: nomesFases[i]!,
        passou: true,
        placar,
        detalhe: two ? "Vitória por 2x0 (TWOLALA)!" : "Venceu na decisão dos jurados!",
      });
    } else {
      fases.push({
        nome: nomesFases[i]!,
        passou: false,
        placar,
        detalhe: "Eliminado em duelo disputado.",
      });
      campeao = false;
      break;
    }
  }

  return { campeao, fases };
}

/**
 * Eventos com equilíbrio realista e gatilho de compra de vaga na seletiva
 */
export const EVENTOS: Evento[] = [
  {
    titulo: "O jurado fez uma proposta",
    texto: "Na véspera de uma final decisiva, um jurado disse que pode segurar o placar para você por debaixo dos panos.",
    proposta: {
      acao: "Aceitar a proposta do jurado",
      chance: 0.45,
      bom: { delta: 3, texto: "O placar veio a seu favor e a banca abafou a conversa.", novoStatus: null },
      ruim: {
        delta: -4,
        texto: "O esquema vazou em grupos de WhatsApp! Você foi suspenso por 1 ano do circuito.",
        suspensaoAnos: 1,
        novoStatus: "Suspenso por 1 ano / Fraude",
      },
    },
  },
  {
    titulo: "Um veterano te provocou",
    texto: "Um MC consagrado postou que suas rimas são rasas e que você só ganha na simpatia da plateia.",
    proposta: {
      acao: "Responder com uma diss track pesada",
      chance: 0.52,
      bom: { delta: 3, texto: "Sua diss estourou no YouTube e calou a torcida do veterano.", novoStatus: "Em alta no circuito" },
      ruim: {
        delta: -3,
        texto: "A resposta dele foi destruidora. Os cortes viraram piada e seu hype despencou.",
        novoStatus: "Chacota na cena",
      },
    },
  },
  {
    titulo: "Uma vaga na chave à venda",
    texto: "A chave da seletiva lotou rápido, mas um organizador ofereceu te colocar direto se você pagar uma taxa por fora.",
    proposta: {
      acao: "Comprar a vaga na seletiva",
      ehCompraDeVaga: true,
      chance: 0.5,
      bom: { delta: 2, texto: "A compra da vaga deu certo e seu nome entrou direto na chave da seletiva!", novoStatus: null },
      ruim: {
        delta: -4,
        texto: "A organização descobriu a maracutaia e cortou seu nome com 1 ano de punição.",
        suspensaoAnos: 1,
        novoStatus: "Suspenso por compra de vaga",
      },
    },
  },
  {
    titulo: "A rima de terceiros",
    texto: "Um amigo te passou uma punchline brilhante pronta para usar na decisão.",
    proposta: {
      acao: "Soltar a punch como se fosse sua",
      chance: 0.5,
      bom: { delta: 3, texto: "A torcida explodiu com o impacto e ninguém desconfiou.", novoStatus: null },
      ruim: {
        delta: -3,
        texto: "O autor provou o plágio ao vivo. O Twitter detonou sua moral.",
        novoStatus: "Cancelado por plágio de punch",
      },
    },
  },
  {
    titulo: "Show pago vs noite na batalha",
    texto: "Surgiu um cachê de show no mesmo sábado de uma edição importante da sua batalha.",
    proposta: {
      acao: "Faltar na batalha e ir fazer o show pago",
      chance: 0.65,
      bom: { delta: 3, texto: "O show lotou, rendeu contatos importantes e dinheiro no bolso.", novoStatus: "MC de palco" },
      ruim: {
        delta: -2,
        texto: "O contratante deu calote e os organizadores da sua batalha ficaram chateados com o desfalque.",
        novoStatus: "Clima ruim na praça",
      },
    },
  },
];

export const sortearEvento = () => pick(EVENTOS);
export const rand = r;

/**
 * ==========================================
 * DUELO DE MCS NACIONAL (BELO HORIZONTE / MG)
 * ==========================================
 * 32 MCs representando as federações estaduais
 * sob o histórico Viaduto Santa Tereza.
 * Baseado no histórico recente (2022-2024) da Wikipédia,
 * com participações esporádicas de lendas.
 */
export type NacionalMC = {
  nome: string;
  uf: string;
  ovr: number;
  campeaoAno?: number | undefined;
  ehLenda?: boolean | undefined;
};

export const MCS_DUELO_NACIONAL_LENDAS: NacionalMC[] = [
  { nome: "Douglas Din", uf: "MG", ovr: 89, ehLenda: true, campeaoAno: 2013 },
  { nome: "César MC", uf: "ES", ovr: 89, ehLenda: true, campeaoAno: 2017 },
  { nome: "Sid", uf: "DF", ovr: 88, ehLenda: true, campeaoAno: 2016 },
  { nome: "Noventa", uf: "ES", ovr: 87, ehLenda: true, campeaoAno: 2019 },
  { nome: "Alves", uf: "DF", ovr: 87, ehLenda: true, campeaoAno: 2020 },
  { nome: "Clara Lima", uf: "MG", ovr: 86, ehLenda: true },
  { nome: "Emicida", uf: "SP", ovr: 90, ehLenda: true },
  { nome: "Rashid", uf: "SP", ovr: 88, ehLenda: true },
  { nome: "Orochi", uf: "RJ", ovr: 89, ehLenda: true, campeaoAno: 2015 },
];

export const MCS_DUELO_NACIONAL_REGULARES: NacionalMC[] = [
  // Campeões recentes e destaques 2022-2024
  { nome: "Big Mike", uf: "SP", ovr: 88, campeaoAno: 2022 },
  { nome: "Kaemy", uf: "GO", ovr: 88, campeaoAno: 2023 },
  { nome: "Martzin", uf: "MG", ovr: 88, campeaoAno: 2024 },
  { nome: "Neo", uf: "RJ", ovr: 87 },
  { nome: "Young G", uf: "SP", ovr: 85 },
  { nome: "Kroy", uf: "SP", ovr: 84 },
  { nome: "MCharles", uf: "CE", ovr: 84 },
  { nome: "Yoga", uf: "BA", ovr: 83 },
  { nome: "Japa", uf: "BA", ovr: 83 },
  { nome: "Gomes", uf: "DF", ovr: 83 },
  { nome: "Lorran", uf: "MG", ovr: 83 },
  { nome: "Texas", uf: "ES", ovr: 82 },
  { nome: "PH Original", uf: "RS", ovr: 82 },
  { nome: "Adilsin", uf: "PR", ovr: 82 },
  { nome: "WG", uf: "SC", ovr: 81 },
  { nome: "Nativo", uf: "PA", ovr: 82 },
  { nome: "Vitu", uf: "PE", ovr: 83 },
  { nome: "Vinicius ZN", uf: "PE", ovr: 81 },
  { nome: "Nick", uf: "RN", ovr: 80 },
  { nome: "Rank", uf: "PB", ovr: 80 },
  { nome: "Pitbull", uf: "SE", ovr: 80 },
  { nome: "Khiphop", uf: "SE", ovr: 79 },
  { nome: "Kire", uf: "AL", ovr: 79 },
  { nome: "Aleson", uf: "PI", ovr: 80 },
  { nome: "Hades", uf: "MA", ovr: 81 },
  { nome: "Barroso", uf: "AP", ovr: 79 },
  { nome: "Elle MCs", uf: "AM", ovr: 80 },
  { nome: "Pugga ZS", uf: "RO", ovr: 79 },
  { nome: "WN", uf: "AC", ovr: 79 },
  { nome: "Miliano", uf: "MS", ovr: 81 },
  { nome: "Cigano", uf: "MT", ovr: 80 },
  { nome: "Havel", uf: "MT", ovr: 79 },
  { nome: "Filipin", uf: "TO", ovr: 79 },
  { nome: "Davieno", uf: "RR", ovr: 78 },
  // Mais representantes estaduais e seletivas nacionais
  { nome: "Apollo", uf: "SP", ovr: 84 },
  { nome: "Brenuz", uf: "SP", ovr: 84 },
  { nome: "Magrão", uf: "SP", ovr: 83 },
  { nome: "Bask", uf: "SP", ovr: 82 },
  { nome: "Zuluzão", uf: "SP", ovr: 82 },
  { nome: "Kant", uf: "SP", ovr: 85 },
  { nome: "Prado", uf: "SP", ovr: 83 },
  { nome: "Tubarão", uf: "SP", ovr: 82 },
  { nome: "Barreto", uf: "RJ", ovr: 84 },
  { nome: "Jhony", uf: "RJ", ovr: 85 },
  { nome: "Meuri", uf: "RJ", ovr: 83 },
  { nome: "Levinsk", uf: "RJ", ovr: 83 },
  { nome: "MT", uf: "RJ", ovr: 82 },
  { nome: "Tonhão", uf: "MG", ovr: 82 },
  { nome: "Colin", uf: "MG", ovr: 81 },
  { nome: "Vick", uf: "MG", ovr: 80 },
  { nome: "Chris", uf: "MG", ovr: 84 },
  { nome: "Winicius", uf: "BA", ovr: 82 },
  { nome: "Allan", uf: "BA", ovr: 81 },
  { nome: "LC", uf: "CE", ovr: 82 },
  { nome: "K-Pin", uf: "CE", ovr: 81 },
  { nome: "Mike DF", uf: "DF", ovr: 82 },
  { nome: "Baga", uf: "DF", ovr: 81 },
  { nome: "Dudu", uf: "ES", ovr: 84 },
  { nome: "Schuler", uf: "RS", ovr: 83 },
  { nome: "Guri", uf: "RS", ovr: 82 },
  { nome: "Devil", uf: "SC", ovr: 82 },
  { nome: "Pedro", uf: "PR", ovr: 81 },
  { nome: "Koell", uf: "PE", ovr: 82 },
  { nome: "Jhon", uf: "PA", ovr: 81 },
  { nome: "Bob PI", uf: "PI", ovr: 79 },
  { nome: "Nego RN", uf: "RN", ovr: 79 },
  { nome: "Wanderson", uf: "AM", ovr: 79 },
  { nome: "Lucas RO", uf: "RO", ovr: 78 },
  { nome: "Dan TO", uf: "TO", ovr: 78 },
  { nome: "Allan MS", uf: "MS", ovr: 79 },
  { nome: "Biel AC", uf: "AC", ovr: 78 },
  { nome: "Cauã AL", uf: "AL", ovr: 79 },
  { nome: "Luan AP", uf: "AP", ovr: 78 },
  { nome: "Matheus PB", uf: "PB", ovr: 79 },
  { nome: "Thales RR", uf: "RR", ovr: 78 },
  { nome: "Kauan MA", uf: "MA", ovr: 80 },
  { nome: "Vini GO", uf: "GO", ovr: 81 },
  { nome: "Breno GO", uf: "GO", ovr: 80 },
  { nome: "Ruan BA", uf: "BA", ovr: 81 },
  { nome: "Léo ES", uf: "ES", ovr: 81 },
  { nome: "Yuri SC", uf: "SC", ovr: 80 },
  { nome: "Gui PR", uf: "PR", ovr: 81 },
];

export const MCS_DUELO_NACIONAL: NacionalMC[] = [
  ...MCS_DUELO_NACIONAL_REGULARES,
  ...MCS_DUELO_NACIONAL_LENDAS,
];

export type RoundDueloNacional = {
  numero: 1 | 2 | 3;
  venceu: boolean;
  narrativa: string;
};

export type BatalhaDueloNacional = {
  faseNome: string;
  faseIndex: number;
  adversario: NacionalMC;
  rounds: RoundDueloNacional[];
  placar: "2-0" | "2-1" | "1-2" | "0-2";
  venceu: boolean;
};

export type TorneioDueloNacional = {
  participantes: NacionalMC[];
  batalhas: BatalhaDueloNacional[];
  faseAtualIndex: number;
  roundReveladoIndex: number; // -1: nada revelado, 0: round 1, 1: round 2, 2: round 3
  concluido: boolean;
  campeao: boolean;
  faseAlcancada: string;
  anoPendente: Ano;
};

export const FASES_DUELO_NACIONAL = [
  "1ª Fase (16 avos de final)",
  "Oitavas de Final",
  "Quartas de Final",
  "Semifinal",
  "Grande Final",
] as const;

export function gerarTorneioDueloNacional(player: Player, anoPendente: Ano): TorneioDueloNacional {
  // Lendas são raras: no máximo 1 ou 2 em alguns nacionais (75% sem lendas, 20% com 1 lenda, 5% com 2)
  const rollLenda = Math.random();
  const qtdLendas = rollLenda < 0.20 ? 1 : rollLenda < 0.25 ? 2 : 0;

  const lendasSorteaveis = MCS_DUELO_NACIONAL_LENDAS.filter(
    (m) => m.nome.toLowerCase() !== player.nome.toLowerCase()
  ).sort(() => 0.5 - Math.random());
  const lendasEscolhidas = lendasSorteaveis.slice(0, qtdLendas);

  const regularesSorteaveis = MCS_DUELO_NACIONAL_REGULARES.filter(
    (m) => m.nome.toLowerCase() !== player.nome.toLowerCase()
  ).sort(() => 0.5 - Math.random());

  // Formato real: 1 representante por estado (27 UFs: jogador + 26 outros estados) + 5 de repescagem = 32 MCs (31 adversários)
  const escolhidosNomes = new Set<string>();
  const representantesEstados: NacionalMC[] = [];
  const outrasUfs = ESTADOS.map((e) => e[0]).filter((uf) => uf !== player.uf);

  // Alocar 1 representante para cada um dos outros 26 estados
  for (const uf of outrasUfs) {
    const lendaDaUf = lendasEscolhidas.find((l) => l.uf === uf && !escolhidosNomes.has(l.nome));
    const candidato =
      lendaDaUf ??
      regularesSorteaveis.find((m) => m.uf === uf && !escolhidosNomes.has(m.nome)) ??
      regularesSorteaveis.find((m) => !escolhidosNomes.has(m.nome));
    if (candidato) {
      escolhidosNomes.add(candidato.nome);
      representantesEstados.push(candidato);
    }
  }

  // Completar com 5 MCs da repescagem (aleatórios, incluindo eventual lenda restante)
  const repescagem: NacionalMC[] = [];
  for (const lenda of lendasEscolhidas) {
    if (repescagem.length >= 5) break;
    if (!escolhidosNomes.has(lenda.nome)) {
      escolhidosNomes.add(lenda.nome);
      repescagem.push(lenda);
    }
  }
  for (const reg of regularesSorteaveis) {
    if (repescagem.length >= 5) break;
    if (!escolhidosNomes.has(reg.nome)) {
      escolhidosNomes.add(reg.nome);
      repescagem.push(reg);
    }
  }

  const participantes = [...representantesEstados, ...repescagem].sort(() => 0.5 - Math.random());

  // Selecionar 5 adversários estritamente únicos para as 5 fases do jogador (prevenindo repetição de MC)
  const usados = new Set<string>();
  const selecionadosParaDuelo: NacionalMC[] = [];

  const faixas = [
    (m: NacionalMC) => m.ovr <= 81,
    (m: NacionalMC) => m.ovr >= 81 && m.ovr <= 83,
    (m: NacionalMC) => m.ovr >= 83 && m.ovr <= 85,
    (m: NacionalMC) => m.ovr >= 85 && m.ovr <= 88,
    (m: NacionalMC) => m.ovr >= 87,
  ];

  for (let i = 0; i < 5; i++) {
    const fn = faixas[i]!;
    let candidato = participantes.find((m) => !usados.has(m.nome) && fn(m));
    if (!candidato) {
      candidato = participantes.find((m) => !usados.has(m.nome));
    }
    if (!candidato) {
      candidato = participantes[i % participantes.length]!;
    }
    usados.add(candidato.nome);
    selecionadosParaDuelo.push(candidato);
  }

  const penalidadeTitulo =
    player.nacionaisGanhos === 0
      ? 0
      : player.nacionaisGanhos === 1
      ? 3
      : 5 + Math.min(3, player.nacionaisGanhos - 2);
  const ovrEfetivoNacional = Math.max(30, anoPendente.ovr - penalidadeTitulo);

  const batalhas: BatalhaDueloNacional[] = [];
  let campeao = true;
  let faseAlcancada = "Grande Final";

  for (let i = 0; i < FASES_DUELO_NACIONAL.length; i++) {
    const faseNome = FASES_DUELO_NACIONAL[i]!;
    const adv = selecionadosParaDuelo[i]!;

    // Simulação round a round simplificada: Ganhou (unânime) ou Ganhou (apertado)
    const r1Venceu = Math.random() < chanceVitoria(ovrEfetivoNacional, adv.ovr);
    const unanimeR1 = Math.random() < 0.45;
    const narrativaR1 = r1Venceu
      ? `Ganhou (${unanimeR1 ? "unânime" : "apertado"})`
      : `${adv.nome} ganhou (${unanimeR1 ? "unânime" : "apertado"})`;

    const r2Venceu = Math.random() < chanceVitoria(ovrEfetivoNacional, adv.ovr);
    const unanimeR2 = Math.random() < 0.45;
    const narrativaR2 = r2Venceu
      ? `Ganhou (${unanimeR2 ? "unânime" : "apertado"})`
      : `${adv.nome} ganhou (${unanimeR2 ? "unânime" : "apertado"})`;

    const rounds: RoundDueloNacional[] = [
      { numero: 1, venceu: r1Venceu, narrativa: narrativaR1 },
      { numero: 2, venceu: r2Venceu, narrativa: narrativaR2 },
    ];

    let venceu = false;
    let placar: "2-0" | "2-1" | "1-2" | "0-2" = "2-0";

    if (r1Venceu && r2Venceu) {
      venceu = true;
      placar = "2-0";
    } else if (!r1Venceu && !r2Venceu) {
      venceu = false;
      placar = "0-2";
    } else {
      // Empate 1 a 1 -> Terceiro round
      const r3Venceu = Math.random() < chanceVitoria(anoPendente.ovr, adv.ovr);
      const unanimeR3 = Math.random() < 0.4;
      const narrativaR3 = r3Venceu
        ? `Ganhou (${unanimeR3 ? "unânime" : "apertado"})`
        : `${adv.nome} ganhou (${unanimeR3 ? "unânime" : "apertado"})`;

      rounds.push({ numero: 3, venceu: r3Venceu, narrativa: narrativaR3 });
      venceu = r3Venceu;
      placar = r3Venceu ? "2-1" : "1-2";
    }

    batalhas.push({
      faseNome,
      faseIndex: i,
      adversario: adv,
      rounds,
      placar,
      venceu,
    });

    if (!venceu) {
      campeao = false;
      faseAlcancada = faseNome;
      break;
    }
  }

  if (campeao) {
    faseAlcancada = "Campeão Nacional";
  }

  return {
    participantes,
    batalhas,
    faseAtualIndex: 0,
    roundReveladoIndex: -1,
    concluido: false,
    campeao,
    faseAlcancada,
    anoPendente,
  };
}
