import { useDiscord } from "./hooks/useDiscord.js";
import { useSocket }  from "./hooks/useSocket.js";
import { GameScreen } from "./components/GameScreen.jsx";

export default function App() {
  const { user, channelId, ready } = useDiscord();
  const {
    state, mao, log, erro, vencedor,
    iniciar, jogarCarta, comprar, escolherCor,
  } = useSocket({ user, channelId, ready });

  if (!ready) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", background: "#0a0a1a", color: "#FFD700",
        flexDirection: "column", gap: 16, fontFamily: "sans-serif",
      }}>
        <div style={{ fontSize: 48 }}>🃏</div>
        <div style={{ fontSize: 18, fontWeight: "bold" }}>Conectando…</div>
      </div>
    );
  }

  return (
    <GameScreen
      state={state}
      mao={mao}
      log={log}
      erro={erro}
      vencedor={vencedor}
      user={user}
      iniciar={iniciar}
      jogarCarta={jogarCarta}
      comprar={comprar}
      escolherCor={escolherCor}
    />
  );
}
