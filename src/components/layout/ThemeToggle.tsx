"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

type ThemeMode = "light" | "dark";

function resolveInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";

  const saved = window.localStorage.getItem("chronos-theme");
  if (saved === "light" || saved === "dark") return saved;

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(() => resolveInitialTheme());

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;

    root.classList.toggle("dark", nextTheme === "dark");
    window.localStorage.setItem("chronos-theme", nextTheme);
    setTheme(nextTheme);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-slate-200" />
      ) : (
        <Moon className="h-5 w-5 text-slate-600" />
      )}
    </Button>
  );
}
