"use client";

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
        <ProfileMenuLink href="/me/vocabulary" title="阅读词汇水平" detail={profile ? `${vocabularyBand(profile.estimatedBand)} · ${profile.estimatedBand} / 5` : "未测试"} />
        <ProfileMenuLink href="/me/words" title="点过的词" detail={wordCount === null ? undefined : `${wordCount} 个`} />
        <ProfileMenuLink href="/me/articles" title="阅读的文章" detail={articleCount === null ? undefined : `${articleCount} 篇`} />
        <ProfileMenuLink href="/me/preferences" title="阅读偏好" />
        <ProfileMenuLink href="/me/appearance" title="外观" />
        <ProfileMenuLink href="/me/settings" title="设置" />
      </nav>

      <BottomNav active="me" />
    </main>
  );
}

function ProfileMenuLink({ href, title, detail }: { href: string; title: string; detail?: string }) {
  return (
    <a className="profile-menu-row" href={href}>
      <span><strong>{title}</strong>{detail && <small>{detail}</small>}</span>
      <span className="profile-menu-arrow" aria-hidden="true">→</span>
    </a>
  );
}

function vocabularyBand(band: number) {
  return ["入门", "基础", "日常", "中等", "中高级", "进阶"][Math.min(5, Math.max(0, band))];
}
