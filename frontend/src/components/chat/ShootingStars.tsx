import { useEffect, useState } from "react";

const ShootingStars = () => {
  const [shootingStars, setShootingStars] = useState<
    { id: number; top: string; left: string; delay: string; duration: string }[]
  >([]);

  const [staticStars, setStaticStars] = useState<
    { id: number; top: string; left: string; size: string; opacity: number; delay: string }[]
  >([]);

  useEffect(() => {
    // 1. Generate Shooting Stars (Moving)
    const generateShootingStars = () => {
      const newStars = Array.from({ length: 50 }).map((_, i) => ({
        id: i,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 10}s`, // Spread over 10s so they don't all come at once
        duration: `${Math.random() * 3 + 2}s`,
      }));
      setShootingStars(newStars);
    };

    // 2. Generate Static Stars (Twinkling Background)
    const generateStaticStars = () => {
      const newStaticStars = Array.from({ length: 100 }).map((_, i) => ({
        id: i,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: `${Math.random() * 2 + 1}px`, // Random size 1px-3px
        opacity: Math.random() * 0.7 + 0.3, // Random opacity
        delay: `${Math.random() * 5}s`, // Random twinkle delay
      }));
      setStaticStars(newStaticStars);
    };

    generateShootingStars();
    generateStaticStars();
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-gradient-to-b from-background via-background/90 to-primary/5">
      {/* CSS Animations */}
      <style>
        {`
          @keyframes shooting {
            0% { transform: translateX(0) translateY(0) rotate(45deg) scale(1); opacity: 1; }
            100% { transform: translateX(-500px) translateY(500px) rotate(45deg) scale(0.5); opacity: 0; }
          }
          @keyframes twinkle {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.3; transform: scale(0.5); }
          }
        `}
      </style>

      {/* Layer 1: Static Twinkling Stars */}
      {staticStars.map((star) => (
        <div
          key={`static-${star.id}`}
          className="absolute rounded-full bg-foreground/20 dark:bg-white/40"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
            animation: `twinkle ${Math.random() * 3 + 2}s infinite ease-in-out`,
            animationDelay: star.delay,
          }}
        />
      ))}

      {/* Layer 2: Shooting Stars */}
      {shootingStars.map((star) => (
        <span
          key={`shooting-${star.id}`}
          // Made height 1px (thinner) and width 80px (shorter) for a "smaller" look
          className="absolute h-[1px] w-[80px] bg-gradient-to-l from-transparent via-primary/80 to-transparent opacity-0 dark:via-white/80"
          style={{
            top: star.top,
            left: star.left,
            animation: `shooting ${star.duration} linear infinite`,
            animationDelay: star.delay,
          }}
        >
          {/* Star Head - Smaller (2px) */}
          <span className="absolute right-0 top-1/2 h-[2px] w-[2px] -translate-y-1/2 rounded-full bg-primary shadow-[0_0_5px_1px_rgba(124,58,237,0.5)] dark:bg-white" />
        </span>
      ))}
    </div>
  );
};

export default ShootingStars;