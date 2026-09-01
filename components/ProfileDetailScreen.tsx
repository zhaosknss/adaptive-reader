"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- Vinext's production Link prefetch currently throws during setup. */
import { useEffect, useState } from "react";
import { getVocabularyProfile, getWordStates, listArticles } from "@/lib/storage";
import { previewText } from "@/lib/text";
import type { Article, VocabularyProfile, WordState } from "@/lib/types";
import { ArticleComposer } from "./ArticleComposer";
import { BottomNav } from "./BottomNav";
import { ContentPreferenceSettings } from "./ContentPreferenceSettings";
import { Onboarding } from "./Onboarding";
import { ThemeSettings } from "./ThemeSettings";

export function ProfileDetailScreen({ section }: { section: string }) {
  const [profile, setProfile] = useState<VocabularyProfile | undefined>();
  const [lookedUpWords, setLookedUpWords] = useState<WordState[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [assessing, setAssessing] = useState(false);
  const [showComposer, setShowComposer] = useState(false);

  async function refreshData() {
    const [savedProfile, words, savedArticles] = await Promise.all([
      getVocabularyProfile(),
      getWordStates(),
      listArticles(),
    ]);
    setProfile(savedProfile);
    setLookedUpWords(sortLookedUpWords(words));
    setArticles(savedArticles);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    void Promise.all([getVocabularyProfile(), getWordStates(), listArticles()]).then(([savedProfile, words, savedArticles]) => {
      if (!active) return;
      setProfile(savedProfile);
      setLookedUpWords(sortLookedUpWords(words));
      setArticles(savedArticles);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  if (assessing) {
    return (
      <Onboarding
        allowContinue
        onComplete={() => { setAssessing(false); void refreshData(); }}
        onContinue={() => setAssessing(false)}
      />
    );
  }

  return (
    <main className="profile-shell profile-detail-shell">
      <header className="profile-topbar profile-detail-topbar">
        <a href="/me" aria-label="返回我的">←</a>
        <h1 className="profile-page-title">{sectionTitle(section)}</h1>
      </header>

      {section === "vocabulary" && (
        <section className="profile-section vocabulary-card profile-detail-section profile-stage">
          <div className="vocabulary-stage-content">
            {loading ? <div className="loading-row" /> : profile ? (
              <div className="vocabulary-rating"><strong>{vocabularyBand(profile.estimatedBand)}</strong><span>Level {profile.estimatedBand} / 5</span></div>
            ) : null}
            <button className="secondary-button" onClick={() => setAssessing(true)}>{profile ? "重新测试" : "开始测试"}</button>
          </div>
        </section>
      )}

      {section === "words" && (
        <section className="profile-section profile-detail-section">
          <div className="profile-section-heading"><h2>点过的词</h2><span>{lookedUpWords.length} 个</span></div>
          {lookedUpWords.length ? (
            <div className="word-history">
              {lookedUpWords.map((word) => (
                <div className="word-history-row" key={word.normalizedWord}>
                  <strong>{word.word}</strong><span>点击 {word.lookupCount} 次</span>
                </div>
              ))}
            </div>
          ) : <p className="profile-empty">阅读时点击的单词会出现在这里。</p>}
        </section>
      )}

      {section === "articles" && (
        <section className="profile-section profile-detail-section">
          <div className="profile-section-heading"><h2>阅读的文章</h2><span>{articles.length} 篇</span></div>
          {articles.length ? (
            <div className="profile-article-list">
              {articles.map((article) => (
                <a href={`/read/${article.id}?entry=history`} key={article.id}>
                  <strong>{article.title}</strong><span>{previewText(article.content)}</span>
                </a>
              ))}
            </div>
          ) : <p className="profile-empty">读过的文章会保存在这里。</p>}
        </section>
      )}

      {section === "settings" && (
        <section className="profile-section profile-detail-section profile-stage">
          <div className="settings-group">
            <button className="setting-row" onClick={() => setShowComposer(true)}><span>添加自己的文章</span><span>＋</span></button>
            <div className="setting-row static"><span>数据存储</span><span>仅本机</span></div>
          </div>
        </section>
      )}

      {section === "preferences" && (
        <section className="profile-section profile-detail-section">
          <ContentPreferenceSettings />
        </section>
      )}

      {section === "appearance" && (
        <section className="profile-section profile-detail-section profile-stage">
          <ThemeSettings />
        </section>
      )}

      {!VALID_SECTIONS.has(section) && <p className="profile-empty">这个页面不存在。</p>}

      <ArticleComposer open={showComposer} onClose={() => setShowComposer(false)} />
      <BottomNav active="me" />
    </main>
  );
}

const VALID_SECTIONS = new Set(["vocabulary", "words", "articles", "preferences", "appearance", "settings"]);

function sortLookedUpWords(words: WordState[]) {
  return words
    .filter((word) => word.lookupCount > 0)
    .sort((left, right) => (right.lastLookupAt ?? "").localeCompare(left.lastLookupAt ?? ""));
}

function sectionTitle(section: string) {
  return {
    vocabulary: "词汇量评级",
    words: "点过的词",
    articles: "阅读的文章",
    preferences: "阅读偏好",
    appearance: "外观",
    settings: "设置",
  }[section] ?? "我的";
}

function vocabularyBand(band: number) {
  return ["入门", "基础", "日常", "中等", "中高级", "进阶"][Math.min(5, Math.max(0, band))];
}
