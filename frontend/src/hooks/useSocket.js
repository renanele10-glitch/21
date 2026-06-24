import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "/.proxy";

export function useSocket({ user, channelId, ready }) {
  const socketRef         = useRef(null);
  const [state, setState]     = useState(null);   // estado público do jogo
  const [mao, setMao]         = useState([]);      // mão privada do jogador
  const [log, setLog]         = useState([]);      // últimas mensagens
  const [erro, setErro]       = useState(null);
  const [vencedor, setVencedor] = useState(null);

  useEffect(() => {
    if (!ready || !user || !channelId) return;

    const socket = io(BACKEND, { transports: ["websocket"] });
    socketRef.current = socket;

    // Entra na sala
    socket.emit("entrar", {
      channelId,
      userId:   user.id,
      username: user.username,
      avatar:   user.avatar,
    });

    socket.on("sala_atualizada", (s) => setState(s));
    socket.on("jogo_iniciado",   (s) => { setState(s); setLog([]); });

    socket.on("jogada", ({ state: s, log: l, vencedor: v }) => {
      setState(s);
      if (l) setLog((prev) => [...prev.slice(-9), l]);
      if (v) setVencedor(v);
    });

    socket.on("sua_mao", (cards) => setMao(cards));
    socket.on("erro",    (msg)   => {
      setErro(msg);
      setTimeout(() => setErro(null), 3000);
    });

    return () => socket.disconnect();
  }, [ready, user, channelId]);

  const emit = (event, data) => socketRef.current?.emit(event, data);

  return {
    state, mao, log, erro, vencedor,
    iniciar:      ()          => emit("iniciar"),
    jogarCarta:   (cardIndex) => emit("jogar_carta", { cardIndex }),
    comprar:      ()          => emit("comprar"),
    escolherCor:  (cor)       => emit("escolher_cor", { cor }),
  };
}
