"use client";

import { useEffect, useState, useCallback } from "react";

interface Particle {
  id: string;
  x: number;
  y: number;
  color: string;
  type: "confetti" | "sparkle" | "smoke";
  cxe: number;
  cye: number;
  cr: number;
  cd: number;
  size: number;
  createdAt: number;
}

interface ParticlesProps {
  triggers: ParticleTrigger[];
}

export interface ParticleTrigger {
  x: number;
  y: number;
  type: "confetti" | "sparkle" | "smoke";
  color: string;
  id: string; // unique trigger ID to prevent duplicates
}

const CONFETTI_COLORS = ["#22c55e", "#06b6d4", "#a855f7", "#ef4444", "#f59e0b", "#f472b6", "#60a5fa"];

function createParticles(trigger: ParticleTrigger): Particle[] {
  const particles: Particle[] = [];
  const count = trigger.type === "confetti" ? 12 : trigger.type === "sparkle" ? 6 : 4;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const distance = 20 + Math.random() * 30;

    particles.push({
      id: `${trigger.id}-${i}`,
      x: trigger.x,
      y: trigger.y,
      color: trigger.type === "confetti"
        ? CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]
        : trigger.color,
      type: trigger.type,
      cxe: Math.cos(angle) * distance,
      cye: trigger.type === "smoke"
        ? -(15 + Math.random() * 20)
        : Math.sin(angle) * distance,
      cr: Math.random() * 720 - 360,
      cd: 0.8 + Math.random() * 0.8,
      size: trigger.type === "sparkle" ? 2 + Math.random() * 3 : 3 + Math.random() * 4,
      createdAt: Date.now(),
    });
  }
  return particles;
}

export function Particles({ triggers }: ParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [processedTriggers, setProcessedTriggers] = useState<Set<string>>(new Set());

  const processTriggers = useCallback((newTriggers: ParticleTrigger[]) => {
    const newParticles: Particle[] = [];
    const newProcessed = new Set(processedTriggers);

    for (const trigger of newTriggers) {
      if (!newProcessed.has(trigger.id)) {
        newProcessed.add(trigger.id);
        newParticles.push(...createParticles(trigger));
      }
    }

    if (newParticles.length > 0) {
      setProcessedTriggers(newProcessed);
      setParticles((prev) => [...prev, ...newParticles]);
    }
  }, [processedTriggers]);

  useEffect(() => {
    processTriggers(triggers);
  }, [triggers, processTriggers]);

  // Cleanup old particles
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setParticles((prev) => prev.filter((p) => now - p.createdAt < 2500));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <g>
      {particles.map((p) => {
        if (p.type === "confetti") {
          return (
            <rect
              key={p.id}
              x={p.x - p.size / 2}
              y={p.y - p.size / 2}
              width={p.size}
              height={p.size * 0.6}
              rx={0.5}
              fill={p.color}
              className="anim-confetti"
              style={{
                ["--cx" as string]: "0px",
                ["--cy" as string]: "0px",
                ["--cxe" as string]: `${p.cxe}px`,
                ["--cye" as string]: `${p.cye}px`,
                ["--cr" as string]: `${p.cr}deg`,
                ["--cd" as string]: `${p.cd}s`,
              }}
            />
          );
        }
        if (p.type === "sparkle") {
          return (
            <g key={p.id} transform={`translate(${p.x + p.cxe * 0.3}, ${p.y + p.cye * 0.3})`}>
              <polygon
                points={`0,${-p.size} ${p.size * 0.3},${-p.size * 0.3} ${p.size},0 ${p.size * 0.3},${p.size * 0.3} 0,${p.size} ${-p.size * 0.3},${p.size * 0.3} ${-p.size},0 ${-p.size * 0.3},${-p.size * 0.3}`}
                fill={p.color}
                className="anim-sparkle"
              />
            </g>
          );
        }
        // smoke
        return (
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={p.size}
            fill={p.color}
            opacity={0.3}
            className="anim-confetti"
            style={{
              ["--cx" as string]: "0px",
              ["--cy" as string]: "0px",
              ["--cxe" as string]: `${p.cxe}px`,
              ["--cye" as string]: `${p.cye}px`,
              ["--cr" as string]: "0deg",
              ["--cd" as string]: `${p.cd}s`,
            }}
          />
        );
      })}
    </g>
  );
}
