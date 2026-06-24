import { useState } from "react";
import { Card, CardBack } from "./Card.jsx";

const CORES = [
  { id: "azul",     label: "🔵 Azul",     bg: "#1565C0" },
  { id: "verde",    label: "🟢 Verde",    bg: "#2E7D32" },
  { id: "vermelho", label: "🔴 Vermelho", bg: "#C62828" },
  { id: "amarelo",  label: "🟡 Amarelo",  bg: "#F9A825" },
];

const CORES_CSS = {
  azul: "#1565C0", verde: "#2E7D32",
  vermelho: "#C62828", amarelo: "#F9A825", wild: "#4A148C",
};

const ESPECIAIS_PT = { 10: "Bloqueio", 11: "Inverter", 12: "+2", 13: "Coringa", 14: "+4" };

function nomeCarta(cor, num) {
  const n = ESPECIAIS_PT[num] ?? String(num);
  return cor === "wild" ? n : `${n} ${cor}`;
}

export function GameScreen({ state, mao, log, erro, vencedor, user,
                              jogarCarta, comprar, escolherCor, iniciar }) {
  const [showCores, setShowCores] = useState(false);

  const topo     = state?.topo;
  const corAtiva = state?.corAtiva;
  const minhaVez = state?.jogadores?.find((j) => j.userId === user?.id)?.vez;

  function handleJogar(idx) {
    const carta = mao[idx];
    jogarCarta(idx);
    if (carta?.cor === "wild") setShowCores(true);
  }

  function handleEscolherCor(cor) {
    escolherCor(cor);
    setShowCores(false);
  }

  // ── Tela de vitória ────────────────────────────────────────────────────────
  if (vencedor) {
    return (
      <div style={s.center}>
        <div style={s.vencedorBox}>
          <div style={{ fontSize: 64 }}>🏆</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#FFD700", marginTop: 12 }}>
            {vencedor === user?.username ? "Você venceu!" : `${vencedor} venceu!`}
          </div>
        </div>
      </div>
    );
  }

  // ── Lobby ──────────────────────────────────────────────────────────────────
  if (!state || state.estado === "aguardando") {
    return (
      <div style={s.center}>
        <div style={s.lobby}>
          <img src="/.proxy/cards/uno!.png" alt="UNO"
               style={{ width: 80, marginBottom: 16 }}
               onError={(e) => { e.target.style.display="none"; }} />
          <h2 style={{ color: "#FFD700", margin: "0 0 4px" }}>UNO</h2>
          <p style={{ color: "#888", fontSize: 13, margin: "0 0 20px" }}>
            {state?.jogadores?.length ?? 0}/4 jogadores
          </p>
          {state?.jogadores?.map((j) => (
            <div key={j.userId} style={s.playerRow}>
              <img
                src={`https://cdn.discordapp.com/avatars/${j.userId}/${j.avatar}.png`}
                style={s.avatar}
                onError={(e) => { e.target.src = "https://cdn.discordapp.com/embed/avatars/0.png"; }}
              />
              <span style={{ color: "#fff", fontSize: 14 }}>{j.username}</span>
            </div>
          ))}
          {(state?.jogadores?.length ?? 0) >= 2 ? (
            <button onClick={iniciar} style={s.btnPrimary}>
              ▶ Iniciar Partida
            </button>
          ) : (
            <p style={{ color: "#666", fontSize: 13, marginTop: 16 }}>
              Aguardando mais jogadores…
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Jogo ───────────────────────────────────────────────────────────────────
  return (
    <div style={s.game}>

      {/* Adversários */}
      <div style={s.adversarios}>
        {state.jogadores
          .filter((j) => j.userId !== user?.id)
          .map((j) => (
            <div key={j.userId} style={{
              ...s.adversario,
              border: j.vez ? "2px solid #FFD700" : "2px solid transparent",
            }}>
              <img
                src={`https://cdn.discordapp.com/avatars/${j.userId}/${j.avatar}.png`}
                style={s.avatar}
                onError={(e) => { e.target.src = "https://cdn.discordapp.com/embed/avatars/0.png"; }}
              />
              <div style={{ color: j.vez ? "#FFD700" : "#aaa", fontSize: 11, fontWeight: "bold" }}>
                {j.username}
              </div>
              <div style={{ display: "flex", gap: 2, marginTop: 4, flexWrap: "wrap", justifyContent: "center" }}>
                {Array.from({ length: Math.min(j.cartas, 10) }).map((_, i) => (
                  <CardBack key={i} small />
                ))}
                {j.cartas > 10 && (
                  <span style={{ color: "#888", fontSize: 11, alignSelf: "center" }}>
                    +{j.cartas - 10}
                  </span>
                )}
              </div>
              {j.uno && <div style={s.unoBadge}>UNO!</div>}
            </div>
          ))}
      </div>

      {/* Mesa central */}
      <div style={s.mesa}>
        {/* Log de jogadas */}
        <div style={s.log}>
          {log.length === 0
            ? <span style={{ color: "#555", fontSize: 12 }}>Partida iniciada!</span>
            : log.slice(-3).map((l, i) => (
                <div key={i} style={{ color: i === log.slice(-3).length - 1 ? "#ddd" : "#666", fontSize: 12 }}>
                  {l}
                </div>
              ))
          }
        </div>

        {/* Pilha + Topo */}
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#666", fontSize: 10, marginBottom: 4 }}>PILHA</div>
            <CardBack />
            <div style={{ color: "#555", fontSize: 10, marginTop: 2 }}>{state.pilha}</div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#666", fontSize: 10, marginBottom: 4 }}>TOPO</div>
            {topo && (
              <Card cor={corAtiva || topo.cor} num={topo.num} disabled />
            )}
            {corAtiva && (
              <div style={{
                marginTop: 4, fontSize: 11, fontWeight: "bold",
                color: CORES_CSS[corAtiva] ?? "#fff",
              }}>
                ● {corAtiva.charAt(0).toUpperCase() + corAtiva.slice(1)}
              </div>
            )}
          </div>
        </div>

        {/* Indicador de vez */}
        <div style={{
          color: minhaVez ? "#FFD700" : "#aaa",
          fontSize: 13, fontWeight: "bold", marginTop: 4,
        }}>
          {minhaVez ? "✨ Sua vez!" : `Vez de ${state.vezDe}`}
        </div>

        {/* Erro */}
        {erro && <div style={s.erro}>{erro}</div>}
      </div>

      {/* Seletor de cor após coringa */}
      {showCores && minhaVez && (
        <div style={s.corSelector}>
          <div style={{ color: "#FFD700", fontWeight: "bold", fontSize: 13, marginBottom: 10 }}>
            Escolha a cor:
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {CORES.map((c) => (
              <button key={c.id} onClick={() => handleEscolherCor(c.id)}
                style={{ ...s.btnCor, background: c.bg }}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mão do jogador */}
      <div style={s.maoWrapper}>
        <div style={{ color: "#666", fontSize: 10, marginBottom: 6 }}>
          SUA MÃO ({mao.length} carta{mao.length !== 1 ? "s" : ""})
        </div>
        <div style={s.mao}>
          {mao.map((carta, i) => {
            const jogavel = minhaVez && !showCores && (
              carta.cor === "wild" ||
              (corAtiva ? carta.cor === corAtiva : carta.cor === topo?.cor) ||
              carta.num === topo?.num
            );
            return (
              <Card
                key={i}
                cor={carta.cor}
                num={carta.num}
                highlight={jogavel}
                disabled={!jogavel}
                onClick={() => handleJogar(i)}
              />
            );
          })}
        </div>

        {/* Botão comprar */}
        {minhaVez && !showCores && (
          <button onClick={comprar} style={s.btnComprar}>
            📥 Comprar Carta
          </button>
        )}
      </div>
    </div>
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────────
const s = {
  game: {
    display: "flex", flexDirection: "column",
    height: "100vh", background: "#0a0a1a",
    overflow: "hidden", fontFamily: "sans-serif",
  },
  center: {
    display: "flex", alignItems: "center", justifyContent: "center",
    height: "100vh", background: "#0a0a1a",
  },
  lobby: {
    background: "#111122", borderRadius: 16, padding: 32,
    display: "flex", flexDirection: "column", alignItems: "center",
    minWidth: 280, border: "1px solid #222",
  },
  vencedorBox: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
  },
  adversarios: {
    display: "flex", justifyContent: "center", gap: 12,
    padding: "8px 12px", overflowX: "auto", flexShrink: 0,
    borderBottom: "1px solid #111",
  },
  adversario: {
    display: "flex", flexDirection: "column", alignItems: "center",
    background: "#111122", borderRadius: 10, padding: "6px 10px",
    minWidth: 72, position: "relative",
  },
  mesa: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 10,
    padding: "0 12px",
  },
  log: {
    background: "rgba(0,0,0,0.5)", borderRadius: 8,
    padding: "6px 12px", width: "90%", maxWidth: 380,
    minHeight: 52, display: "flex", flexDirection: "column",
    gap: 2, border: "1px solid #1a1a2e",
  },
  maoWrapper: {
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "8px 0 14px", background: "#0d0d1f",
    borderTop: "1px solid #1a1a2e", flexShrink: 0,
  },
  mao: {
    display: "flex", gap: 6, overflowX: "auto",
    padding: "4px 16px 4px", maxWidth: "100vw",
  },
  corSelector: {
    background: "#111122", borderRadius: 12, padding: "12px 16px",
    display: "flex", flexDirection: "column", alignItems: "center",
    border: "1px solid #FFD700", margin: "0 auto", flexShrink: 0,
  },
  btnCor: {
    border: "none", borderRadius: 8, padding: "8px 14px",
    cursor: "pointer", color: "#fff", fontWeight: "bold",
    fontSize: 13, boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
  },
  btnComprar: {
    marginTop: 8, background: "#1a1a2e", color: "#aaa",
    border: "1px solid #333", borderRadius: 8,
    padding: "8px 20px", cursor: "pointer", fontSize: 13,
  },
  btnPrimary: {
    marginTop: 20, background: "#1565C0", color: "#fff",
    border: "none", borderRadius: 10, padding: "12px 32px",
    cursor: "pointer", fontSize: 15, fontWeight: "bold",
    boxShadow: "0 4px 12px rgba(21,101,192,0.4)",
  },
  avatar: { width: 30, height: 30, borderRadius: "50%", marginBottom: 3 },
  playerRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
  unoBadge: {
    position: "absolute", top: -8, right: -8,
    background: "#C62828", color: "#fff",
    borderRadius: 6, padding: "2px 5px", fontSize: 9, fontWeight: "bold",
  },
  erro: {
    background: "#C62828", color: "#fff", borderRadius: 8,
    padding: "6px 16px", fontSize: 12, fontWeight: "bold",
  },
};
