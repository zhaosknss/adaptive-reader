export const THEME_STORAGE_KEYS = {
  mode: "just-read:appearance",
  accent: "just-read:accent",
} as const;

export const THEME_MODES = ["system", "light", "dark"] as const;
export const THEME_ACCENTS = ["ocean", "jade", "plum", "graphite"] as const;

export type ThemeMode = (typeof THEME_MODES)[number];
export type ThemeAccent = (typeof THEME_ACCENTS)[number];
export type ResolvedThemeMode = Exclude<ThemeMode, "system">;

export const DEFAULT_THEME_MODE: ThemeMode = "system";
export const DEFAULT_THEME_ACCENT: ThemeAccent = "ocean";

export function normalizeThemeMode(value: string | null | undefined): ThemeMode {
  return THEME_MODES.includes(value as ThemeMode) ? value as ThemeMode : DEFAULT_THEME_MODE;
}

export function normalizeThemeAccent(value: string | null | undefined): ThemeAccent {
  return THEME_ACCENTS.includes(value as ThemeAccent) ? value as ThemeAccent : DEFAULT_THEME_ACCENT;
}

export function resolveThemeMode(mode: ThemeMode, systemPrefersDark: boolean): ResolvedThemeMode {
  return mode === "system" ? (systemPrefersDark ? "dark" : "light") : mode;
}

export function browserThemeColor(mode: ResolvedThemeMode) {
  return mode === "dark" ? "#151817" : "#F8F9FA";
}

export const THEME_INITIALIZER_SCRIPT = `(() => {
  const root = document.documentElement;
  const validModes = ["system", "light", "dark"];
  const validAccents = ["ocean", "jade", "plum", "graphite"];
  let mode = "system";
  let accent = "ocean";
  try {
    const savedMode = localStorage.getItem("${THEME_STORAGE_KEYS.mode}");
    const savedAccent = localStorage.getItem("${THEME_STORAGE_KEYS.accent}");
    if (validModes.includes(savedMode)) mode = savedMode;
    if (validAccents.includes(savedAccent)) accent = savedAccent;
  } catch {}
  const resolved = mode === "system"
    ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : mode;
  root.dataset.themePreference = mode;
  root.dataset.colorMode = resolved;
  root.dataset.accent = accent;
  root.style.colorScheme = resolved;
})();`;
