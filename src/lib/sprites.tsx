"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type SpriteStyle = "robot" | "chibi" | "geometric" | "animal" | "minimal";

interface SpriteContextValue {
  spriteStyle: SpriteStyle;
  setSpriteStyle: (style: SpriteStyle) => void;
}

const SpriteContext = createContext<SpriteContextValue>({
  spriteStyle: "robot",
  setSpriteStyle: () => {},
});

export function SpriteProvider({ children }: { children: ReactNode }) {
  const [spriteStyle, setSpriteStyleState] = useState<SpriteStyle>("robot");

  useEffect(() => {
    const saved = localStorage.getItem("gank-sprite") as SpriteStyle | null;
    if (saved) setSpriteStyleState(saved);
  }, []);

  const setSpriteStyle = (style: SpriteStyle) => {
    setSpriteStyleState(style);
    localStorage.setItem("gank-sprite", style);
  };

  return (
    <SpriteContext.Provider value={{ spriteStyle, setSpriteStyle }}>
      {children}
    </SpriteContext.Provider>
  );
}

export function useSpriteStyle() {
  return useContext(SpriteContext);
}

// ============================================================
// Sprite renderers — each returns SVG elements for a character
// ============================================================

interface SpriteProps {
  color: string;
  variant: number; // 0-3 for body variety
  size?: number;   // viewBox size factor
}

// Style 1: Robot (original, refined)
export function SpriteRobot({ color, variant }: SpriteProps) {
  return (
    <g>
      {/* Antenna */}
      <line x1="0" y1="-7" x2="0" y2="-11" stroke={color} strokeWidth="1.5" opacity="0.8" />
      <circle cx="0" cy="-12" r="2" fill={color} />
      {/* Head */}
      <rect x="-7" y="-6" width="14" height="12" rx="3" fill={color} />
      {/* Visor */}
      <rect x="-5" y="-3" width="10" height="4" rx="2" fill="#000" opacity="0.25" />
      {/* Eyes */}
      <circle cx="-3" cy="-1" r="1.5" fill="#fff" />
      <circle cx="3" cy="-1" r="1.5" fill="#fff" />
      {/* Body */}
      <rect x="-8" y="7" width="16" height="12" rx="2" fill={color} opacity="0.85" />
      {/* Chest panel */}
      <rect x="-3" y="9" width="6" height="4" rx="1" fill="#fff" opacity="0.2" />
      {/* Arms */}
      {variant % 2 === 0 ? (
        <><rect x="-12" y="8" width="4" height="10" rx="2" fill={color} opacity="0.7" /><rect x="8" y="8" width="4" height="10" rx="2" fill={color} opacity="0.7" /></>
      ) : (
        <><rect x="-11" y="9" width="3" height="8" rx="1.5" fill={color} opacity="0.7" /><rect x="8" y="9" width="3" height="8" rx="1.5" fill={color} opacity="0.7" /></>
      )}
      {/* Legs */}
      <rect x="-5" y="20" width="4" height="6" rx="1" fill={color} opacity="0.65" />
      <rect x="1" y="20" width="4" height="6" rx="1" fill={color} opacity="0.65" />
    </g>
  );
}

// Style 2: Chibi (round, cute)
export function SpriteChibi({ color, variant }: SpriteProps) {
  return (
    <g>
      {/* Big round head */}
      <circle cx="0" cy="-2" r="10" fill={color} />
      {/* Hair tuft */}
      {variant === 0 && <ellipse cx="0" cy="-11" rx="5" ry="3" fill={color} opacity="0.8" />}
      {variant === 1 && <><circle cx="-4" cy="-10" r="3" fill={color} opacity="0.75" /><circle cx="4" cy="-10" r="3" fill={color} opacity="0.75" /></>}
      {variant === 2 && <path d="M-6,-8 Q0,-16 6,-8" fill={color} opacity="0.75" />}
      {variant === 3 && <><rect x="-7" y="-12" width="14" height="3" rx="1.5" fill={color} opacity="0.75" /><rect x="-3" y="-14" width="6" height="3" rx="1.5" fill={color} opacity="0.65" /></>}
      {/* Big eyes */}
      <circle cx="-4" cy="-3" r="2.8" fill="#fff" />
      <circle cx="4" cy="-3" r="2.8" fill="#fff" />
      <circle cx="-3.5" cy="-3.5" r="1.2" fill="#000" />
      <circle cx="4.5" cy="-3.5" r="1.2" fill="#000" />
      {/* Shine in eyes */}
      <circle cx="-2.8" cy="-4.2" r="0.6" fill="#fff" />
      <circle cx="5.2" cy="-4.2" r="0.6" fill="#fff" />
      {/* Blush */}
      <circle cx="-7" cy="0" r="2" fill="#ff9999" opacity="0.4" />
      <circle cx="7" cy="0" r="2" fill="#ff9999" opacity="0.4" />
      {/* Tiny mouth */}
      <path d="M-1.5,2.5 Q0,4.5 1.5,2.5" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.7" />
      {/* Small body */}
      <rect x="-6" y="9" width="12" height="8" rx="4" fill={color} opacity="0.85" />
      {/* Tiny legs */}
      <circle cx="-3" cy="20" r="3.5" fill={color} opacity="0.75" />
      <circle cx="3" cy="20" r="3.5" fill={color} opacity="0.75" />
    </g>
  );
}

