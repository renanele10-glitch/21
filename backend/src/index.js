import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import "dotenv/config";
import { UNOGame } from "./game.js";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app    = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Serve imagens das cartas UNO
app.use("/cards", express.static(path.join(__dirname, "../../assets/uno")));

// Salas ativas: channelId → UNOGame
const salas = new Map();

// ── Rota de token (Discord OAuth2 PKCE) ──────────────────────────────────────
app.post("/api/token", async (req, res) => {
  const { code } = req.body;
  try {
    const resp = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type:    "authorization_code",
        code,
      }),
    });
    const data = await resp.json();
    res.json({ access_token: data.access_token });
  } catch (e) {
    res.status(500).json({ error: "Token exchange failed" });
  }
});

// ── Saúde ─────────────────────────────────────────────────────────────────────
app.get("/health", (_, res) => res.json({ ok: true }));

// ── WebSocket ─────────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`[+] ${socket.id} conectou`);

  // Jogador entra na sala do canal
  socket.on("entrar", ({ channelId, userId, username, avatar }) => {
    socket.join(channelId);
    socket.data = { channelId, userId, username, avatar };

    if (!salas.has(channelId)) {
      salas.set(channelId, new UNOGame());
    }

    const sala = salas.get(channelId);
    sala.addPlayer({ userId, username, avatar, socketId: socket.id });

    // Avisa todos na sala
    io.to(channelId).emit("sala_atualizada", sala.getPublicState());
    console.log(`[sala:${channelId}] ${username} entrou`);
  });

  // Iniciar jogo
  socket.on("iniciar", () => {
    const { channelId } = socket.data;
    const sala = salas.get(channelId);
    if (!sala) return;

    const ok = sala.iniciar(socket.data.userId);
    if (!ok) {
      socket.emit("erro", "Mínimo 2 jogadores para iniciar.");
      return;
    }

    // Envia estado público pra todos
    io.to(channelId).emit("jogo_iniciado", sala.getPublicState());

    // Envia mão privada pra cada jogador
    sala.players.forEach((p) => {
      io.to(p.socketId).emit("sua_mao", sala.getHandOf(p.userId));
    });
  });

  // Jogar carta
  socket.on("jogar_carta", ({ cardIndex }) => {
    const { channelId, userId } = socket.data;
    const sala = salas.get(channelId);
    if (!sala) return;

    const result = sala.jogarCarta(userId, cardIndex);
    if (result.erro) {
      socket.emit("erro", result.erro);
      return;
    }

    // Atualiza todos
    io.to(channelId).emit("jogada", {
      state:   sala.getPublicState(),
      log:     result.log,
      vencedor: result.vencedor || null,
    });

    // Atualiza mãos privadas
    sala.players.forEach((p) => {
      io.to(p.socketId).emit("sua_mao", sala.getHandOf(p.userId));
    });

    if (result.vencedor) {
      salas.delete(channelId);
    }
  });

  // Comprar carta
  socket.on("comprar", () => {
    const { channelId, userId } = socket.data;
    const sala = salas.get(channelId);
    if (!sala) return;

    const result = sala.comprar(userId);
    if (result.erro) {
      socket.emit("erro", result.erro);
      return;
    }

    io.to(channelId).emit("jogada", {
      state: sala.getPublicState(),
      log:   result.log,
    });

    socket.emit("sua_mao", sala.getHandOf(userId));
  });

  // Escolher cor (após coringa)
  socket.on("escolher_cor", ({ cor }) => {
    const { channelId, userId } = socket.data;
    const sala = salas.get(channelId);
    if (!sala) return;

    const result = sala.escolherCor(userId, cor);
    if (result.erro) {
      socket.emit("erro", result.erro);
      return;
    }

    io.to(channelId).emit("jogada", {
      state: sala.getPublicState(),
      log:   result.log,
    });

    sala.players.forEach((p) => {
      io.to(p.socketId).emit("sua_mao", sala.getHandOf(p.userId));
    });
  });

  // Desconexão
  socket.on("disconnect", () => {
    const { channelId, userId, username } = socket.data || {};
    if (!channelId) return;
    const sala = salas.get(channelId);
    if (sala) {
      sala.removePlayer(userId);
      if (sala.players.length === 0) {
        salas.delete(channelId);
      } else {
        io.to(channelId).emit("sala_atualizada", sala.getPublicState());
      }
    }
    console.log(`[-] ${username || socket.id} saiu`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () => console.log(`🃏 UNO backend rodando na porta ${PORT}`));
