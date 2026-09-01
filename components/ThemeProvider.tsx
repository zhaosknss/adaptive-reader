"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import {
  browserThemeColor,
  DEFAULT_THEME_ACCENT,
  DEFAULT_THEME_MODE,
  normalizeThemeAccent,
  normalizeThemeMode,
  resolveThemeMode,
  THEME_STORAGE_KEYS,
  type ThemeAccent,
  type ThemeMode,
} from "@/lib/theme";

type ThemeContextValue = {
  mode: ThemeMode;
  accent: ThemeAccent;
  ready: boolean;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: ThemeAccent) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_CHANGE_EVENT = "just-read-theme-change";
const SERVER_THEME_SNAPSHOT = `${DEFAULT_THEME_MODE}:${DEFAULT_THEME_ACCENT}`;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribeToTheme, readThemeSnapshot, () => SERVER_THEME_SNAPSHOT);
  const [modeValue, accentValue] = snapshot.split(":");
  const mode = normalizeThemeMode(modeValue);
  const accent = normalizeThemeAccent(accentValue);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const resolved = resolveThemeMode(mode, media.matches);
      const root = document.documentElement;
      root.dataset.themePreference = mode;
      root.dataset.colorMode = resolved;
      root.dataset.accent = accent;
      root.style.colorScheme = resolved;
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", browserThemeColor(resolved));
    };

    apply();
    if (mode !== "system") return;
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [accent, mode]);

  function setMode(next: ThemeMode) {
    storeThemePreference(THEME_STORAGE_KEYS.mode, next);
  }

  function setAccent(next: ThemeAccent) {
    storeThemePreference(THEME_STORAGE_KEYS.accent, next);
  }

  return (
    <ThemeContext.Provider value={{ mode, accent, ready: true, setMode, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used within ThemeProvider");
  return value;
}

function subscribeToTheme(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
  };
}

function readThemeSnapshot() {
  try {
    const mode = normalizeThemeMode(localStorage.getItem(THEME_STORAGE_KEYS.mode));
    const accent = normalizeThemeAccent(localStorage.getItem(THEME_STORAGE_KEYS.accent));
    return `${mode}:${accent}`;
  } catch {
    return SERVER_THEME_SNAPSHOT;
  }
}

function storeThemePreference(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
    return;
  }
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}