// Style 3: Geometric (abstract, modern)
export function SpriteGeometric({ color, variant }: SpriteProps) {
  return (
    <g>
      {/* Head — different shapes per variant */}
      {variant === 0 && <polygon points="0,-12 -9,0 9,0" fill={color} opacity="0.9" />}
      {variant === 1 && <rect x="-8" y="-10" width="16" height="12" fill={color} opacity="0.9" />}
      {variant === 2 && <circle cx="0" cy="-5" r="8" fill={color} opacity="0.9" />}
      {variant === 3 && <polygon points="-8,-10 8,-10 10,0 -10,0" fill={color} opacity="0.9" />}
      {/* Eyes — dots */}
      <circle cx="-3" cy="-4" r="1.5" fill="#fff" />
      <circle cx="3" cy="-4" r="1.5" fill="#fff" />
      {/* Body — hexagonal feel */}
      <polygon points="-8,3 -10,12 -6,20 6,20 10,12 8,3" fill={color} opacity="0.8" />
      {/* Center line */}
      <line x1="0" y1="3" x2="0" y2="20" stroke="#fff" strokeWidth="0.5" opacity="0.2" />
      {/* Side accents */}
      <rect x="-13" y="5" width="3" height="8" rx="1" fill={color} opacity="0.6" />
      <rect x="10" y="5" width="3" height="8" rx="1" fill={color} opacity="0.6" />
      {/* Feet */}
      <rect x="-6" y="21" width="4" height="3" fill={color} opacity="0.65" />
      <rect x="2" y="21" width="4" height="3" fill={color} opacity="0.65" />
    </g>
  );
}

// Style 4: Animal (cute animal characters)
export function SpriteAnimal({ color, variant }: SpriteProps) {
  return (
    <g>
      {/* Ears — different per variant */}
      {(variant === 0 || variant === 2) && (
        <>{/* Cat/fox ears */}
          <polygon points="-9,-12 -6,-4 -12,-4" fill={color} opacity="0.9" />
          <polygon points="9,-12 6,-4 12,-4" fill={color} opacity="0.9" />
          <polygon points="-8.5,-10 -7,-5 -10,-5" fill="#fff" opacity="0.2" />
          <polygon points="8.5,-10 7,-5 10,-5" fill="#fff" opacity="0.2" />
        </>
      )}
      {variant === 1 && (
        <>{/* Bunny ears */}
          <ellipse cx="-5" cy="-14" rx="3" ry="7" fill={color} opacity="0.9" />
          <ellipse cx="5" cy="-14" rx="3" ry="7" fill={color} opacity="0.9" />
          <ellipse cx="-5" cy="-14" rx="1.5" ry="5" fill="#fff" opacity="0.15" />
          <ellipse cx="5" cy="-14" rx="1.5" ry="5" fill="#fff" opacity="0.15" />
        </>
      )}
      {variant === 3 && (
        <>{/* Bear ears */}
          <circle cx="-7" cy="-8" r="4" fill={color} opacity="0.9" />
          <circle cx="7" cy="-8" r="4" fill={color} opacity="0.9" />
          <circle cx="-7" cy="-8" r="2" fill="#fff" opacity="0.15" />
          <circle cx="7" cy="-8" r="2" fill="#fff" opacity="0.15" />
        </>
      )}
      {/* Head */}
      <circle cx="0" cy="-1" r="9" fill={color} />
      {/* Eyes */}
      <circle cx="-3" cy="-2" r="2" fill="#fff" />
      <circle cx="3" cy="-2" r="2" fill="#fff" />
      <circle cx="-2.5" cy="-2.5" r="0.8" fill="#000" />
      <circle cx="3.5" cy="-2.5" r="0.8" fill="#000" />
      {/* Nose */}
      <ellipse cx="0" cy="1" rx="1.8" ry="1.2" fill="#000" opacity="0.4" />
      {/* Whiskers for cat/fox */}
      {(variant === 0 || variant === 2) && (
        <>
          <line x1="-12" y1="0" x2="-5" y2="1" stroke={color} strokeWidth="0.6" opacity="0.6" />
          <line x1="-12" y1="2.5" x2="-5" y2="2" stroke={color} strokeWidth="0.6" opacity="0.6" />
          <line x1="12" y1="0" x2="5" y2="1" stroke={color} strokeWidth="0.6" opacity="0.6" />
          <line x1="12" y1="2.5" x2="5" y2="2" stroke={color} strokeWidth="0.6" opacity="0.6" />
        </>
      )}
      {/* Body */}
      <ellipse cx="0" cy="14" rx="7" ry="7" fill={color} opacity="0.85" />
      {/* Paws */}
      <circle cx="-5" cy="22" r="3" fill={color} opacity="0.75" />
      <circle cx="5" cy="22" r="3" fill={color} opacity="0.75" />
      {/* Tail for cat/fox */}
      {variant === 0 && <path d="M8,16 Q18,8 15,19" fill={color} opacity="0.6" strokeWidth="0" />}
    </g>
  );
}

