"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder with the same dimensions to prevent layout shift
    return <div className="h-10 w-20 rounded-full bg-muted" />;
  }

  const isDark = theme === "dark";

  return (
    <div
      className="relative flex h-10 w-20 cursor-pointer items-center rounded-full bg-input/50 p-1 shadow-inner transition-colors hover:bg-input/70"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle theme"
    >
      {/* Sliding Thumb (The white/dark circle that moves) */}
      <div
        className={`absolute h-8 w-8 rounded-full bg-background shadow-md transition-transform duration-300 ease-in-out ${
          isDark ? "translate-x-10" : "translate-x-0"
        }`}
      />

      {/* Sun Icon (Left Side) */}
      <div className="z-10 flex w-1/2 items-center justify-center">
        <Sun
          className={`h-5 w-5 transition-colors duration-300 ${
            !isDark ? "text-orange-500 scale-110" : "text-muted-foreground/50"
          }`}
        />
      </div>

      {/* Moon Icon (Right Side) */}
      <div className="z-10 flex w-1/2 items-center justify-center">
        <Moon
          className={`h-5 w-5 transition-colors duration-300 ${
            isDark ? "text-blue-500 scale-110" : "text-muted-foreground/50"
          }`}
        />
      </div>
    </div>
  );
};

export default ThemeToggle;