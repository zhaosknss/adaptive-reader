"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { getVocabularyProfile, getWordStates, listArticles } from "@/lib/storage";
import type { VocabularyProfile } from "@/lib/types";
import { BottomNav } from "./BottomNav";

export function ProfileScreen() {
  const [profile, setProfile] = useState<VocabularyProfile | undefined>();
  const [wordCount, setWordCount] = useState<number | null>(null);
  const [articleCount, setArticleCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([getVocabularyProfile(), getWordStates(), listArticles()]).then(([savedProfile, words, articles]) => {
      if (!active) return;
      setProfile(savedProfile);
      setWordCount(words.filter((word) => word.lookupCount > 0).length);
      setArticleCount(articles.length);
    });
    return () => { active = false; };
  }, []);

  return (
    <main className="profile-shell profile-home">
      <header className="profile-topbar">
        <h1 className="brand"><span className="brand-mark">J</span><span>我的</span></h1>
      </header>

      <nav className="profile-menu" aria-label="我的内容">
        <ProfileMenuLink href="/me/vocabulary" icon="level" title="阅读词汇水平" detail={profile ? `${vocabularyBand(profile.estimatedBand)} · ${profile.estimatedBand} / 5` : "未测试"} />
        <ProfileMenuLink href="/me/words" icon="words" title="点过的词" detail={wordCount === null ? undefined : `${wordCount} 个`} />
        <ProfileMenuLink href="/me/articles" icon="articles" title="阅读的文章" detail={articleCount === null ? undefined : `${articleCount} 篇`} />
        <ProfileMenuLink href="/me/preferences" icon="preferences" title="阅读偏好" />
        <ProfileMenuLink href="/me/appearance" icon="appearance" title="外观" />
        <ProfileMenuLink href="/me/settings" icon="settings" title="设置" />
      </nav>

      <BottomNav active="me" />
    </main>
  );
}

type ProfileIconName = "level" | "words" | "articles" | "preferences" | "appearance" | "settings";

function ProfileMenuLink({ href, icon, title, detail }: { href: string; icon: ProfileIconName; title: string; detail?: string }) {
  return (
    <a className="profile-menu-row" href={href}>
      <ProfileIcon name={icon} />
      <span className="profile-menu-copy"><strong>{title}</strong>{detail && <small>{detail}</small>}</span>
      <span className="profile-menu-arrow" aria-hidden="true">→</span>
    </a>
  );
}

function ProfileIcon({ name }: { name: ProfileIconName }) {
  const paths: Record<ProfileIconName, ReactNode> = {
    level: <><path d="M5 18v-4M10 18V9M15 18V5M4 18h12" /></>,
    words: <><path d="M4 5.5h9a3 3 0 0 1 3 3v7H7a3 3 0 0 1-3-3z" /><path d="M8 9h5M8 12h3" /></>,
    articles: <><path d="M6 3.5h7l3 3V18H6z" /><path d="M13 3.5V7h3M9 10h4M9 13h4" /></>,
    preferences: <><path d="M6 3.5h8v14l-4-2.5L6 17.5z" /><path d="M8.5 8h3" /></>,
    appearance: <><circle cx="10" cy="10" r="6.5" /><path d="M10 3.5v13a6.5 6.5 0 0 0 0-13z" /></>,
    settings: <><path d="M4 6h12M4 14h12" /><circle cx="8" cy="6" r="1.5" /><circle cx="13" cy="14" r="1.5" /></>,
  };

  return (
    <span className="profile-menu-icon" aria-hidden="true">
      <svg viewBox="0 0 20 20" focusable="false">{paths[name]}</svg>
    </span>
  );
}

function vocabularyBand(band: number) {
  return ["入门", "基础", "日常", "中等", "中高级", "进阶"][Math.min(5, Math.max(0, band))];
}
