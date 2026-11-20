import React, { useEffect, useState } from 'react';
import { FloatingReaction } from '../types';

interface FloatingReactionsProps {
  reactions: FloatingReaction[];
}

interface ReactionParticle extends FloatingReaction {
  id: string;
  speed: number;
  rotation: number;
  scale: number;
}

export const FloatingReactions: React.FC<FloatingReactionsProps> = ({ reactions }) => {
  const [particles, setParticles] = useState<ReactionParticle[]>([]);

  useEffect(() => {
    if (reactions.length === 0) return;
    const latest = reactions[reactions.length - 1];

    const newParticle: ReactionParticle = {
      ...latest,
      speed: 2 + Math.random() * 2,
      rotation: (Math.random() - 0.5) * 30,
      scale: 0.9 + Math.random() * 0.4,
    };

    setParticles((prev) => [...prev.slice(-15), newParticle]);

    const timer = setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== latest.id));
    }, 3800);

    return () => clearTimeout(timer);
  }, [reactions]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-30 select-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute flex flex-col items-center animate-float-fade"
          style={{
            left: `${p.x}%`,
            bottom: `${p.y}%`,
            transform: `scale(${p.scale}) rotate(${p.rotation}deg)`,
            animation: 'romanticFloat 3.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
          }}
        >
          <span className="text-4xl sm:text-5xl drop-shadow-md filter select-none">
            {p.emoji}
          </span>
          {p.senderName && (
            <span className="text-[10px] font-medium text-rose-200/90 bg-black/60 px-1.5 py-0.5 rounded-full mt-1 backdrop-blur-sm whitespace-nowrap shadow">
              {p.senderName}
            </span>
          )}
        </div>
      ))}
      <style>{`
        @keyframes romanticFloat {
          0% {
            opacity: 0;
            transform: translateY(0px) scale(0.6) rotate(0deg);
          }
          15% {
            opacity: 1;
            transform: translateY(-40px) scale(1.1) rotate(5deg);
          }
          50% {
            transform: translateY(-160px) scale(1) rotate(-5deg);
          }
          80% {
            opacity: 0.8;
          }
          100% {
            opacity: 0;
            transform: translateY(-320px) scale(0.8) rotate(8deg);
          }
        }
      `}</style>
    </div>
  );
};
