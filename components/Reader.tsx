"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { prepareCandidateArticle } from "@/lib/candidate-import";
import { dictionaryProvider } from "@/lib/dictionary";
import { estimateDifficulty, type DifficultyEstimate } from "@/lib/difficulty";
import { rankColdStartCandidates } from "@/lib/feed-ranking";
import { frequencyProvider } from "@/lib/frequency";
import { beginReading, finishArticle, getArticle, getVocabularyProfile, getWordStates, listCandidateArticles, recordLookup, saveArticleDifficulty, saveDifficultyFeedback, skipArticle } from "@/lib/storage";
import { readingMinutes, tokenizePreservingText } from "@/lib/text";
import type { Article, DictionaryResult, DifficultyFeedback } from "@/lib/types";

export function Reader({ id }: { id: string }) {
  const [article, setArticle] = useState<Article | null>(null);
  const [missing, setMissing] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [definition, setDefinition] = useState<DictionaryResult | null>(null);
  const [definitionLoading, setDefinitionLoading] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [difficulty, setDifficulty] = useState<DifficultyEstimate | null>(null);
  const started = useRef(false);
  const sessionStartedAt = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    sessionStartedAt.current = Date.now();
    void getArticle(id).then(async (value) => {
      if (!active) return;
      if (!value) return setMissing(true);
      setArticle(value);
      if (!started.current) {
        started.current = true;
        const [wordStates, profile] = await Promise.all([getWordStates(), getVocabularyProfile()]);
        const estimate = estimateDifficulty(value.content, wordStates, frequencyProvider, profile);
        setDifficulty(estimate);
        await saveArticleDifficulty(value.id, estimate.score);
        await beginReading(value);
      }
    });
    return () => { active = false; };
  }, [id]);

  const paragraphs = useMemo(() => article?.content.split(/\n\s*\n+/).filter((item) => item.trim()) ?? [], [article]);

  async function lookup(word: string) {
    setSelectedWord(word);
    setDefinition(null);
    setDefinitionLoading(true);
    await recordLookup(id, word);
    try {
      setDefinition(await dictionaryProvider.lookup(word));
    } finally {
      setDefinitionLoading(false);
    }
  }

  async function markFinished() {
    setFinishing(true);
    await finishArticle(id, sessionDurationSeconds());
    await moveToNextArticle("finished");
  }

  async function skip() {
    setFinishing(true);
    await skipArticle(id, sessionDurationSeconds());
    await moveToNextArticle("skipped");
  }

  async function moveToNextArticle(result: "finished" | "skipped") {
    try {
      const [candidates, profile] = await Promise.all([listCandidateArticles(), getVocabularyProfile()]);
      const next = rankColdStartCandidates(candidates, profile)[0]?.candidate;
      if (next) {
        const nextArticle = await prepareCandidateArticle(next);
        window.location.assign(`/read/${nextArticle.id}`);
        return;
      }
    } catch {
      // Returning to For You keeps the current result saved and lets the user retry.
    }
    window.location.assign(`/?${result}=1`);
  }

  async function rateDifficulty(feedback: DifficultyFeedback) {
    const updated = await saveDifficultyFeedback(id, feedback);
    if (updated) setArticle(updated);
  }

  function sessionDurationSeconds() {
    return Math.max(0, Math.round((Date.now() - (sessionStartedAt.current ?? Date.now())) / 1000));
  }

  if (missing) {
    return <main className="reader-state"><p>这篇文章不在本机了。</p><Link href="/">返回首页</Link></main>;
  }

  if (!article) {
    return <main className="reader-state"><span className="reader-loading">J</span></main>;
  }

  return (
    <main className={selectedWord ? "reader-shell definition-open" : "reader-shell"}>
      <header className="reader-topbar">
        <Link href="/" className="back-link" aria-label="返回首页">← <span>阅读列表</span></Link>
        <span className="reading-time">{readingMinutes(article.content)} MIN READ</span>
        <div className="reader-actions">
          <button className="skip-top" onClick={() => void skip()} disabled={finishing}>跳过</button>
          <button className="finish-top" onClick={() => void markFinished()} disabled={finishing}>读完</button>
        </div>
      </header>

      <article className="reader-article">
        <header className="reader-title">
          <p className="eyebrow">JUST READ</p>
          <h1>{article.title}</h1>
          {article.sourceUrl && (
            <a className="source-link" href={article.sourceUrl} target="_blank" rel="noreferrer">
              查看原文 ↗
            </a>
          )}
          {difficulty && (
            <p className={`difficulty-note ${difficulty.label}`}>
              预计难度：{difficultyLabel(difficulty.label)}
              <span>低熟悉词 {Math.round(difficulty.metrics.unknownWordRatio * 100)}% · 平均句长 {difficulty.metrics.averageSentenceLength} 词</span>
            </p>
          )}
          <div className="reader-rule"><span />点击任意英文单词查看释义</div>
        </header>

        <section className="reader-copy" aria-label="英文正文">
          {paragraphs.map((paragraph, paragraphIndex) => (
            <p key={paragraphIndex}>
              {tokenizePreservingText(paragraph).map((token, tokenIndex) => token.type === "word" ? (
                <button
                  type="button"
                  className={selectedWord === token.normalized ? "reader-word selected" : "reader-word"}
                  data-word={token.normalized}
                  onClick={() => void lookup(token.normalized!)}
                  key={`${paragraphIndex}-${tokenIndex}`}
                >{token.value}</button>
              ) : <span key={`${paragraphIndex}-${tokenIndex}`}>{token.value}</span>)}
            </p>
          ))}
        </section>

        <footer className="finish-block">
          <span className="finish-ornament">J</span>
          <h2>读到这里就好。</h2>
          <p>不需要测验，也不需要复习。</p>
          <div className="difficulty-feedback" aria-label="文章难度反馈">
            <span>这篇对你来说</span>
            <div>
              {DIFFICULTY_OPTIONS.map((option) => (
                <button
                  type="button"
                  aria-pressed={article.userDifficultyFeedback === option.value}
                  className={article.userDifficultyFeedback === option.value ? "selected" : ""}
                  onClick={() => void rateDifficulty(option.value)}
                  key={option.value}
                >{option.label}</button>
              ))}
            </div>
          </div>
          <button className="primary-button" onClick={() => void markFinished()} disabled={finishing}>
            {finishing ? "正在准备下一篇…" : "读完，下一篇"} <span>→</span>
          </button>
        </footer>
      </article>

      {selectedWord && (
        <aside className="definition-sheet" aria-live="polite" aria-label={`${selectedWord} 的释义`}>
          <div className="definition-inner">
            <button className="definition-close" onClick={() => setSelectedWord(null)} aria-label="关闭释义">×</button>
            <div className="definition-word-row">
              <strong>{selectedWord}</strong>
              {definition?.phonetic && <span>{definition.phonetic}</span>}
            </div>
            {definitionLoading ? (
              <p className="definition-loading">正在查找中文释义…</p>
            ) : definition ? (
              <div className="definition-copy">
                <p className="translation">{definition.translation}</p>
                {definition.definition && <p className="english-definition">{definition.definition}</p>}
              </div>
            ) : null}
          </div>
        </aside>
      )}
    </main>
  );
}

function difficultyLabel(label: DifficultyEstimate["label"]) {
  return label === "easy" ? "偏简单" : label === "hard" ? "偏难" : "合适";
}

const DIFFICULTY_OPTIONS: Array<{ value: DifficultyFeedback; label: string }> = [
  { value: "too_easy", label: "太简单" },
  { value: "suitable", label: "正合适" },
  { value: "too_hard", label: "太难" },
];
