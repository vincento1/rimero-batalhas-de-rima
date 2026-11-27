import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import logo from "@/assets/rimero-logo.png.asset.json";
import {
  ESTADOS,
  SONHOS,
  batalhar,
  calcularEvolucaoAnual,
  checarRitmoEnfrentamento,
  checarSegundaChanceSeletiva,
  checarSeletiva,
  clamp,
  convites,
  criarPerfilCarreira,
  FASES_DUELO_NACIONAL,
  flag,
  gerarTorneioDueloNacional,
  rand,
  simularFasesTorneio,
  sortearEvento,
  sortearPropostaExterna,
  type Ano,
  type Battle,
  type Evento,
  type FaseTorneio,
  type Player,
  type PropostaExterna,
  type TorneioDueloNacional,
} from "@/lib/game";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rimero." },
      { name: "description", content: "Simulador de carreira de batalhas de rima no Brasil. Represente seu estado e viva seu sonho." },
      { property: "og:title", content: "rimero. — carreira de MC de batalha" },
      { property: "og:description", content: "Represente seu estado e suba nas batalhas de rima do Brasil." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: App,
});

function App() {
  const [tela, setTela] = useState<"inicio" | "criar" | "jogo">("inicio");
  const [p, setP] = useState<Player | null>(null);

  if (tela === "inicio") {
    return (
      <Inicio
        temCarreira={!!p}
        onStart={() => setTela(p ? "jogo" : "criar")}
        onNew={() => {
          setP(null);
          setTela("criar");
        }}
      />
    );
  }

  if (tela === "criar" || !p) {
    return (
      <Criar
        onBack={() => setTela("inicio")}
        onDone={(pl) => {
          setP(pl);
          setTela("jogo");
        }}
      />
    );
  }

  if (p.aposentado || p.idade >= 40) {
    return <Aposentadoria p={p} onNew={() => { setP(null); setTela("criar"); }} />;
  }

  return (
    <Jogo
      p={p}
      setP={setP}
      onBack={() => setTela("inicio")}
      onReset={() => {
        setP(null);
        setTela("criar");
      }}
      onAposentar={() => {
        setP({ ...p, aposentado: true });
      }}
    />
  );
}

