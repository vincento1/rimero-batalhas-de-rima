import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import logo from "@/assets/rimero-logo.png.asset.json";
import { ESTADOS, SONHOS, flag, convites, batalhar, sortearEvento, rand, type Player, type Battle, type Evento } from "@/lib/game";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "rimero. — carreira de MC de batalha" },
    { name: "description", content: "Simulador de carreira de batalhas de rima no Brasil. Represente seu estado e viva seu sonho." },
    { property: "og:title", content: "rimero. — carreira de MC de batalha" },
    { property: "og:description", content: "Represente seu estado e suba nas batalhas de rima do Brasil." },
  ] }),
  component: App,
});

function App() {
  const [tela, setTela] = useState<"inicio" | "criar" | "jogo">("inicio");
  const [p, setP] = useState<Player | null>(null);
  if (tela === "inicio") return <Inicio onStart={() => setTela("criar")} />;
  if (tela === "criar" || !p) return <Criar onDone={(pl) => { setP(pl); setTela("jogo"); }} />;
  return <Jogo p={p} setP={setP} onReset={() => { setP(null); setTela("inicio"); }} />;
}

function Logo({ small }: { small?: boolean }) {
  return <img src={logo.url} alt="rimero." className={small ? "h-14 w-auto" : "h-64 w-auto md:h-80"} />;
}

function Inicio({ onStart }: { onStart: () => void }) {
  return (
    <main className="grain flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="animate-in fade-in zoom-in-95 duration-700"><Logo /></div>
      <p className="mt-6 max-w-2xl text-lg text-foreground/90">
        faça sua carreira como mc de batalha, com mcs e batalhas brasileiras. represente seu estado, participe do circuito nacional e corra atrás do seu sonho!
      </p>
      <div className="my-6 h-[3px] w-full max-w-3xl bg-primary" />
      <button onClick={onStart} className="btn-main">Iniciar carreira</button>
    </main>
  );
}

function Criar({ onDone }: { onDone: (p: Player) => void }) {
  const [uf, setUf] = useState("SP");
  const [nome, setNome] = useState("");
  const [sonho, setSonho] = useState(SONHOS[0]!);
  const [idade, setIdade] = useState(16);
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-8">
      <div className="flex items-center gap-4"><Logo small /><h1 className="text-3xl font-bold">Monte seu MC</h1></div>
      <div className="my-5 h-[3px] bg-primary" />
      <label className="label">Nome de MC</label>
      <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="MC ..." className="field" maxLength={24} />
      <div className="mt-4 flex items-center gap-4">
        <label className="label !mb-0">Idade</label>
        {[14, 15, 16, 17, 18, 19, 20].map((i) => (
          <button key={i} onClick={() => setIdade(i)} className={`chip ${idade === i ? "chip-on" : ""}`}>{i}</button>
        ))}
      </div>
      <label className="label mt-6">Estado que vai representar</label>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7">
        {ESTADOS.map(([s, n]) => (
          <button key={s} onClick={() => setUf(s)} title={n} className={`card flex flex-col items-center gap-1 p-2 ${uf === s ? "card-on" : ""}`}>
            <img src={flag(s)} alt={n} className="h-8 w-12 rounded-sm object-cover" />
            <span className="text-sm font-bold">{s}</span>
          </button>
        ))}
      </div>
      <label className="label mt-6">Seu sonho</label>
      <div className="grid gap-2 sm:grid-cols-3">
        {SONHOS.map((s) => (
          <button key={s} onClick={() => setSonho(s)} className={`card p-4 text-left font-bold ${sonho === s ? "card-on" : ""}`}>{s}</button>
        ))}
      </div>
      <button disabled={!nome.trim()} onClick={() => onDone({ nome: nome.trim(), uf, sonho, idade, ovr: rand(48, 55), hype: 0, mes: 0, log: [], historico: [] })} className="btn-main mt-8 disabled:opacity-40">
        Começar
      </button>
    </main>
  );
}

const MESES_POR_ANO = 4;

