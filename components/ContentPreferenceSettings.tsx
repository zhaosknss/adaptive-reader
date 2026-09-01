"use client";

import { useEffect, useState } from "react";
import { CONTENT_PREFERENCE_OPTIONS, emptyContentPreferences } from "@/lib/content-preferences";
import { getContentPreferences, saveContentPreferences } from "@/lib/storage";
import type { ContentPreferenceKey, ContentPreferences } from "@/lib/types";

export function ContentPreferenceSettings() {
  const [preferences, setPreferences] = useState<ContentPreferences>(emptyContentPreferences());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void getContentPreferences().then((value) => {
      if (!active) return;
      setPreferences(value);
      setReady(true);
    });
    return () => { active = false; };
  }, []);

  async function persist(next: ContentPreferences) {
    setPreferences(next);
    const stored = await saveContentPreferences(next);
    setPreferences(stored);
  }

  function choosePrimary(key: ContentPreferenceKey) {
    const primary = preferences.primary === key ? null : key;
    const secondary = primary
      ? preferences.secondary.filter((item) => item !== key)
      : preferences.secondary;
    void persist({
      ...preferences,
      mode: primary || secondary.length ? "guided" : "open",
      primary,
      secondary,
    });
  }

  function toggleSecondary(key: ContentPreferenceKey) {
    const selected = preferences.secondary.includes(key);
    const primary = preferences.primary === key ? null : preferences.primary;
    const secondary = selected
      ? preferences.secondary.filter((item) => item !== key)
      : [...preferences.secondary, key];
    void persist({
      ...preferences,
      mode: primary || secondary.length ? "guided" : "open",
      primary,
      secondary,
    });
  }

  return (
    <fieldset className="preference-fieldset" disabled={!ready} aria-label="阅读偏好">
      <div className="preference-section">
        <div className="preference-heading"><strong>最想读</strong></div>
        <div className="preference-topic-grid" aria-label="最喜欢的文章类型">
          {CONTENT_PREFERENCE_OPTIONS.map((option) => (
            <button
              className={preferences.mode === "guided" && preferences.primary === option.key ? "selected" : ""}
              type="button"
              aria-pressed={preferences.mode === "guided" && preferences.primary === option.key}
              onClick={() => choosePrimary(option.key)}
              key={option.key}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="preference-section secondary">
        <div className="preference-heading"><strong>也感兴趣</strong></div>
        <div className="preference-chips" aria-label="其他感兴趣的文章类型">
          {CONTENT_PREFERENCE_OPTIONS.map((option) => {
            const selected = preferences.mode === "guided" && preferences.secondary.includes(option.key);
            return (
              <button
                className={selected ? "selected" : ""}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleSecondary(option.key)}
                key={option.key}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </fieldset>
  );
}