function Logo({ small }: { small?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center select-none ${small ? "gap-0.5" : "gap-2"}`}>
      <img
        src="/rimero-mic.png"
        alt="rimero."
        className={small ? "h-8 w-auto md:h-9 object-contain" : "h-32 w-auto md:h-44 object-contain"}
      />
      <span
        className={`font-black tracking-tight text-foreground leading-none ${
          small ? "text-base md:text-lg" : "text-4xl md:text-5xl"
        }`}
      >
        rimero<span className="text-primary">.</span>
      </span>
    </div>
  );
}

function Inicio({ onStart, onNew, temCarreira }: { onStart: () => void; onNew: () => void; temCarreira: boolean }) {
  return (
    <main className="grain flex min-h-screen flex-col items-center justify-center px-4 py-8 text-center">
      <div className="animate-in fade-in zoom-in-95 duration-700">
        <Logo />
      </div>
      <p className="mt-4 max-w-xl text-sm md:text-base text-foreground/90">
        faça sua carreira como mc de batalha no cenário brasileiro. represente seu estado, participe do circuito nacional e corra atrás do seu sonho!
        (baseado no jogo argentino copero)
      </p>
      <div className="my-5 h-[2px] w-full max-w-2xl bg-primary" />
      <button onClick={onStart} className="btn-main">
        {temCarreira ? "Continuar carreira" : "Começar carreira"}
      </button>
      {temCarreira && (
        <button onClick={onNew} className="mt-4 text-xs md:text-sm font-bold text-muted-foreground underline hover:text-foreground">
          Começar carreira
        </button>
      )}
    </main>
  );
}

function Criar({ onDone, onBack }: { onDone: (p: Player) => void; onBack: () => void }) {
  const [uf, setUf] = useState("SP");
  const [nome, setNome] = useState("");
  const [idade, setIdade] = useState(16);

  function criar() {
    const perfil = criarPerfilCarreira();
    onDone({
      nome: nome.trim(),
      uf,
      sonho: "Duelo Nacional de MCs",
      idade,
      ovr: perfil.ovr,
      potencial: perfil.potencial,
      picoIdade: perfil.picoIdade,
      sorte: perfil.sorte,
      seletivasGanhas: 0,
      regionaisGanhas: 0,
      estaduaisGanhos: 0,
      nacionaisGanhos: 0,
      anosSuspensao: 0,
      vacilosBatalhaAtual: 0,
      batalhasBanidas: [],
      historico: [],
      log: [],
    });
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-6 md:py-8">
      <button onClick={onBack} className="mb-3 text-xs md:text-sm font-bold text-muted-foreground underline hover:text-foreground">
        ← Voltar
      </button>
      <div className="flex items-center gap-3">
        <Logo small />
        <h1 className="text-2xl md:text-3xl font-bold">Monte seu MC</h1>
      </div>
      <div className="my-4 h-[2px] bg-primary" />

      <label className="label">Nome de MC</label>
      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="MC ..."
        className="field"
        maxLength={24}
      />

      <div className="mt-3 flex items-center gap-3">
        <label className="label !mb-0">Idade</label>
        {[14, 15, 16, 17, 18, 19, 20].map((i) => (
          <button key={i} onClick={() => setIdade(i)} className={`chip ${idade === i ? "chip-on" : ""}`}>
            {i}
          </button>
        ))}
      </div>

      <label className="label mt-5">Estado que vai representar</label>
      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 md:grid-cols-9">
        {ESTADOS.map(([s, n]) => (
          <button
            key={s}
            onClick={() => setUf(s)}
            title={n}
            className={`card flex flex-col items-center gap-1 p-1.5 ${uf === s ? "card-on" : ""}`}
          >
            <img src={flag(s)} alt={n} className="h-6 w-9 rounded-sm object-cover" />
            <span className="text-xs font-bold">{s}</span>
          </button>
        ))}
      </div>

      <button disabled={!nome.trim()} onClick={criar} className="btn-main mt-6 disabled:opacity-40">
        Começar
      </button>
    </main>
  );
}

type Sorteio = {
  ok: boolean;
  terminou: boolean;
};

type EtapaCircuito = "seletiva" | "regional" | "estadual";

type CircuitoModalState = {
  etapa: EtapaCircuito;
  batalhaNome: string;
  uf: string;
  nivel: number;
  penalidadeRitmo?: number | undefined;
  emAndamento: boolean;
  faseEmDisputaIndex: number;
  revelandoResultadoFase: boolean;
  fases: FaseTorneio[];
  campeao: boolean;
  concluida: boolean;
  anoPendente: Ano;
  segundaChanceOferta?: { batalhaNome: string; nivel: number } | undefined;
};

function Jogo({
  p,
  setP,
  onBack,
  onReset,
  onAposentar,
}: {
  p: Player;
  setP: (p: Player) => void;
  onBack: () => void;
  onReset: () => void;
  onAposentar: () => void;
}) {
  const [ofertas, setOfertas] = useState<Battle[]>(() => convites(p));
  const [evento, setEvento] = useState<Evento | null>(null);
  const [sorteio, setSorteio] = useState<Sorteio | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Proposta de outra seletiva de nível menor antes da seletiva principal
  const [propostaExterna, setPropostaExterna] = useState<{
    prop: PropostaExterna;
    anoPendente: Ano;
  } | null>(null);

  // Animação de subida/descida do OVR
  const [displayOvr, setDisplayOvr] = useState(p.ovr);
  const [ovrAnimDelta, setOvrAnimDelta] = useState<number | null>(null);

  // Modal do Circuito
  const [circuitoModal, setCircuitoModal] = useState<CircuitoModalState | null>(null);

  // Modal exclusivo do Duelo de MCs Nacional (Belo Horizonte)
  const [dueloNacional, setDueloNacional] = useState<TorneioDueloNacional | null>(null);

  // Proposta de mudança de estado para representar no Nacional
  const [propostaMudancaEstado, setPropostaMudancaEstado] = useState<Battle | null>(null);

  // Modo de exibição automática dos torneios (batalha por batalha vs direto)
  const [modoTorneio, setModoTorneio] = useState<{
    seletiva: "batalha" | "direto";
    regional: "batalha" | "direto";
    estadual: "batalha" | "direto";
    nacional: "batalha" | "direto";
  }>({
    seletiva: "batalha",
    regional: "batalha",
    estadual: "batalha",
    nacional: "batalha",
  });
  const [mostrarVelocidade, setMostrarVelocidade] = useState(false);
  const [anoAnimando, setAnoAnimando] = useState<number | null>(null);

  const timerRef = useRef<number | null>(null);
  const animIntervalRef = useRef<number | null>(null);
  const faseTimeoutRef = useRef<number | null>(null);
  const tabelaRef = useRef<HTMLElement | null>(null);
  const linhaAtualRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    const container = tabelaRef.current;
    const row = linhaAtualRef.current;
    if (!container || !row) return;
    if (container.scrollHeight > container.clientHeight) {
      const targetTop = Math.max(0, row.offsetTop - container.clientHeight / 2 + row.clientHeight / 2);
      container.scrollTo({ top: targetTop, behavior: "smooth" });
    }
  }, [p.idade, anoAnimando]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (animIntervalRef.current) window.clearInterval(animIntervalRef.current);
      if (faseTimeoutRef.current) window.clearTimeout(faseTimeoutRef.current);
    };
  }, []);

  // Efeito animado do OVR
  useEffect(() => {
    if (p.ovr === displayOvr) return;
    const diff = p.ovr - displayOvr;
    setOvrAnimDelta(diff);

    if (animIntervalRef.current) window.clearInterval(animIntervalRef.current);

    const step = diff > 0 ? 1 : -1;
    animIntervalRef.current = window.setInterval(() => {
      setDisplayOvr((current) => {
        if (current + step === p.ovr) {
          if (animIntervalRef.current) window.clearInterval(animIntervalRef.current);
          return p.ovr;
        }
        return current + step;
      });
    }, 85);

    const clearDeltaTimeout = window.setTimeout(() => {
      setOvrAnimDelta(null);
    }, 2200);

    return () => {
      window.clearTimeout(clearDeltaTimeout);
      if (animIntervalRef.current) window.clearInterval(animIntervalRef.current);
    };
  }, [p.ovr]);

  const anoVazio = (): Ano => ({
    idade: p.idade,
    ovr: p.ovr,
    delta: 0,
    batalha: p.batalhaAtualNome || "Escolha sua batalha",
    uf: p.uf,
    batalhas: 0,
    twolalas: 0,
    folinhas: 0,
    tacas: 0,
  });

  const atual = p.historico.find((h) => h.idade === p.idade) ?? anoVazio();
  const tot = p.historico.reduce(
    (a, h) => ({ b: a.b + h.batalhas, two: a.two + (h.twolalas ?? 0), f: a.f + h.folinhas, t: a.t + h.tacas }),
    { b: 0, two: 0, f: 0, t: 0 },
  );

  const [displayTot, setDisplayTot] = useState(tot);
  useEffect(() => {
    const start = { ...displayTot };
    const target = tot;
    if (start.b === target.b && start.two === target.two && start.f === target.f && start.t === target.t) return;
    const steps = 12;
    let step = 0;
    const id = window.setInterval(() => {
      step++;
      const t = step / steps;
      if (step >= steps) {
        setDisplayTot(target);
        window.clearInterval(id);
      } else {
        setDisplayTot({
          b: Math.round(start.b + (target.b - start.b) * t),
          two: Math.round(start.two + (target.two - start.two) * t),
          f: Math.round(start.f + (target.f - start.f) * t),
          t: Math.round(start.t + (target.t - start.t) * t),
        });
      }
    }, 45);
    return () => window.clearInterval(id);
  }, [tot.b, tot.two, tot.f, tot.t]);

  const estaSuspenso = p.anosSuspensao > 0;

  function avancarAno(np: Player) {
    const nextAge = np.idade + 1;
    const next = { ...np, idade: nextAge };
    if (nextAge >= 40) {
      setP({ ...next, aposentado: true });
      return;
    }
    setP(next);
    // Aguarda a animação dos números terminar antes de mostrar as novas ofertas
    window.setTimeout(() => {
      setOfertas(convites(next));
    }, 2300);
    if (Math.random() < 0.2) {
      setSorteio(null);
      setEvento(sortearEvento());
    }
  }

  function jogar(b: Battle, playerCustom?: Player) {
    // Limpa qualquer proposta externa pendente do ano anterior
    setPropostaExterna(null);
    const pl = playerCustom ?? p;
    const res = batalhar(pl, b);
    const novoOvr = Math.max(30, Math.min(99, pl.ovr + res.ganho));
    const delta = novoOvr - pl.ovr;

    const ano: Ano = {
      idade: pl.idade,
      ovr: novoOvr,
      delta,
      batalha: b.nome,
      nivelBatalha: b.nivel,
      uf: pl.uf,
      batalhas: atual.batalhas + res.batalhas,
      twolalas: atual.twolalas + res.twolalas,
      folinhas: atual.folinhas + res.folinhas,
      tacas: atual.tacas + res.tacas,
    };

    const textoTemporada = `${b.nome} (${b.local}): ${res.edicoes} edições, ${res.folinhas} folinhas e ${res.twolalas} twolalas.`;

    // Checar Seletiva da batalha
    const checagem = checarSeletiva({ ...pl, ovr: novoOvr }, b);

    if (checagem.chamado) {
      const simulacao = simularFasesTorneio(novoOvr, checagem.nivelSeletiva);
      setMsg(textoTemporada);
      setAnoAnimando(pl.idade);
      window.setTimeout(() => setAnoAnimando(null), 2200);
      setP({
        ...pl,
        ovr: novoOvr,
        batalhaAtualNome: b.nome,
        historico: [...pl.historico.filter((h) => h.idade !== pl.idade), ano],
      });
      window.setTimeout(() => {
        setCircuitoModal({
          etapa: "seletiva",
          batalhaNome: b.nome,
          uf: pl.uf,
          nivel: checagem.nivelSeletiva,
          emAndamento: false,
          faseEmDisputaIndex: 0,
          revelandoResultadoFase: false,
          fases: simulacao.fases,
          campeao: simulacao.campeao,
          concluida: false,
          anoPendente: ano,
        });
      }, 2400);
      return;
    }

    // Se não teve seletiva na sua, pode pintar proposta de outra seletiva menor
    const propExterna = sortearPropostaExterna({ ...pl, ovr: novoOvr }, b);
    if (propExterna) {
      setMsg(textoTemporada);
      setAnoAnimando(pl.idade);
      window.setTimeout(() => setAnoAnimando(null), 2200);
      setP({
        ...pl,
        ovr: novoOvr,
        batalhaAtualNome: b.nome,
        historico: [...pl.historico.filter((h) => h.idade !== pl.idade), ano],
      });
      window.setTimeout(() => {
        setPropostaExterna({ prop: propExterna, anoPendente: ano });
      }, 2400);
      return;
    }

    const msgFinal = checagem.temSeletiva ? `${textoTemporada} ${checagem.motivo}` : textoTemporada;
    setMsg(msgFinal);
    setAnoAnimando(pl.idade);
    window.setTimeout(() => setAnoAnimando(null), 2200);
    avancarAno({
      ...pl,
      ovr: novoOvr,
      batalhaAtualNome: b.nome,
      historico: [...pl.historico.filter((h) => h.idade !== pl.idade), ano],
      log: [msgFinal, ...pl.log].slice(0, 30),
    });
  }

  function escolherBatalha(b: Battle) {
    if (b.mudancaEstado && b.uf !== p.uf) {
      setPropostaMudancaEstado(b);
      return;
    }
    jogar(b);
  }

  function aceitarPropostaExterna() {
    if (!propostaExterna) return;
    const { prop, anoPendente } = propostaExterna;
    const novosVacilos = p.vacilosBatalhaAtual + 1;
    let batalhasBanidas = [...p.batalhasBanidas];
    let batalhaAtualNome: string | undefined = p.batalhaAtualNome;

    let avisoAtrito = `Você aceitou disputar a seletiva por fora (${prop.batalhaNome}). Sua batalha ficou descontente (${novosVacilos}/3 vacilos).`;
    if (novosVacilos >= 3 && p.batalhaAtualNome) {
      batalhasBanidas.push(p.batalhaAtualNome);
      avisoAtrito = `A organização da ${p.batalhaAtualNome} se revoltou por você lutar por outra roda e te expulsou definitivamente!`;
      batalhaAtualNome = undefined;
    }

    setMsg(avisoAtrito);

    const simulacao = simularFasesTorneio(anoPendente.ovr, prop.nivel);
    setPropostaExterna(null);

    setCircuitoModal({
      etapa: "seletiva",
      batalhaNome: `${prop.batalhaNome} (Externa)`,
      uf: p.uf,
      nivel: prop.nivel,
      emAndamento: false,
      faseEmDisputaIndex: 0,
      revelandoResultadoFase: false,
      fases: simulacao.fases,
      campeao: simulacao.campeao,
      concluida: false,
      anoPendente,
    });

    setP({
      ...p,
      vacilosBatalhaAtual: novosVacilos >= 3 ? 0 : novosVacilos,
      batalhasBanidas,
      batalhaAtualNome,
    });
  }

  function recusarPropostaExterna() {
    if (!propostaExterna) return;
    const { anoPendente } = propostaExterna;
    const msgFinal = `${anoPendente.batalha}: temporada concluída. Você recusou o convite externo e honrou a sua praça.`;
    setMsg(msgFinal);
    setPropostaExterna(null);
    avancarAno({
      ...p,
      ovr: anoPendente.ovr,
      batalhaAtualNome: anoPendente.batalha,
      historico: [...p.historico.filter((h) => h.idade !== p.idade), anoPendente],
      log: [msgFinal, ...p.log].slice(0, 30),
    });
  }

  // Iniciar suspense fase a fase com delay para a revelação do placar
  function iniciarSuspenseTorneio() {
    if (!circuitoModal) return;
    setCircuitoModal((prev) => (prev ? { ...prev, emAndamento: true, faseEmDisputaIndex: 0, revelandoResultadoFase: false } : prev));
    executarFaseComSuspense(0);
  }

  function executarFaseComSuspense(faseIdx: number) {
    if (faseTimeoutRef.current) window.clearTimeout(faseTimeoutRef.current);

    setCircuitoModal((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        faseEmDisputaIndex: faseIdx,
        revelandoResultadoFase: false,
      };
    });

    faseTimeoutRef.current = window.setTimeout(() => {
      setCircuitoModal((prev) => {
        if (!prev) return null;
        const faseAtual = prev.fases[faseIdx];
        const passou = faseAtual?.passou;
        const ehUltima = faseIdx >= prev.fases.length - 1;

        if (!passou || ehUltima) {
          // Checar se merece Segunda Chance (apenas se caiu na Seletiva da sua batalha)
          let segundaChanceOferta: { batalhaNome: string; nivel: number } | undefined;
          if (!passou && prev.etapa === "seletiva" && p.batalhaAtualNome && prev.batalhaNome === p.batalhaAtualNome) {
            const sc = checarSegundaChanceSeletiva(p, p.batalhaAtualNome);
            if (sc.temSegundaChance) {
              segundaChanceOferta = { batalhaNome: sc.batalhaNome, nivel: sc.nivel };
            }
          }

          return {
            ...prev,
            faseEmDisputaIndex: faseIdx,
            revelandoResultadoFase: true,
            concluida: true,
            segundaChanceOferta,
          };
        }

        faseTimeoutRef.current = window.setTimeout(() => {
          executarFaseComSuspense(faseIdx + 1);
        }, 750);

        return {
          ...prev,
          faseEmDisputaIndex: faseIdx,
          revelandoResultadoFase: true,
        };
      });
    }, 750);
  }

  function pularResultadoCircuito() {
    if (faseTimeoutRef.current) window.clearTimeout(faseTimeoutRef.current);
    setCircuitoModal((prev) => {
      if (!prev) return null;
      const campeao = prev.campeao;
      let segundaChanceOferta: { batalhaNome: string; nivel: number } | undefined;

      if (!campeao && prev.etapa === "seletiva" && p.batalhaAtualNome && prev.batalhaNome === p.batalhaAtualNome) {
        const sc = checarSegundaChanceSeletiva(p, p.batalhaAtualNome);
        if (sc.temSegundaChance) {
          segundaChanceOferta = { batalhaNome: sc.batalhaNome, nivel: sc.nivel };
        }
      }

      return {
        ...prev,
        emAndamento: true,
        faseEmDisputaIndex: prev.fases.length - 1,
        revelandoResultadoFase: true,
        concluida: true,
        segundaChanceOferta,
      };
    });
  }

  useEffect(() => {
    if (circuitoModal && !circuitoModal.emAndamento && !circuitoModal.concluida) {
      if (modoTorneio[circuitoModal.etapa] === "direto") {
        pularResultadoCircuito();
      }
    }
  }, [circuitoModal?.etapa, circuitoModal?.batalhaNome, modoTorneio]);

  function aceitarSegundaChance() {
    if (!circuitoModal?.segundaChanceOferta) return;
    const { segundaChanceOferta, anoPendente, uf } = circuitoModal;
    const simulacao = simularFasesTorneio(anoPendente.ovr, segundaChanceOferta.nivel);

    setCircuitoModal({
      etapa: "seletiva",
      batalhaNome: `${segundaChanceOferta.batalhaNome} (2ª Chance)`,
      uf,
      nivel: segundaChanceOferta.nivel,
      emAndamento: false,
      faseEmDisputaIndex: 0,
      revelandoResultadoFase: false,
      fases: simulacao.fases,
      campeao: simulacao.campeao,
      concluida: false,
      anoPendente,
    });
  }

  function avancarProximaEtapaCircuito() {
    if (!circuitoModal) return;
    const { etapa, anoPendente, batalhaNome, uf } = circuitoModal;

    const ritmo = checarRitmoEnfrentamento(p, anoPendente.nivelBatalha);
    const ovrEfetivo = Math.max(30, anoPendente.ovr - ritmo.penalidadeTorneio);

    if (etapa === "seletiva") {
      // Regional calibrado: nível fixo real de 66 a 74 (não escala para baixo de novatos)
      const nivelRegional = clamp(rand(66, 73), 64, 76);
      const simulacao = simularFasesTorneio(ovrEfetivo, nivelRegional);
      setCircuitoModal({
        etapa: "regional",
        batalhaNome,
        uf,
        nivel: nivelRegional,
        penalidadeRitmo: ritmo.penalidadeTorneio,
        emAndamento: false,
        faseEmDisputaIndex: 0,
        revelandoResultadoFase: false,
        fases: simulacao.fases,
        campeao: simulacao.campeao,
        concluida: false,
        anoPendente: {
          ...anoPendente,
          seletiva: { jogou: true, campeao: true, faseAlcancada: "Campeão" },
        },
      });
    } else if (etapa === "regional") {
      // Estadual calibrado: elite máxima do estado (76 a 84)
      const nivelEstadual = clamp(rand(76, 83), 74, 86);
      const simulacao = simularFasesTorneio(ovrEfetivo, nivelEstadual);
      setCircuitoModal({
        etapa: "estadual",
        batalhaNome,
        uf,
        nivel: nivelEstadual,
        penalidadeRitmo: ritmo.penalidadeTorneio,
        emAndamento: false,
        faseEmDisputaIndex: 0,
        revelandoResultadoFase: false,
        fases: simulacao.fases,
        campeao: simulacao.campeao,
        concluida: false,
        anoPendente: {
          ...anoPendente,
          regional: { jogou: true, campeao: true, faseAlcancada: "Campeão" },
        },
      });
    }
  }

  function fecharCircuitoModal(participou: boolean) {
    if (!circuitoModal) return;
    if (faseTimeoutRef.current) window.clearTimeout(faseTimeoutRef.current);

    const { etapa, anoPendente, campeao, batalhaNome } = circuitoModal;

    let seletivasGanhas = p.seletivasGanhas;
    let regionaisGanhas = p.regionaisGanhas;
    let estaduaisGanhos = p.estaduaisGanhos;
    let tacas = anoPendente.tacas;
    let logTexto = `${anoPendente.batalha}: temporada concluída.`;

    if (participou) {
      const faseAlcancada = campeao ? "Campeão" : circuitoModal.fases[circuitoModal.faseEmDisputaIndex]?.nome ?? "Eliminado";

      if (etapa === "seletiva") {
        anoPendente.seletiva = { jogou: true, campeao, faseAlcancada };
        if (campeao) {
          seletivasGanhas += 1;
          logTexto += ` Venceu a Seletiva da ${batalhaNome}!`;
        } else {
          logTexto += ` Seletiva: caiu na ${faseAlcancada}.`;
        }
      } else if (etapa === "regional") {
        anoPendente.regional = { jogou: true, campeao, faseAlcancada };
        if (campeao) {
          regionaisGanhas += 1;
          logTexto += ` Campeão da Regional!`;
        } else {
          logTexto += ` Regional: caiu na ${faseAlcancada}.`;
        }
      } else if (etapa === "estadual") {
        anoPendente.estadual = { jogou: true, campeao, faseAlcancada };
        if (campeao) {
          estaduaisGanhos += 1;
          tacas += 1;
          anoPendente.tacas = tacas;
          logTexto += ` 🏆 CAMPEÃO ESTADUAL DE ${p.uf}!`;

          // CAMPEÃO ESTADUAL: Classificado para o Duelo de MCs Nacional em Belo Horizonte!
          const playerClassificado: Player = {
            ...p,
            ovr: anoPendente.ovr,
            batalhaAtualNome: anoPendente.batalha,
            seletivasGanhas,
            regionaisGanhas,
            estaduaisGanhos,
            nacionaisGanhos: p.nacionaisGanhos ?? 0,
            historico: [...p.historico.filter((h) => h.idade !== p.idade), anoPendente],
            log: [logTexto, ...p.log].slice(0, 30),
          };
          setP(playerClassificado);
          setCircuitoModal(null);
          setDueloNacional(gerarTorneioDueloNacional(playerClassificado, anoPendente));
          return;
        } else {
          logTexto += ` Estadual: caiu na ${faseAlcancada}.`;
        }
      }
    }

    setMsg(logTexto);
    const novoPlayer: Player = {
      ...p,
      ovr: anoPendente.ovr,
      batalhaAtualNome: anoPendente.batalha,
      seletivasGanhas,
      regionaisGanhas,
      estaduaisGanhos,
      nacionaisGanhos: p.nacionaisGanhos ?? 0,
      historico: [...p.historico.filter((h) => h.idade !== p.idade), anoPendente],
      log: [logTexto, ...p.log].slice(0, 30),
    };

    setCircuitoModal(null);
    avancarAno(novoPlayer);
  }

  function revelarProximoRoundNacional() {
    if (!dueloNacional) return;
    const batalha = dueloNacional.batalhas[dueloNacional.faseAtualIndex];
    if (!batalha) return;
    const proxRound = dueloNacional.roundReveladoIndex + 1;
    if (proxRound < batalha.rounds.length) {
      setDueloNacional({
        ...dueloNacional,
        roundReveladoIndex: proxRound,
      });
    }
  }

  function avancarProximaFaseNacional() {
    if (!dueloNacional) return;
    const proximaFase = dueloNacional.faseAtualIndex + 1;
    if (proximaFase < dueloNacional.batalhas.length) {
      setDueloNacional({
        ...dueloNacional,
        faseAtualIndex: proximaFase,
        roundReveladoIndex: -1,
      });
    }
  }

  function fecharDueloNacional() {
    if (!dueloNacional) return;
    const { anoPendente, campeao, faseAlcancada } = dueloNacional;

    let nacionaisGanhos = p.nacionaisGanhos ?? 0;
    let tacas = anoPendente.tacas;
    let logTexto = `${anoPendente.batalha}: temporada concluída.`;

    anoPendente.nacional = {
      jogou: true,
      campeao,
      faseAlcancada,
    };

    if (campeao) {
      nacionaisGanhos += 1;
      tacas += 1;
      anoPendente.tacas = tacas;
      logTexto += ` 🏆🏆 CAMPEÃO DO DUELO DE MCS NACIONAL NO VIADUTO SANTA TEREZA!`;
    } else {
      logTexto += ` Duelo Nacional: caiu na ${faseAlcancada}.`;
    }

    setMsg(logTexto);
    const novoPlayer: Player = {
      ...p,
      ovr: anoPendente.ovr,
      batalhaAtualNome: anoPendente.batalha,
      seletivasGanhas: p.seletivasGanhas,
      regionaisGanhas: p.regionaisGanhas,
      estaduaisGanhos: p.estaduaisGanhos,
      nacionaisGanhos,
      historico: [...p.historico.filter((h) => h.idade !== p.idade), anoPendente],
      log: [logTexto, ...p.log].slice(0, 30),
    };

    setDueloNacional(null);
    avancarAno(novoPlayer);
  }

  function pularAno() {
    const ganho = calcularEvolucaoAnual(p, { batalhas: 0, folinhas: 0, tacas: 0, twolalas: 0, nivelBatalha: p.ovr, pulou: true });
    const ovr = Math.max(30, Math.min(99, p.ovr + ganho));
    const delta = ovr - p.ovr;
    const motivo = estaSuspenso ? `Suspenso (${p.status || "Punição"})` : "Fora do circuito";
    const ano: Ano = { ...atual, ovr, delta, batalha: motivo };

    const novosAnosSuspensao = Math.max(0, p.anosSuspensao - 1);
    const novoStatus = novosAnosSuspensao === 0 ? null : p.status;

    const texto = estaSuspenso
      ? `Você cumpriu 1 ano de suspensão oficial. ${novosAnosSuspensao === 0 ? "Você está liberado para rimar no próximo ano!" : ""}`
      : "Você ficou um ano fora das batalhas.";

    setMsg(texto);
    avancarAno({
      ...p,
      ovr,
      anosSuspensao: novosAnosSuspensao,
      status: novoStatus,
      historico: [...p.historico.filter((h) => h.idade !== p.idade), ano],
      log: [texto, ...p.log].slice(0, 30),
    });
  }

  function responderEvento(aceitou: boolean) {
    if (!evento) return;

    if (!aceitou) {
      setMsg("Você preferiu não fazer nada.");
      setEvento(null);
      setSorteio(null);
      return;
    }

    const ok = Math.random() < evento.proposta.chance;
    const cons = ok ? evento.proposta.bom : evento.proposta.ruim;

    setSorteio({ ok, terminou: false });

    timerRef.current = window.setTimeout(() => {
      const ovr = Math.max(30, Math.min(99, p.ovr + cons.delta));
      const anosSuspensao = cons.suspensaoAnos ? cons.suspensaoAnos : p.anosSuspensao;
      const status = cons.novoStatus !== undefined ? cons.novoStatus : p.status;
      const resultado = `${ok ? "DEU BOM" : "DEU RUIM"}: ${cons.texto} (OVR ${cons.delta >= 0 ? "+" : ""}${cons.delta})`;

      setP({
        ...p,
        ovr,
        anosSuspensao,
        status,
        log: [resultado, ...p.log].slice(0, 30),
      });
      setMsg(resultado);
      setSorteio({ ok, terminou: true });

      // Se comprou vaga na seletiva e deu bom, abre o popup da seletiva imediatamente
      if (evento.proposta.ehCompraDeVaga && ok) {
        const nivelSeletiva = clamp(Math.round(ovr * 0.93), 42, 76);
        const simulacao = simularFasesTorneio(ovr, nivelSeletiva);
        const anoPendente: Ano = {
          ...atual,
          ovr,
          delta: ovr - p.ovr,
          batalha: p.batalhaAtualNome ? `${p.batalhaAtualNome} (Vaga Comprada)` : "Seletiva Local (Vaga)",
        };
        setEvento(null);
        setSorteio(null);
        setCircuitoModal({
          etapa: "seletiva",
          batalhaNome: p.batalhaAtualNome ? `${p.batalhaAtualNome} (Vaga Comprada)` : "Seletiva Local",
          uf: p.uf,
          nivel: nivelSeletiva,
          emAndamento: false,
          faseEmDisputaIndex: 0,
          revelandoResultadoFase: false,
          fases: simulacao.fases,
          campeao: simulacao.campeao,
          concluida: false,
          anoPendente,
        });
      }
    }, 550);
  }

  const inicio = Math.min(p.idade, ...p.historico.map((h) => h.idade));
  const idades = Array.from({ length: 25 }, (_, i) => inicio + i).filter((i) => i <= 40);
  const est = ESTADOS.find((e) => e[0] === p.uf)?.[1];

  return (
    <main className="grid min-h-screen gap-3 p-3 md:p-4 lg:grid-cols-[minmax(0,390px)_1fr] lg:content-start xl:grid-cols-[minmax(0,420px)_1fr]">
      {/* PAINEL ESQUERDO - INFO MC */}
      <section className="panel flex flex-col p-3.5 md:p-4 order-1 lg:order-none lg:col-start-1 lg:row-start-1">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <button onClick={onBack} className="text-xs font-bold text-muted-foreground underline hover:text-foreground">
              ← Voltar
            </button>
            <div className="flex items-center gap-3">
              <button onClick={onAposentar} className="text-xs font-bold text-amber-400 underline hover:text-amber-300">
                Aposentar-se
              </button>
              <button onClick={onReset} className="text-xs font-bold text-muted-foreground underline hover:text-foreground">
                Nova carreira
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div
              className={`ovr relative overflow-hidden shrink-0 transition-colors duration-300 ${displayOvr > 90
                ? "!bg-purple-600 !text-white !border-purple-300/60 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                : displayOvr >= 86
                  ? "!bg-cyan-400 !text-black !border-cyan-200/60"
                  : displayOvr >= 78
                    ? "!bg-emerald-500 !text-black !border-emerald-300/60"
                    : displayOvr >= 74
                      ? "!bg-slate-300 !text-black !border-white/70"
                      : displayOvr >= 65
                        ? "!bg-amber-400 !text-black !border-amber-200/60"
                        : ""
                }`}
            >
              <span className="text-[10px] font-bold opacity-80">OVR</span>
              <span className="text-3xl md:text-4xl font-black leading-none">{displayOvr}</span>
              {ovrAnimDelta !== null && (
                <span
                  className={`absolute right-1 top-1 animate-bounce text-[10px] font-black ${ovrAnimDelta > 0 ? "text-success" : "text-destructive"
                    }`}
                >
                  {ovrAnimDelta > 0 ? `+${ovrAnimDelta}` : ovrAnimDelta}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                <img src={flag(p.uf)} alt={est} className="h-3.5 w-5 rounded-sm object-cover" /> {p.uf}
              </div>
              <h2 className="truncate text-xl font-black">{p.nome}</h2>
              <button
                type="button"
                onClick={() => setMostrarVelocidade((v) => !v)}
                className="mt-1 inline-flex items-center gap-1 rounded border border-border bg-secondary/70 px-2 py-0.5 text-[10px] font-bold text-foreground hover:bg-secondary transition"
              >
                Selecionar velocidade {mostrarVelocidade ? "▲" : "▼"}
              </button>
              {mostrarVelocidade && (
                <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {(p.nacionaisGanhos >= 1
                    ? (["seletiva", "regional", "estadual", "nacional"] as const)
                    : (["seletiva", "regional", "estadual"] as const)
                  ).map((etapa) => {
                    const direto = modoTorneio[etapa] === "direto";
                    return (
                      <div
                        key={etapa}
                        className="flex flex-col gap-1 rounded-md border border-border bg-card/80 p-1.5 shadow-sm"
                      >
                        <span className="text-[10px] font-black capitalize text-foreground">{etapa}</span>
                        <div className="relative flex rounded bg-secondary p-0.5 text-[10px] font-bold">
                          <div
                            className={`absolute bottom-0.5 top-0.5 w-[calc(50%-2px)] rounded bg-primary shadow transition-all duration-200 ease-out ${direto ? "left-[calc(50%+1px)]" : "left-0.5"
                              }`}
                          />
                          <button
                            type="button"
                            onClick={() => setModoTorneio((prev) => ({ ...prev, [etapa]: "batalha" }))}
                            className={`relative z-10 w-1/2 py-0.5 text-center transition-colors duration-150 ${!direto ? "font-black text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                              }`}
                          >
                            Lento
                          </button>
                          <button
                            type="button"
                            onClick={() => setModoTorneio((prev) => ({ ...prev, [etapa]: "direto" }))}
                            className={`relative z-10 w-1/2 py-0.5 text-center transition-colors duration-150 ${direto ? "font-black text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                              }`}
                          >
                            Rápido
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {p.status && (
                <span className="mt-1 inline-block truncate max-w-full rounded bg-destructive/20 px-1.5 py-0.5 text-[10px] font-bold text-destructive">
                  {p.status}
                </span>
              )}
              {p.vacilosBatalhaAtual > 0 && p.batalhaAtualNome && (
                <span className="ml-1 mt-1 inline-block rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                  Atrito com {p.batalhaAtualNome}: {p.vacilosBatalhaAtual}/3
                </span>
              )}
            </div>

            <div className="text-right shrink-0">
              <div className="text-[10px] font-bold text-muted-foreground">IDADE</div>
              <div className="text-2xl md:text-3xl font-black">{p.idade}</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-4 border-y border-border py-2 text-center">
            {[
              ["BATALHAS", displayTot.b],
              ["TWOLALAS", displayTot.two],
              ["FOLINHAS", displayTot.f],
              ["TAÇAS", displayTot.t],
            ].map(([l, v]) => (
              <div key={l}>
                <div className="text-[9px] font-bold text-muted-foreground">{l}</div>
                <div className="text-lg font-black">{v}</div>
              </div>
            ))}
          </div>

          {msg && <p className="mt-3 rounded-md border-l-4 border-primary bg-secondary p-2.5 text-xs">{msg}</p>}

          {(() => {
            const r = checarRitmoEnfrentamento(p);
            return r.alertaConforto ? (
              <div className="mt-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-2.5 text-xs text-amber-300">
                <span className="font-bold">⚠️ Zona de Conforto:</span> {r.alertaConforto}
              </div>
            ) : null;
          })()}

          {/* CARD DA PROPOSTA EXTERNA */}
          {propostaExterna && (
            <div className="mt-3 rounded-lg border-2 border-primary bg-card p-3 animate-in fade-in duration-200">
              <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary uppercase">
                Proposta Externa
              </span>
              <h4 className="text-sm font-black mt-1">Seletiva da {propostaExterna.prop.batalhaNome}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Nível menor (NV {propostaExterna.prop.nivel}). Se aceitar, sua batalha atual ({p.batalhaAtualNome}) vai considerar traição ({p.vacilosBatalhaAtual + 1}/3 vacilos).
              </p>
              <div className="mt-3 flex gap-2">
                <button onClick={aceitarPropostaExterna} className="btn-main text-xs flex-1 py-1.5">
                  Aceitar disputa externa
                </button>
                <button onClick={recusarPropostaExterna} className="btn-ghost text-xs py-1.5">
                  Recusar
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* PAINEL ESQUERDO INFERIOR (NO CELULAR FICA ABAIXO DA TABELA) */}
      <section className="panel p-3 md:p-4 order-3 lg:order-none lg:col-start-1 lg:row-start-2">
        {evento ? (
          <div className="mt-4" aria-live="polite">
            <h3 className="text-lg font-black">{evento.titulo}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{evento.texto}</p>

            {sorteio ? (
              <div className="mt-3">
                {!sorteio.terminou ? (
                  <div className="flex h-20 items-center justify-center rounded-lg border border-border bg-card px-3 text-center">
                    <p className="text-xs font-bold text-muted-foreground">Avaliando a cena...</p>
                  </div>
                ) : (
                  <div className={`rounded-lg border-2 p-3 ${sorteio.ok ? "border-success bg-success/10" : "border-destructive bg-destructive/10"}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-black ${sorteio.ok ? "text-success" : "text-destructive"}`}>
                        {sorteio.ok ? "DEU BOM" : "DEU RUIM"}
                      </span>
                      <span className={`text-base font-black ${sorteio.ok ? "text-success" : "text-destructive"}`}>
                        {sorteio.ok ? `OVR +${evento.proposta.bom.delta}` : `OVR ${evento.proposta.ruim.delta}`}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-bold text-foreground">
                      {sorteio.ok ? evento.proposta.bom.texto : evento.proposta.ruim.texto}
                    </p>
                    {!sorteio.ok && evento.proposta.ruim.suspensaoAnos && (
                      <p className="mt-1 text-[11px] font-bold text-destructive">
                        ⚠️ Suspenso por {evento.proposta.ruim.suspensaoAnos} ano.
                      </p>
                    )}
                    <button
                      onClick={() => {
                        setEvento(null);
                        setSorteio(null);
                      }}
                      className="mt-3 w-full rounded-lg bg-foreground px-3 py-2 text-xs font-bold text-background"
                    >
                      Continuar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-3 grid gap-2">
                <button
                  onClick={() => responderEvento(true)}
                  className="card p-2.5 text-left transition hover:border-primary"
                >
                  <span className="block font-black text-sm">{evento.proposta.acao}</span>
                  <span className="mt-0.5 block text-[11px] font-bold text-muted-foreground">
                    {Math.round(evento.proposta.chance * 100)}% de chance
                  </span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] font-black">
                    <span className="rounded bg-success/15 px-1.5 py-0.5 text-success">
                      Bom: +{evento.proposta.bom.delta}
                    </span>
                    <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-destructive">
                      Ruim: {evento.proposta.ruim.delta}
                      {evento.proposta.ruim.suspensaoAnos ? ` + Suspensão` : ""}
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => responderEvento(false)}
                  className="card p-2.5 text-left text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  Não fazer nada <span className="text-[10px] opacity-75">— sem risco</span>
                </button>
              </div>
            )}
          </div>
        ) : estaSuspenso ? (
          <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3">
            <h3 className="text-sm font-black text-destructive">Suspenso neste ano</h3>
            <p className="mt-0.5 text-xs text-foreground">
              Impedido de disputar batalhas por 1 temporada. {p.status ? `Motivo: ${p.status}.` : ""}
            </p>
            <button onClick={pularAno} className="btn-main mt-3 w-full text-xs">
              Cumprir suspensão este ano
            </button>
          </div>
        ) : (
          <div className="mt-1">
            <h3 className="text-sm sm:text-base font-black">Escolha sua batalha do ano</h3>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground">Ao escolher, a temporada inteira é simulada de uma vez.</p>
            <div className="mt-2 grid gap-1">
              {ofertas.map((b) => {
                const ehAtual = b.nome === p.batalhaAtualNome;
                return (
                  <button
                    key={b.id}
                    onClick={() => escolherBatalha(b)}
                    className={`card flex items-center justify-between p-2 sm:p-2.5 text-left transition ${b.mudancaEstado
                      ? "border-amber-500/70 bg-amber-500/10 hover:border-amber-500"
                      : ehAtual
                        ? "border-primary bg-primary/10"
                        : ""
                      }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-black">{b.nome}</span>
                        {ehAtual && (
                          <span className="rounded bg-primary px-1.5 py-0.2 text-[9px] font-bold text-primary-foreground">
                            Sua batalha atual
                          </span>
                        )}
                        {b.mudancaEstado && (
                          <span className="rounded bg-amber-500/25 text-amber-300 border border-amber-500/50 px-1.5 py-0.2 text-[9px] font-bold">
                            ✈️ Mudar para {b.uf}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        {b.uf && <img src={flag(b.uf)} alt={b.uf} className="h-2.5 w-4 object-cover rounded-sm inline-block" />}
                        <span>{b.uf || p.uf}</span>
                      </div>
                    </div>
                    <span className={`rounded px-2 py-0.5 text-xs font-black ${b.nivel > p.ovr ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                      NV {b.nivel}
                    </span>
                  </button>
                );
              })}
              <button onClick={pularAno} className="mt-1 text-xs text-muted-foreground underline hover:text-foreground">
                Não rimar neste ano
              </button>
            </div>
          </div>
        )}
      </section>

      {/* TABELA DE HISTÓRICO */}
      <section
        ref={tabelaRef}
        className="panel overflow-x-auto max-h-[28vh] overflow-y-auto lg:max-h-none lg:overflow-y-visible p-2.5 sm:p-3 md:p-4 order-2 lg:order-none lg:col-start-2 lg:row-start-1 lg:row-span-2"
      >
        <table className="w-full text-[10px] sm:text-xs md:text-sm">
          <thead>
            <tr className="text-left text-[9px] sm:text-[10px] font-bold text-muted-foreground">
              <th className="pb-1.5 px-1.5">IDADE</th>
              <th className="pb-1.5 px-1.5">BATALHA DO ANO</th>
              <th className="pb-1.5 px-1.5 text-center">OVR</th>
              <th className="pb-1.5 px-1.5 text-center">BATALHAS</th>
              <th className="pb-1.5 px-1.5 text-center">TWOLALAS</th>
              <th className="pb-1.5 px-1.5 text-center">FOLINHAS</th>
              <th className="pb-1.5 px-1.5 text-center">TAÇAS</th>
            </tr>
          </thead>
          <tbody>
            {idades.map((i) => {
              const h = p.historico.find((x) => x.idade === i) ?? (i === p.idade ? atual : null);
              const animando = i === anoAnimando;
              return (
                <tr
                  key={i}
                  ref={i === p.idade ? linhaAtualRef : undefined}
                  className={`transition-colors duration-500 ${animando ? "bg-primary/20 animate-pulse" : i === p.idade ? "bg-secondary" : ""
                    }`}
                >
                  <td className="py-1 px-1.5 font-bold text-muted-foreground">{i}</td>
                  {h ? (
                    <>
                      <td className="py-1 pr-2 font-bold">
                        <span className="flex items-center gap-1.5 flex-wrap">
                          <img src={flag(h.uf)} alt="" className="h-2.5 w-4 shrink-0 object-cover" />
                          <span>{h.batalha}</span>
                          {h.seletiva?.campeao && (
                            <span className="rounded bg-primary/20 px-1 py-0.2 text-[9px] text-primary font-sans">
                              Seletiva
                            </span>
                          )}
                          {h.regional?.campeao && (
                            <span className="rounded bg-sky-500/20 px-1 py-0.2 text-[9px] text-sky-400 font-sans">
                              Regional
                            </span>
                          )}
                          {h.estadual?.campeao && (
                            <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] text-amber-300 font-sans">
                              🏆 Estadual
                            </span>
                          )}
                          {h.nacional?.campeao && (
                            <span className="rounded bg-yellow-400/20 px-1 py-0.2 text-[9px] text-yellow-300 font-sans font-black border border-yellow-500/40">
                              👑 NACIONAL
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="rounded bg-primary px-1.5 py-0.2 font-black text-primary-foreground">{h.ovr}</span>
                      </td>
                      <td className="text-center font-sans">{h.batalhas}</td>
                      <td className="text-center font-sans">{h.twolalas}</td>
                      <td className="text-center font-sans">{h.folinhas}</td>
                      <td className="text-center font-sans font-bold text-amber-400">{h.tacas}</td>
                    </>
                  ) : (
                    <td colSpan={6} />
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* POPUP / MODAL DO CIRCUITO COM SUSPENSE FASE A FASE */}
      {circuitoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 md:p-4 backdrop-blur-sm">
          <div
            className={`panel max-w-md w-full p-4 md:p-5 animate-in fade-in zoom-in-95 duration-200 border-2 ${circuitoModal.etapa === "estadual"
              ? "border-amber-500 bg-amber-950/20 shadow-[0_0_25px_rgba(245,158,11,0.2)]"
              : circuitoModal.etapa === "regional"
                ? "border-sky-500 bg-sky-950/20"
                : "border-primary"
              }`}
          >
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2">
                {circuitoModal.etapa === "estadual" && (
                  <img src={flag(circuitoModal.uf)} alt={circuitoModal.uf} className="h-6 w-9 rounded object-cover shadow" />
                )}
                <div>
                  <span
                    className={`text-[9px] font-sans font-bold uppercase tracking-widest ${circuitoModal.etapa === "estadual"
                      ? "text-amber-400"
                      : circuitoModal.etapa === "regional"
                        ? "text-sky-400"
                        : "text-primary"
                      }`}
                  >
                    Circuito do Nacional ·{" "}
                    {circuitoModal.etapa === "seletiva" && "Etapa 1"}
                    {circuitoModal.etapa === "regional" && "Etapa 2"}
                    {circuitoModal.etapa === "estadual" && "Etapa 3"}
                  </span>
                  <h2 className="text-xl font-black text-foreground">
                    {circuitoModal.etapa === "seletiva" && `Seletiva — ${circuitoModal.batalhaNome}`}
                    {circuitoModal.etapa === "regional" && `Regional — ${circuitoModal.uf}`}
                    {circuitoModal.etapa === "estadual" && `Campeonato Estadual (${circuitoModal.uf})`}
                  </h2>
                </div>
              </div>

              <span
                className={`rounded px-2 py-0.5 font-sans text-[11px] font-bold ${circuitoModal.etapa === "estadual"
                  ? "bg-amber-500/20 text-amber-300"
                  : circuitoModal.etapa === "regional"
                    ? "bg-sky-500/20 text-sky-300"
                    : "bg-primary/20 text-primary"
                  }`}
              >
                NV {circuitoModal.nivel}
              </span>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              {circuitoModal.etapa === "seletiva" && "Se vencer a Seletiva, você garante vaga na Regional!"}
              {circuitoModal.etapa === "regional" && "Se vencer a Regional, você avança para o Estadual!"}
              {circuitoModal.etapa === "estadual" && "Elite máxima do estado. O campeão garante vaga no Duelo Nacional!"}
            </p>
            {circuitoModal.penalidadeRitmo && circuitoModal.penalidadeRitmo > 0 ? (
              <p className="mt-1 text-[11px] font-bold text-amber-400">
                -{circuitoModal.penalidadeRitmo} OVR por competir em batalha muito fraca, não tá pronto pro enfrentamento
              </p>
            ) : null}

            {!circuitoModal.emAndamento ? (
              <div className="mt-4 flex flex-col gap-2">
                <button onClick={iniciarSuspenseTorneio} className="btn-main text-sm w-full">
                  Disputar {circuitoModal.etapa === "seletiva" ? "Seletiva" : circuitoModal.etapa === "regional" ? "Regional" : "Estadual"}
                </button>
                <div className="flex items-center justify-between pt-1">
                  <button onClick={pularResultadoCircuito} className="text-xs font-bold text-foreground underline hover:text-primary">
                    Pular para o resultado
                  </button>
                  <button onClick={() => fecharCircuitoModal(false)} className="text-xs text-muted-foreground underline hover:text-foreground">
                    Abrir mão
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {circuitoModal.fases.slice(0, circuitoModal.faseEmDisputaIndex + 1).map((f, idx) => {
                  const ehAFaseAtual = idx === circuitoModal.faseEmDisputaIndex;
                  const aindaRimando = ehAFaseAtual && !circuitoModal.revelandoResultadoFase;

                  return (
                    <div
                      key={f.nome}
                      className={`animate-in fade-in slide-in-from-bottom-2 duration-200 rounded p-2 text-xs border ${aindaRimando
                        ? "border-border bg-card animate-pulse"
                        : f.passou
                          ? "border-success/40 bg-success/10"
                          : "border-destructive/40 bg-destructive/10"
                        }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{f.nome}</span>
                        {aindaRimando ? (
                          <span className="text-[11px] text-muted-foreground font-sans">Bate-volta...</span>
                        ) : (
                          <span className={f.passou ? "text-success font-black" : "text-destructive font-black"}>
                            {f.passou ? `PASSOU (${f.placar})` : `ELIMINADO (${f.placar})`}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {!circuitoModal.concluida && (
                  <div className="flex items-center justify-end pt-1">
                    <button onClick={pularResultadoCircuito} className="text-xs font-bold text-foreground underline hover:text-primary">
                      Pular para o resultado
                    </button>
                  </div>
                )}

                {circuitoModal.concluida && (
                  <div className="mt-4 pt-2.5 border-t border-border animate-in fade-in duration-300">
                    {circuitoModal.campeao ? (
                      <div
                        className={`rounded-lg p-3 text-center border ${circuitoModal.etapa === "estadual"
                          ? "border-amber-500 bg-amber-500/20 text-amber-200"
                          : circuitoModal.etapa === "regional"
                            ? "border-sky-500 bg-sky-500/20 text-sky-200"
                            : "border-primary bg-primary/20 text-foreground"
                          }`}
                      >
                        <span className="text-xl">🏆</span>
                        <h3 className="text-sm font-black mt-0.5">
                          {circuitoModal.etapa === "seletiva" && "CAMPEÃO DA SELETIVA!"}
                          {circuitoModal.etapa === "regional" && "CAMPEÃO DA REGIONAL!"}
                          {circuitoModal.etapa === "estadual" && `CAMPEÃO ESTADUAL DE ${circuitoModal.uf}!`}
                        </h3>
                        <p className="text-[11px] opacity-90 mt-0.5">
                          {circuitoModal.etapa === "seletiva" && "Vaga garantida na Regional!"}
                          {circuitoModal.etapa === "regional" && "Vaga garantida no Campeonato Estadual!"}
                          {circuitoModal.etapa === "estadual" && "Vaga garantida no Duelo Nacional de MCs (+1 Taça)!"}
                        </p>
                      </div>
                    ) : null}

                    {/* SEGUNDA CHANCE NA SELETIVA */}
                    {!circuitoModal.campeao && circuitoModal.segundaChanceOferta ? (
                      <div className="rounded-lg border border-primary/60 bg-primary/10 p-3 text-center mt-2 animate-in fade-in duration-200">
                        <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
                          Segunda Chance
                        </span>
                        <p className="text-xs font-bold text-foreground mt-1">
                          Você recebeu uma segunda chance na Seletiva da {circuitoModal.segundaChanceOferta.batalhaNome}!
                        </p>
                        <div className="mt-2.5 flex gap-2">
                          <button onClick={aceitarSegundaChance} className="btn-main text-xs flex-1 py-1.5">
                            Disputar segunda chance
                          </button>
                          <button onClick={() => fecharCircuitoModal(true)} className="btn-ghost text-xs py-1.5">
                            Encerrar
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {circuitoModal.campeao && circuitoModal.etapa !== "estadual" ? (
                      <button onClick={avancarProximaEtapaCircuito} className="btn-main text-xs w-full mt-3">
                        Avançar para {circuitoModal.etapa === "seletiva" ? "a Regional" : "o Estadual"} →
                      </button>
                    ) : circuitoModal.campeao && circuitoModal.etapa === "estadual" ? (
                      <button
                        onClick={() => fecharCircuitoModal(true)}
                        className="btn-main text-xs w-full mt-3 bg-amber-500 text-black hover:bg-amber-400 font-black shadow-lg shadow-amber-500/20"
                      >
                        Partir para o Duelo Nacional de MCs em BH 🏆 →
                      </button>
                    ) : !circuitoModal.segundaChanceOferta ? (
                      <button onClick={() => fecharCircuitoModal(true)} className="btn-main text-xs w-full mt-3">
                        Continuar carreira
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* POPUP / MODAL DO DUELO DE MCS NACIONAL (BELO HORIZONTE / VIADUTO SANTA TEREZA) */}
      {dueloNacional && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2.5 sm:p-4 backdrop-blur-md">
          <div className="relative max-w-xl w-full max-h-[92dvh] overflow-y-auto rounded-2xl border-2 border-amber-500/80 bg-neutral-950 p-3 sm:p-4.5 shadow-[0_0_40px_rgba(245,158,11,0.25)] animate-in fade-in zoom-in-95 duration-200">
            {/* Foto de fundo do Viaduto estilizada e pixelizada */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-15 pixelated-bg mix-blend-luminosity pointer-events-none"
              style={{
                backgroundImage: "url('/duelo-nacional-bg.jpg')",
                filter: "contrast(135%) grayscale(30%)",
              }}
            />
            {/* Overlay gradiente escuro para legibilidade perfeita */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/85 to-neutral-950/40 pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-2.5 sm:gap-3">
              {/* Header do Duelo com Bandeira de Minas Gerais */}
              <div className="flex items-center justify-between border-b border-amber-500/30 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <img
                    src={flag("MG")}
                    alt="Minas Gerais"
                    className="h-6 w-9 rounded object-cover shadow border border-white/20 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] sm:text-[10px] font-sans font-extrabold uppercase tracking-widest text-amber-400">
                        Belo Horizonte · Viaduto Santa Tereza
                      </span>
                      <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[8px] font-bold text-amber-300">
                        32 MCs
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-foreground uppercase tracking-tight">
                      Duelo de MCs Nacional
                    </h2>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-sans text-muted-foreground uppercase">Fase</span>
                  <span className="rounded bg-primary/20 px-1.5 py-0.5 font-sans text-xs font-black text-primary">
                    {dueloNacional.faseAtualIndex + 1}/5
                  </span>
                </div>
              </div>

              {/* Batalha Ativa no Nacional */}
              {(() => {
                const batalha = dueloNacional.batalhas[dueloNacional.faseAtualIndex];
                if (!batalha) return null;

                const roundsRevelados = batalha.rounds.slice(0, dueloNacional.roundReveladoIndex + 1);
                const todosRoundsRevelados = dueloNacional.roundReveladoIndex >= batalha.rounds.length - 1;

                // Placar parcial ou total
                const ptsJogador = roundsRevelados.filter((r) => r.venceu).length;
                const ptsAdversario = roundsRevelados.filter((r) => !r.venceu).length;

                return (
                  <div className="flex flex-col gap-2 sm:gap-2.5">
                    {/* Indicador da Fase */}
                    <div className="flex items-center justify-between bg-card/60 border border-border rounded-lg px-2.5 py-1">
                      <span className="text-xs font-sans font-bold text-amber-300 uppercase">
                        {batalha.faseNome}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-sans">
                        Duelo eliminatório
                      </span>
                    </div>

                    {/* Confronto Card: Você VS Adversário */}
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 sm:gap-2 rounded-xl border border-border/80 bg-secondary/30 p-2 sm:p-3">
                      {/* Lado do Jogador */}
                      <div className="flex items-center gap-2">
                        <div className="ovr !h-10 !w-10 shrink-0 !rounded-lg text-base">
                          <span className="text-xs sm:text-sm font-black">{dueloNacional.anoPendente.ovr}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 flex-wrap">
                            <img src={flag(dueloNacional.anoPendente.uf)} alt={dueloNacional.anoPendente.uf} className="h-3 w-4.5 rounded object-cover shadow" />
                            <span className="font-black text-xs sm:text-sm text-foreground truncate">{p.nome}</span>
                          </div>
                          <span className="text-[9px] font-sans text-primary font-bold">{dueloNacional.anoPendente.uf}</span>
                        </div>
                      </div>

                      {/* Placar Central */}
                      <div className="flex flex-col items-center px-1.5">
                        <span className="text-[9px] font-sans uppercase text-muted-foreground">Placar</span>
                        <div className="flex items-center gap-1 text-base sm:text-lg font-black font-sans">
                          <span className={ptsJogador > ptsAdversario ? "text-success" : ""}>{ptsJogador}</span>
                          <span className="text-muted-foreground">x</span>
                          <span className={ptsAdversario > ptsJogador ? "text-destructive" : ""}>{ptsAdversario}</span>
                        </div>
                      </div>

                      {/* Lado do Adversário */}
                      <div className="flex items-center justify-end gap-2 text-right">
                        <div className="min-w-0">
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            <span className="font-black text-xs sm:text-sm text-foreground truncate">{batalha.adversario.nome}</span>
                            <img src={flag(batalha.adversario.uf)} alt={batalha.adversario.uf} className="h-3 w-4.5 rounded object-cover shadow" />
                          </div>
                          <div className="flex items-center justify-end gap-1">
                            {batalha.adversario.ehLenda && (
                              <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[8px] font-black text-amber-300">
                                LENDA
                              </span>
                            )}
                            {batalha.adversario.campeaoAno && (
                              <span className="rounded bg-yellow-500/20 px-1 py-0.2 text-[8px] font-black text-yellow-300">
                                {batalha.adversario.campeaoAno}
                              </span>
                            )}
                            <span className="text-[9px] font-sans text-muted-foreground">
                              {batalha.adversario.uf}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Exibição dos Rounds Revelados */}
                    <div className="space-y-1.5 my-0.5">
                      {roundsRevelados.map((r) => (
                        <div
                          key={r.numero}
                          className={`animate-in fade-in slide-in-from-bottom-2 duration-200 rounded-lg p-2 text-xs border ${r.venceu
                            ? "border-success/40 bg-success/10 text-success-foreground"
                            : "border-destructive/40 bg-destructive/10 text-destructive-foreground"
                            }`}
                        >
                          <div className="flex items-center justify-between font-black text-[11px] mb-0.5">
                            <span>
                              {r.numero === 1 && "1º Round"}
                              {r.numero === 2 && "2º Round"}
                              {r.numero === 3 && "3º Round"}
                            </span>
                            <span className={r.venceu ? "text-success font-black" : "text-destructive font-black"}>
                              {r.venceu ? "Ponto seu" : `Ponto de ${batalha.adversario.nome}`}
                            </span>
                          </div>
                          <p className="text-[11px] font-medium text-foreground/90">{r.narrativa}</p>
                        </div>
                      ))}
                    </div>

                    {/* Botões de Ação do Round / Batalha */}
                    {!todosRoundsRevelados ? (
                      <button
                        onClick={revelarProximoRoundNacional}
                        className="btn-main text-xs sm:text-sm w-full py-2 font-black uppercase tracking-wider"
                      >
                        {dueloNacional.roundReveladoIndex === -1 && "Rimar 1º Round"}
                        {dueloNacional.roundReveladoIndex === 0 && "Rimar 2º Round"}
                        {dueloNacional.roundReveladoIndex === 1 && "Rimar 3º Round"}
                      </button>
                    ) : (
                      <div className="space-y-2 pt-1">
                        {batalha.venceu ? (
                          <div className="rounded-xl border border-success/50 bg-success/15 p-2 text-center animate-in zoom-in-95 duration-200">
                            <h3 className="font-black text-xs sm:text-sm text-success">
                              VITÓRIA! ({batalha.placar})
                            </h3>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Você superou {batalha.adversario.nome} sob os gritos do Viaduto Santa Tereza!
                            </p>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-destructive/50 bg-destructive/15 p-2 text-center animate-in zoom-in-95 duration-200">
                            <h3 className="font-black text-xs sm:text-sm text-destructive">
                              ELIMINADO ({batalha.placar})
                            </h3>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Sua caminhada parou na {batalha.faseNome}. A cena nacional respeita sua representatividade!
                            </p>
                          </div>
                        )}

                        {batalha.venceu ? (
                          dueloNacional.faseAtualIndex < FASES_DUELO_NACIONAL.length - 1 ? (
                            <button
                              onClick={avancarProximaFaseNacional}
                              className="btn-main text-xs sm:text-sm w-full py-2 font-black uppercase tracking-wider"
                            >
                              Avançar para {FASES_DUELO_NACIONAL[dueloNacional.faseAtualIndex + 1]}
                            </button>
                          ) : (
                            <div className="text-center space-y-2">
                              <div className="rounded-xl border-2 border-yellow-500 bg-yellow-500/20 p-3 text-center">
                                <span className="text-2xl">🏆</span>
                                <h3 className="text-base sm:text-lg font-black text-yellow-300 uppercase tracking-wider mt-0.5">
                                  CAMPEÃO DO DUELO DE MCS NACIONAL!
                                </h3>
                                <p className="text-[11px] text-yellow-200/90 mt-0.5">
                                  Você colocou seu nome na história do freestyle brasileiro ao lado das maiores lendas do país!
                                </p>
                              </div>
                              <button
                                onClick={fecharDueloNacional}
                                className="btn-main text-xs sm:text-sm w-full py-2 font-black uppercase tracking-wider bg-yellow-500 text-black hover:bg-yellow-400"
                              >
                                Comemorar e Concluir Ano Histórico
                              </button>
                            </div>
                          )
                        ) : (
                          <button
                            onClick={fecharDueloNacional}
                            className="w-full py-1.5 rounded-lg bg-secondary text-xs font-bold text-foreground hover:bg-secondary/80 transition"
                          >
                            Concluir Temporada no Nacional
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Faixa compacta dos 32 MCs do Duelo */}
              <div className="border-t border-border/60 pt-2">
                <div className="flex items-center justify-between text-[9px] font-sans text-muted-foreground mb-1 uppercase">
                  <span>Chave dos 32 MCs</span>
                  <span>BH · Viaduto Santa Tereza</span>
                </div>
                <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto pr-1">
                  <span className="rounded bg-primary px-1.5 py-0.2 text-[8px] sm:text-[9px] font-black text-primary-foreground">
                    {p.nome} ({dueloNacional.anoPendente.uf})
                  </span>
                  {dueloNacional.participantes.slice(0, 31).map((m) => (
                    <span
                      key={m.nome}
                      className="rounded bg-secondary/70 border border-border/50 px-1 py-0.2 text-[8px] sm:text-[9px] font-bold text-muted-foreground flex items-center gap-0.5"
                    >
                      <span>{m.nome}</span>
                      <span className="opacity-70 text-[7px] sm:text-[8px]">({m.uf})</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP DE MUDANÇA DE ESTADO */}
      {propostaMudancaEstado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="panel max-w-md w-full p-5 border-amber-500 animate-in fade-in zoom-in-95 duration-200 shadow-[0_0_30px_rgba(245,158,11,0.25)]">
            <div className="flex items-center gap-2.5 mb-2">
              <img
                src={flag(propostaMudancaEstado.uf || p.uf)}
                alt={propostaMudancaEstado.uf || p.uf}
                className="h-6 w-9 rounded object-cover shadow border border-white/20 shrink-0"
              />
              <div>
                <span className="text-[9px] font-sans uppercase tracking-widest text-amber-400 font-bold">
                  Proposta de Outro Estado
                </span>
                <h3 className="text-base sm:text-lg font-black text-foreground">Mudança de Estado</h3>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              Você recebeu uma proposta oficial para disputar a temporada na{" "}
              <strong className="text-foreground">{propostaMudancaEstado.nome}</strong> ({propostaMudancaEstado.local}).
            </p>

            <div className="rounded-lg bg-amber-500/15 border border-amber-500/30 p-3 my-3 text-xs text-amber-200">
              ⚠️ <strong>Atenção:</strong> Ao aceitar essa proposta, você passará a representar o estado de{" "}
              <strong>
                {ESTADOS.find((e) => e[0] === (propostaMudancaEstado.uf || p.uf))?.[1] ?? propostaMudancaEstado.uf} (
                {propostaMudancaEstado.uf || p.uf})
              </strong>{" "}
              nas Seletivas, no Campeonato Estadual e no Duelo Nacional de MCs!
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  const b = propostaMudancaEstado;
                  const novaUf = b.uf || p.uf;
                  setPropostaMudancaEstado(null);
                  const playerComNovoEstado: Player = { ...p, uf: novaUf };
                  setP(playerComNovoEstado);
                  jogar(b, playerComNovoEstado);
                }}
                className="btn-main text-xs py-2 w-full font-black bg-amber-500 text-black hover:bg-amber-400"
              >
                Aceitar proposta e representar {propostaMudancaEstado.uf || p.uf}
              </button>
              <button
                onClick={() => setPropostaMudancaEstado(null)}
                className="text-xs text-muted-foreground underline hover:text-foreground text-center py-1"
              >
                Recusar e permanecer em {p.uf}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Aposentadoria({ p, onNew }: { p: Player; onNew: () => void }) {
  const tot = p.historico.reduce(
    (a, h) => ({ b: a.b + h.batalhas, two: a.two + (h.twolalas ?? 0), f: a.f + h.folinhas, t: a.t + h.tacas }),
    { b: 0, two: 0, f: 0, t: 0 },
  );
  const maiorOvr = Math.max(p.ovr, ...p.historico.map((h) => h.ovr));

  return (
    <main className="grain flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <div className="panel max-w-xl w-full p-6 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
        <span className="text-4xl">👑</span>
        <span className="block mt-2 font-sans text-[11px] font-bold uppercase tracking-widest text-amber-400">
          Carreira Concluída · Lenda da Rima
        </span>
        <h1 className="text-3xl font-black mt-1">{p.nome} ({p.uf})</h1>
        <p className="text-xs text-muted-foreground mt-1">Aposentado aos {p.idade} anos</p>

        <div className="my-5 grid grid-cols-4 gap-2 border-y border-border py-3 text-center">
          <div><div className="text-[10px] text-muted-foreground">MAIOR OVR</div><div className="text-2xl font-black text-primary">{maiorOvr}</div></div>
          <div><div className="text-[10px] text-muted-foreground">BATALHAS</div><div className="text-2xl font-black">{tot.b}</div></div>
          <div><div className="text-[10px] text-muted-foreground">FOLINHAS</div><div className="text-2xl font-black">{tot.f}</div></div>
          <div><div className="text-[10px] text-muted-foreground">TAÇAS</div><div className="text-2xl font-black text-amber-400">{tot.t}</div></div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold mb-5">
          <div className="rounded border border-border p-2">Seletivas: {p.seletivasGanhas}</div>
          <div className="rounded border border-border p-2">Regionais: {p.regionaisGanhas}</div>
          <div className="rounded border border-border p-2 text-amber-400">Estaduais: {p.estaduaisGanhos}</div>
          <div className="rounded border border-yellow-500/50 bg-yellow-500/10 p-2 text-yellow-300">Nacionais: {p.nacionaisGanhos ?? 0}</div>
        </div>

        <button onClick={onNew} className="btn-main w-full text-base">
          Começar carreira
        </button>
      </div>
    </main>
  );
}
