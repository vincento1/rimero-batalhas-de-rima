import { afterEach, describe, expect, it, vi } from "vitest";
import { batalhar, type Battle, type Player } from "@/lib/game";

const player = { ovr: 50 } as Player;
const battle: Battle = { id: "teste", nome: "Batalha Teste", nivel: 50, local: "São Paulo" };

afterEach(() => vi.restoreAllMocks());

describe("estatísticas da batalha anual", () => {
  it("conta cada duelo ganho como folinha, inclusive a final", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const resultado = batalhar(player, battle);
    expect(resultado).toMatchObject({ batalhas: 3, folinhas: 3, vitorias: 2, tacas: 1, campeao: true });
  });

  it("não conta folinha nem passagem de fase quando perde na estreia", () => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValue(0.999);
    const resultado = batalhar(player, battle);
    expect(resultado).toMatchObject({ batalhas: 1, folinhas: 0, vitorias: 0, tacas: 0, campeao: false });
  });

  it("conta uma passagem e uma folinha ao vencer a estreia e cair na segunda fase", () => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValue(0.999);
    const resultado = batalhar(player, battle);
    expect(resultado).toMatchObject({ batalhas: 2, folinhas: 1, vitorias: 1, tacas: 0, campeao: false });
  });
});
