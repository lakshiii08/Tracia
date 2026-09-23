"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "default" | "pure-black" | "pure-white";
export type AccentColor = "blue" | "red" | "yellow" | "green";

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  accent: AccentColor;
  setAccent: (accent: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "tracia_theme";
const STORAGE_ACCENT_KEY = "tracia_accent";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("default");
  const [accent, setAccentState] = useState<AccentColor>("blue");

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (savedTheme && (savedTheme === "default" || savedTheme === "pure-black" || savedTheme === "pure-white")) {
        setThemeState(savedTheme);
        applyTheme(savedTheme);
      } else {
        applyTheme("default");
      }

      const savedAccent = window.localStorage.getItem(STORAGE_ACCENT_KEY) as AccentColor | null;
      if (savedAccent && (savedAccent === "blue" || savedAccent === "red" || savedAccent === "yellow" || savedAccent === "green")) {
        setAccentState(savedAccent);
        applyAccent(savedAccent);
      } else {
        applyAccent("blue");
      }
    } catch {
      applyTheme("default");
      applyAccent("blue");
    }
  }, []);

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;
    root.setAttribute("data-theme", mode);
    if (mode === "pure-white") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }
  };

  const applyAccent = (color: AccentColor) => {
    const root = document.documentElement;
    root.setAttribute("data-accent", color);
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    try {
      window.localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {}
  };

  const setAccent = (newAccent: AccentColor) => {
    setAccentState(newAccent);
    applyAccent(newAccent);
    try {
      window.localStorage.setItem(STORAGE_ACCENT_KEY, newAccent);
    } catch {}
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