// Style 5: Minimal (simple circles & lines)
export function SpriteMinimal({ color, variant }: SpriteProps) {
  return (
    <g>
      {/* Head circle */}
      <circle cx="0" cy="-3" r="8" fill={color} opacity="0.15" stroke={color} strokeWidth="2.5" />
      {/* Eyes — just dots */}
      <circle cx="-3" cy="-4" r="1.5" fill={color} />
      <circle cx="3" cy="-4" r="1.5" fill={color} />
      {/* Mouth line */}
      {variant % 2 === 0 ? (
        <path d="M-2,0 Q0,3 2,0" fill="none" stroke={color} strokeWidth="1" opacity="0.8" />
      ) : (
        <line x1="-2" y1="0" x2="2" y2="0" stroke={color} strokeWidth="1" opacity="0.8" />
      )}
      {/* Body — just a line */}
      <line x1="0" y1="5" x2="0" y2="18" stroke={color} strokeWidth="2.5" opacity="0.8" />
      {/* Arms */}
      {variant === 0 && <><line x1="0" y1="9" x2="-8" y2="14" stroke={color} strokeWidth="2" opacity="0.7" /><line x1="0" y1="9" x2="8" y2="14" stroke={color} strokeWidth="2" opacity="0.7" /></>}
      {variant === 1 && <><line x1="0" y1="8" x2="-7" y2="8" stroke={color} strokeWidth="2" opacity="0.7" /><line x1="0" y1="8" x2="7" y2="8" stroke={color} strokeWidth="2" opacity="0.7" /></>}
      {variant === 2 && <><line x1="0" y1="10" x2="-8" y2="6" stroke={color} strokeWidth="2" opacity="0.7" /><line x1="0" y1="10" x2="8" y2="6" stroke={color} strokeWidth="2" opacity="0.7" /></>}
      {variant === 3 && <><line x1="0" y1="9" x2="-6" y2="12" stroke={color} strokeWidth="2" opacity="0.7" /><line x1="0" y1="9" x2="6" y2="12" stroke={color} strokeWidth="2" opacity="0.7" /></>}
      {/* Legs */}
      <line x1="0" y1="18" x2="-5" y2="25" stroke={color} strokeWidth="2" opacity="0.7" />
      <line x1="0" y1="18" x2="5" y2="25" stroke={color} strokeWidth="2" opacity="0.7" />
    </g>
  );
}

// Renderer that picks the right sprite style
export function renderSprite(style: SpriteStyle, color: string, variant: number) {
  switch (style) {
    case "robot": return <SpriteRobot color={color} variant={variant} />;
    case "chibi": return <SpriteChibi color={color} variant={variant} />;
    case "geometric": return <SpriteGeometric color={color} variant={variant} />;
    case "animal": return <SpriteAnimal color={color} variant={variant} />;
    case "minimal": return <SpriteMinimal color={color} variant={variant} />;
    default: return <SpriteRobot color={color} variant={variant} />;
  }
}

// Labels for each style
export const SPRITE_LABELS: Record<SpriteStyle, { th: string; en: string }> = {
  robot: { th: "หุ่นยนต์", en: "Robot" },
  chibi: { th: "จิบิ", en: "Chibi" },
  geometric: { th: "เรขาคณิต", en: "Geometric" },
  animal: { th: "สัตว์น้อย", en: "Animal" },
  minimal: { th: "มินิมอล", en: "Minimal" },
};
