"use client";

import { useTheme } from "./ThemeProvider";
import { THEME_ACCENTS, THEME_MODES, type ThemeAccent, type ThemeMode } from "@/lib/theme";

const MODE_LABELS: Record<ThemeMode, string> = {
  system: "跟随系统",
  light: "白天",
  dark: "黑夜",
};

const ACCENT_LABELS: Record<ThemeAccent, string> = {
  ocean: "深海蓝",
  jade: "青绿色",
  plum: "紫灰色",
  graphite: "炭黑色",
};

export function ThemeSettings() {
  const { mode, accent, ready, setMode, setAccent } = useTheme();

  return (
    <div className="theme-settings">
      <fieldset className="theme-fieldset" disabled={!ready} aria-label="外观模式">
        <div className="theme-segment" role="radiogroup" aria-label="外观模式">
          {THEME_MODES.map((option) => (
            <button
              type="button"
              role="radio"
              aria-checked={mode === option}
              className={mode === option ? "selected" : ""}
              onClick={() => setMode(option)}
              key={option}
            >
              {MODE_LABELS[option]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="theme-fieldset" disabled={!ready}>
        <legend>主题颜色</legend>
        <div className="theme-swatches" role="radiogroup" aria-label="主题颜色">
          {THEME_ACCENTS.map((option) => (
            <button
              type="button"
              role="radio"
              aria-checked={accent === option}
              aria-label={ACCENT_LABELS[option]}
              title={ACCENT_LABELS[option]}
              className={accent === option ? "selected" : ""}
              onClick={() => setAccent(option)}
              key={option}
            >
              <span className={`theme-swatch ${option}`} aria-hidden="true" />
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
