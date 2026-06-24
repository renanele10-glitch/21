// ── Constantes ────────────────────────────────────────────────────────────────
const CORES    = ["azul", "verde", "vermelho", "amarelo"];
const ESPECIAIS = { 10: "Bloqueio", 11: "Inverter", 12: "+2", 13: "Coringa", 14: "+4" };
const CORES_PT  = { blue: "Azul", green: "Verde", red: "Vermelho", yellow: "Amarelo",
                    azul: "Azul", verde: "Verde", vermelho: "Vermelho", amarelo: "Amarelo" };

function nomeCarta(cor, num) {
  const n = ESPECIAIS[num] ?? String(num);
  return cor === "wild" ? n : `${n} ${CORES_PT[cor] ?? cor}`;
}

function makeDeck() {
  const deck = [];
  for (const cor of CORES) {
    deck.push({ cor, num: 0 });
    for (let n = 1; n <= 12; n++) {
      deck.push({ cor, num: n });
      deck.push({ cor, num: n });
    }
  }
  for (let i = 0; i < 4; i++) {
    deck.push({ cor: "wild", num: 13 });
    deck.push({ cor: "wild", num: 14 });
  }
  return shuffle(deck);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function podeJogar(carta, topo, corAtiva) {
  if (carta.cor === "wild") return true;
  const efetivo = corAtiva || topo.cor;
  return carta.cor === efetivo || carta.num === topo.num;
}

// ── Classe principal ──────────────────────────────────────────────────────────
export class UNOGame {
  constructor() {
    this.players     = [];          // [{userId, username, avatar, socketId}]
    this.hands       = new Map();   // userId → [{cor, num}]
    this.deck        = [];
    this.descarte    = [];
    this.estado      = "aguardando"; // aguardando | jogando | fim
    this.cur         = 0;
    this.dir         = 1;
    this.corAtiva    = null;        // após coringa
    this.aguardandoCor = false;
  }

  // ── Setup ─────────────────────────────────────────────────────────────────
  addPlayer({ userId, username, avatar, socketId }) {
    if (this.players.find((p) => p.userId === userId)) {
      // Reconexão — atualiza socketId
      const p = this.players.find((p) => p.userId === userId);
      p.socketId = socketId;
      return;
    }
    if (this.players.length >= 4) return;
    this.players.push({ userId, username, avatar, socketId });
  }

  removePlayer(userId) {
    this.players = this.players.filter((p) => p.userId !== userId);
    this.hands.delete(userId);
  }

  iniciar(requesterId) {
    if (this.players.length < 2) return false;
    this.deck     = makeDeck();
    this.descarte = [];
    this.estado   = "jogando";
    this.cur      = 0;
    this.dir      = 1;
    this.corAtiva = null;

    // Distribui 7 cartas pra cada
    for (const p of this.players) {
      this.hands.set(p.userId, this._draw(7));
    }

    // Carta inicial não-especial
    let inicial;
    do {
      inicial = this.deck.pop();
      if (inicial.cor === "wild" || inicial.num >= 10) {
        this.deck.unshift(inicial);
        inicial = null;
      }
    } while (!inicial);
    this.descarte.push(inicial);

    return true;
  }

  // ── Ações ─────────────────────────────────────────────────────────────────
  jogarCarta(userId, cardIndex) {
    if (this.estado !== "jogando") return { erro: "Jogo não iniciado." };
    if (this.aguardandoCor)        return { erro: "Escolha a cor primeiro." };

    const jogadorAtual = this.players[this.cur % this.players.length];
    if (jogadorAtual.userId !== userId) return { erro: "Não é sua vez." };

    const mao = this.hands.get(userId);
    if (!mao || cardIndex < 0 || cardIndex >= mao.length)
      return { erro: "Carta inválida." };

    const carta = mao[cardIndex];
    const topo  = this.descarte[this.descarte.length - 1];

    if (!podeJogar(carta, topo, this.corAtiva))
      return { erro: "Não pode jogar essa carta agora." };

    // Remove da mão
    mao.splice(cardIndex, 1);
    this.descarte.push(carta);
    this.corAtiva = null;

    const log = `🃏 **${jogadorAtual.username}** jogou **${nomeCarta(carta.cor, carta.num)}**`;

    // Vitória
    if (mao.length === 0) {
      this.estado = "fim";
      return { log, vencedor: jogadorAtual.username };
    }

    const uno = mao.length === 1 ? ` ⚠️ UNO! ${jogadorAtual.username}!` : "";

    // Efeitos
    if (carta.cor === "wild") {
      this.aguardandoCor = true;
      return { log: log + uno };
    }

    const logExtra = this._aplicarEfeito(carta);
    return { log: log + logExtra + uno };
  }

  comprar(userId) {
    if (this.estado !== "jogando") return { erro: "Jogo não iniciado." };
    const jogadorAtual = this.players[this.cur % this.players.length];
    if (jogadorAtual.userId !== userId) return { erro: "Não é sua vez." };

    this._reembaralhar();
    const carta = this.deck.pop();
    this.hands.get(userId).push(carta);
    this._avancarTurno();

    return { log: `📥 **${jogadorAtual.username}** comprou uma carta.` };
  }

  escolherCor(userId, cor) {
    if (!this.aguardandoCor) return { erro: "Não há coringa aguardando cor." };
    const jogadorAtual = this.players[this.cur % this.players.length];
    if (jogadorAtual.userId !== userId) return { erro: "Não é você." };

    const corNorm = cor.toLowerCase();
    if (!["azul","verde","vermelho","amarelo"].includes(corNorm))
      return { erro: "Cor inválida." };

    this.corAtiva      = corNorm;
    this.aguardandoCor = false;

    const topo = this.descarte[this.descarte.length - 1];
    let log = `🎨 Cor escolhida: **${CORES_PT[corNorm]}**`;

    // +4 aplica efeito agora
    if (topo.num === 14) {
      const prox = this.players[(this.cur + this.dir + this.players.length) % this.players.length];
      this._drawPlayer(prox.userId, 4);
      this._avancarTurno(); // pula o que levou +4
      log += `. ${prox.username} comprou 4 e foi pulado!`;
    }

    this._avancarTurno();
    return { log };
  }

  // ── Helpers privados ───────────────────────────────────────────────────────
  _draw(n) {
    const cards = [];
    for (let i = 0; i < n; i++) {
      this._reembaralhar();
      if (this.deck.length) cards.push(this.deck.pop());
    }
    return cards;
  }

  _drawPlayer(userId, n) {
    const cards = this._draw(n);
    const mao   = this.hands.get(userId) || [];
    mao.push(...cards);
    this.hands.set(userId, mao);
  }

  _reembaralhar() {
    if (this.deck.length < 5 && this.descarte.length > 1) {
      const topo = this.descarte.pop();
      this.deck  = shuffle(this.descarte);
      this.descarte = [topo];
    }
  }

  _avancarTurno() {
    const n = this.players.length;
    this.cur = ((this.cur + this.dir) % n + n) % n;
  }

  _aplicarEfeito(carta) {
    const n = this.players.length;
    const prox = this.players[((this.cur + this.dir) % n + n) % n];

    if (carta.num === 10) {
      // Bloqueio
      this._avancarTurno();
      this._avancarTurno();
      return `. ⏭️ ${prox.username} foi pulado!`;
    }
    if (carta.num === 11) {
      // Inverter
      this.dir *= -1;
      this._avancarTurno();
      return ". 🔄 Sentido invertido!";
    }
    if (carta.num === 12) {
      // +2
      this._drawPlayer(prox.userId, 2);
      this._avancarTurno();
      this._avancarTurno();
      return `. ✌️ ${prox.username} comprou 2 e foi pulado!`;
    }

    this._avancarTurno();
    return "";
  }

  // ── Estado público (sem mãos privadas) ───────────────────────────────────
  getPublicState() {
    const topo = this.descarte[this.descarte.length - 1] || null;
    const atual = this.players[this.cur % this.players.length] || null;
    return {
      estado:        this.estado,
      topo,
      corAtiva:      this.corAtiva,
      aguardandoCor: this.aguardandoCor,
      pilha:         this.descarte.length,
      jogadores: this.players.map((p) => ({
        userId:   p.userId,
        username: p.username,
        avatar:   p.avatar,
        cartas:   (this.hands.get(p.userId) || []).length,
        vez:      atual?.userId === p.userId,
        uno:      (this.hands.get(p.userId) || []).length === 1,
      })),
      vezDe: atual?.username || null,
    };
  }

  // ── Mão privada de um jogador ─────────────────────────────────────────────
  getHandOf(userId) {
    return this.hands.get(userId) || [];
  }
}
