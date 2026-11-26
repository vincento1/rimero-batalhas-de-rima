import { afterEach, describe, expect, it, vi } from "vitest";
import {
  batalhar,
  calcularEvolucaoAnual,
  chanceVitoria,
  checarRitmoEnfrentamento,
  checarSegundaChanceSeletiva,
  checarSeletiva,
  convites,
  gerarTorneioDueloNacional,
  simularFasesTorneio,
  type Battle,
  type Player,
} from "@/lib/game";

const player = {
  ovr: 50,
  idade: 16,
  potencial: 85,
  picoIdade: 25,
  sorte: 0,
  anosSuspensao: 0,
  vacilosBatalhaAtual: 0,
  batalhasBanidas: [],
  historico: [],
} as unknown as Player;

const battle: Battle = { id: "teste", nome: "Batalha Teste", nivel: 50, local: "São Paulo" };

afterEach(() => vi.restoreAllMocks());

describe("estatísticas da temporada anual", () => {
  it("acumula folinhas limitadas ao número de edições e não gera taças em batalhas normais", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const resultado = batalhar(player, battle, 5);
    expect(resultado).toMatchObject({
      edicoes: 5,
      folinhas: 5,
      tacas: 0,
      campeao: true,
    });
    expect(resultado.twolalas).toBeGreaterThanOrEqual(0);
    expect(resultado.batalhas).toBeGreaterThanOrEqual(5);
  });

  it("garante alta probabilidade de vitória quando o OVR é muito superior (ex: 80 vs 60)", () => {
    const chance = chanceVitoria(80, 60);
    expect(chance).toBe(0.98);
  });

  it("não ganha folinha se cair antes da final nas edições", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999);
    const resultado = batalhar(player, battle, 4);
    expect(resultado).toMatchObject({
      edicoes: 4,
      batalhas: 4,
      folinhas: 0,
      twolalas: 0,
      tacas: 0,
      campeao: false,
    });
  });

  it("oferece permanecer na batalha atual como primeira opção", () => {
    const comBatalha = { ...player, batalhaAtualNome: "Roda do Viaduto" } as Player;
    const opcoes = convites(comBatalha);
    expect(opcoes[0]?.nome).toBe("Roda do Viaduto");
  });
});

describe("circuito do nacional - seletivas, ritmo e segunda chance", () => {
  it("oferece segunda chance na seletiva para MC com bom OVR e tempo de casa", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const mcFiel = {
      ...player,
      ovr: 65,
      historico: [{ batalha: "Batalha Teste" }, { batalha: "Batalha Teste" }],
    } as unknown as Player;
    const sc = checarSegundaChanceSeletiva(mcFiel, "Batalha Teste");
    expect(sc.temSegundaChance).toBe(true);
    expect(sc.batalhaNome).not.toBe("Batalha Teste");
  });

  it("penaliza e gera alerta de conforto após 5 anos em batalhas muito abaixo do nível", () => {
    const mcAcomodado = {
      ...player,
      ovr: 75,
      historico: [
        { batalha: "Batalha Fraca", nivelBatalha: 45, ovr: 68 },
        { batalha: "Batalha Fraca", nivelBatalha: 45, ovr: 70 },
        { batalha: "Batalha Fraca", nivelBatalha: 45, ovr: 72 },
        { batalha: "Batalha Fraca", nivelBatalha: 45, ovr: 74 },
        { batalha: "Batalha Fraca", nivelBatalha: 45, ovr: 75 },
      ],
    } as unknown as Player;

    const ritmo = checarRitmoEnfrentamento(mcAcomodado, 45);
    expect(ritmo.anosEmBatalhaFraca).toBeGreaterThanOrEqual(5);
    expect(ritmo.alertaConforto).toBeDefined();
    expect(ritmo.penalidadeTorneio).toBeGreaterThan(0);
  });

  it("simula as 4 fases do torneio mata-mata com placar detalhado", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const res = simularFasesTorneio(80, 60);
    expect(res.campeao).toBe(true);
    expect(res.fases.length).toBe(4);
    expect(res.fases[0]?.placar).toBe("2-0");
  });

  it("gera o Duelo Nacional com 32 MCs, 5 fases e confrontos com rounds detalhados", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const mcCampeao = {
      ...player,
      nome: "MC Teste",
      uf: "SP",
      ovr: 90,
      nacionaisGanhos: 0,
    } as unknown as Player;
    const anoPendente = {
      idade: 22,
      ovr: 90,
      delta: 2,
      batalha: "Estadual de SP",
      uf: "SP",
      batalhas: 15,
      twolalas: 8,
      folinhas: 12,
      tacas: 1,
    };
    const torneio = gerarTorneioDueloNacional(mcCampeao, anoPendente);
    expect(torneio.participantes.length).toBe(31);
    expect(torneio.batalhas.length).toBe(5);
    expect(torneio.campeao).toBe(true);
    expect(torneio.batalhas[0]?.rounds.length).toBeGreaterThanOrEqual(2);
  });
});
