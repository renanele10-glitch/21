// Carta UNO usando imagens reais da pasta assets/uno/
// Servidor backend serve as imagens em /cards/

const CORES_MAP = {
  azul:      "blue",
  verde:     "green",
  vermelho:  "red",
  amarelo:   "yellow",
  wild:      "wild",
};

export function Card({ cor, num, onClick, disabled, highlight, small }) {
  const corEn = CORES_MAP[cor] ?? cor;
  const src   = `/.proxy/cards/${corEn}${num}.png`;
  const w     = small ? 48  : 80;
  const h     = small ? 75  : 125;

  return (
    <img
      src={src}
      alt={`${cor} ${num}`}
      onClick={!disabled ? onClick : undefined}
      draggable={false}
      style={{
        width:      w,
        height:     h,
        borderRadius: 6,
        cursor:     disabled ? "default" : "pointer",
        opacity:    disabled ? 0.45 : 1,
        outline:    highlight ? "3px solid #FFD700" : "none",
        outlineOffset: "2px",
        transform:  highlight ? "translateY(-10px) scale(1.05)" : "none",
        transition: "transform 0.15s, opacity 0.15s, outline 0.1s",
        boxShadow:  highlight
          ? "0 0 14px #FFD700, 0 6px 16px rgba(0,0,0,0.6)"
          : "0 4px 8px rgba(0,0,0,0.5)",
        flexShrink: 0,
        userSelect: "none",
        WebkitUserDrag: "none",
      }}
    />
  );
}

export function CardBack({ small }) {
  const w = small ? 48 : 80;
  const h = small ? 75 : 125;
  return (
    <img
      src="/.proxy/cards/back.png"
      alt="carta"
      draggable={false}
      style={{
        width: w, height: h,
        borderRadius: 6,
        boxShadow: "0 4px 8px rgba(0,0,0,0.5)",
        flexShrink: 0,
        userSelect: "none",
      }}
    />
  );
}