function Jogo({ p, setP, onReset }: { p: Player; setP: (p: Player) => void; onReset: () => void }) {
  const [ofertas, setOfertas] = useState<Battle[]>(() => convites(p));
  const [evento, setEvento] = useState<Evento | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const atual = p.historico.find((h) => h.idade === p.idade) ?? { idade: p.idade, ovr: p.ovr, batalhas: 0, vitorias: 0, folinhas: 0, titulos: 0 };
  const tot = p.historico.reduce((a, h) => ({ b: a.b + h.batalhas, v: a.v + h.vitorias, f: a.f + h.folinhas, t: a.t + h.titulos }), { b: 0, v: 0, f: 0, t: 0 });

  function avancar(np: Player) {
    let mes = np.mes + 1, idade = np.idade;
    if (mes >= MESES_POR_ANO) { mes = 0; idade++; }
    const next = { ...np, mes, idade };
    setP(next);
    setOfertas(convites(next));
    if (Math.random() < 0.35) setEvento(sortearEvento());
  }

  function jogar(b: Battle) {
    const res = batalhar(p, b);
    const ano = { ...atual, batalhas: atual.batalhas + res.batalhas, vitorias: atual.vitorias + res.vitorias, folinhas: atual.folinhas + res.folinhas, titulos: atual.titulos + (res.campeao ? 1 : 0) };
    const ovr = Math.min(99, p.ovr + res.ganho);
    ano.ovr = ovr;
    const texto = res.campeao ? `🏆 Campeão da ${b.nome}! ${res.vitorias} vitórias${res.folinhas ? " e uma folinha" : ""}.` : `Caiu na ${res.batalhas}ª fase da ${b.nome} (${res.vitorias} vitórias).`;
    setMsg(texto);
    avancar({ ...p, ovr, historico: [...p.historico.filter((h) => h.idade !== p.idade), ano], log: [texto, ...p.log].slice(0, 30) });
  }

  function escolher(o: Evento["opcoes"][number] | null) {
    if (!o) { setMsg("Você deixou pra lá. Nada mudou."); setEvento(null); return; }
    const ok = Math.random() < o.chance;
    const [d, h, t] = ok ? o.bom : o.ruim;
    const ovr = Math.max(30, Math.min(99, p.ovr + d));
    const ano = { ...atual, ovr };
    setP({ ...p, ovr, hype: p.hype + h, historico: [...p.historico.filter((x) => x.idade !== p.idade), ano], log: [`${ok ? "✔" : "✖"} ${t}`, ...p.log].slice(0, 30) });
    setMsg(`${t} (OVR ${d >= 0 ? "+" : ""}${d})`);
    setEvento(null);
  }

  const inicio = Math.min(p.idade, ...p.historico.map((h) => h.idade));
  const idades = Array.from({ length: 24 }, (_, i) => inicio + i);
  const est = ESTADOS.find((e) => e[0] === p.uf)?.[1];

  return (
    <main className="grid min-h-screen gap-4 p-4 lg:grid-cols-[minmax(0,460px)_1fr]">
      <section className="panel p-5">
        <div className="flex items-start gap-4">
          <div className="ovr"><span className="text-xs font-bold opacity-80">OVR</span><span className="text-5xl font-black leading-none">{p.ovr}</span></div>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm font-bold">
              <img src={flag(p.uf)} alt={est} className="h-4 w-6 rounded-sm object-cover" /> {p.uf}
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">hype {p.hype}</span>
            </div>
            <h2 className="mt-1 text-2xl font-black">{p.nome}<span className="text-primary">.</span></h2>
            <p className="text-xs text-muted-foreground">sonho: {p.sonho}</p>
          </div>
          <div className="text-right"><div className="text-xs font-bold text-muted-foreground">IDADE</div><div className="text-3xl font-black">{p.idade}</div></div>
        </div>
        <div className="mt-5 grid grid-cols-4 border-y border-border py-3 text-center">
          {[["BATALHAS", tot.b], ["VITÓRIAS", tot.v], ["FOLINHAS", tot.f], ["TÍTULOS", tot.t]].map(([l, v]) => (
            <div key={l}><div className="text-[10px] font-bold text-muted-foreground">{l}</div><div className="text-xl font-black">{v}</div></div>
          ))}
        </div>
        {msg && <p className="mt-4 rounded-lg border-l-4 border-primary bg-secondary p-3 text-sm">{msg}</p>}

        {evento ? (
          <div className="mt-5">
            <h3 className="text-xl font-black">{evento.titulo}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{evento.texto}</p>
            <div className="mt-3 grid gap-2">
              {evento.opcoes.map((o) => <button key={o.label} onClick={() => escolher(o)} className="card p-3 text-left font-bold">{o.label} <span className="text-xs font-normal text-muted-foreground">— pode dar bom ou ruim</span></button>)}
              <button onClick={() => escolher(null)} className="card p-3 text-left font-bold">Não fazer nada <span className="text-xs font-normal text-muted-foreground">— sem efeito</span></button>
            </div>
          </div>
        ) : (
          <div className="mt-5">
            <h3 className="text-xl font-black">Convites de batalha</h3>
            <p className="text-sm text-muted-foreground">As rodas de {est} querem te ver no microfone. Escolha onde rimar.</p>
            <div className="mt-3 grid gap-2">
              {ofertas.map((b) => (
                <button key={b.id} onClick={() => jogar(b)} className="card flex items-center justify-between p-4 text-left">
                  <div><div className="text-xs text-muted-foreground">Rimar na</div><div className="font-black">{b.nome}</div><div className="text-xs text-muted-foreground">{b.local}</div></div>
                  <span className={`rounded-md px-2 py-1 text-sm font-black ${b.nivel > p.ovr ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>nível {b.nivel}</span>
                </button>
              ))}
              <button onClick={() => { setMsg("Você tirou um tempo pra treinar sozinho."); avancar(p); }} className="text-sm text-muted-foreground underline">Pular mês</button>
            </div>
          </div>
        )}
        <button onClick={onReset} className="mt-6 text-xs text-muted-foreground underline">Nova carreira</button>
      </section>

      <section className="panel overflow-x-auto p-4">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] font-bold text-muted-foreground"><th className="pb-2">IDADE</th><th>ESTADO</th><th className="text-center">OVR</th><th className="text-center">BATALHAS</th><th className="text-center">VITÓRIAS</th><th className="text-center">FOLINHAS</th><th className="text-center">TÍTULOS</th></tr></thead>
          <tbody>
            {idades.map((i) => {
              const h = p.historico.find((x) => x.idade === i) ?? (i === p.idade ? atual : null);
              return (
                <tr key={i} className={i === p.idade ? "bg-secondary" : ""}>
                  <td className="py-1 pl-1 font-bold text-muted-foreground">{i}</td>
                  {h ? (<>
                    <td className="font-bold"><span className="flex items-center gap-2"><img src={flag(p.uf)} alt="" className="h-3 w-5 object-cover" />{est}</span></td>
                    <td className="text-center"><span className="rounded bg-primary px-2 font-black text-primary-foreground">{h.ovr}</span></td>
                    <td className="text-center">{h.batalhas}</td><td className="text-center">{h.vitorias}</td><td className="text-center">{h.folinhas}</td><td className="text-center">{h.titulos}</td>
                  </>) : <td colSpan={6} />}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </main>
  );
}
