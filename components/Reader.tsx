"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";
/* eslint-disable @next/next/no-html-link-for-pages -- Vinext's production Link prefetch currently throws during setup. */
import { prepareCandidateArticle } from "@/lib/candidate-import";
import { dictionaryProvider, NO_CHINESE_DEFINITION } from "@/lib/dictionary";
import { compactDefinition } from "@/lib/definition-display";
import { estimateDifficulty, type DifficultyEstimate } from "@/lib/difficulty";
import { RANKING_WEIGHTS, rankColdStartCandidates, recommendationSlate } from "@/lib/feed-ranking";
import { frequencyProvider } from "@/lib/frequency";
import { beginReading, finishArticle, getArticle, getContentPreferences, getInterestProfile, getVocabularyProfile, getWordStates, listCandidateArticles, recordLookup, recordRecommendationSelection, saveArticleDifficulty, saveDifficultyFeedback, skipArticle } from "@/lib/storage";
import { readingMinutes, readingParagraphs, tokenizePreservingText } from "@/lib/text";
import { lexicalContextHash, observeParagraphExposures } from "@/lib/visible-exposure";
import type { Article, DictionaryResult, DifficultyFeedback, ReadingEntryPoint } from "@/lib/types";
import { BottomNav } from "./BottomNav";

export function Reader({
  id,
  entryPoint = "direct",
  recommendationEventId = null,
}: {
  id: string;
  entryPoint?: ReadingEntryPoint;
  recommendationEventId?: string | null;
}) {
  const [article, setArticle] = useState<Article | null>(null);
  const [missing, setMissing] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [definition, setDefinition] = useState<DictionaryResult | null>(null);
  const [definitionLoading, setDefinitionLoading] = useState(false);
  const [definitionPosition, setDefinitionPosition] = useState<DefinitionPosition | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [difficulty, setDifficulty] = useState<DifficultyEstimate | null>(null);
  const started = useRef(false);
  const sessionStartedAt = useRef<number | null>(null);
  const activeReadingMs = useRef(0);
  const activeSegmentStartedAt = useRef<number | null>(null);
  const maxReadingProgress = useRef(0);
  const exposedWords = useRef(new Set<string>());
  const sessionLookupCount = useRef(0);
  const readerCopyRef = useRef<HTMLElement | null>(null);
  const definitionRef = useRef<HTMLElement | null>(null);
  const lookupRequestId = useRef(0);

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
        await beginReading(value, { entryPoint, recommendationEventId });
      }
    });
    return () => { active = false; };
  }, [entryPoint, id, recommendationEventId]);

  const articleId = article?.id;
  const articleContent = article?.content;
  const articleTitle = article?.title;
  const paragraphs = useMemo(
    () => articleContent && articleTitle ? readingParagraphs(articleTitle, articleContent) : [],
    [articleContent, articleTitle],
  );
  const compact = useMemo(
    () => definition ? compactDefinition(definition.translation) : null,
    [definition],
  );

  useEffect(() => {
    const readerCopy = readerCopyRef.current;
    if (!articleId || !readerCopy) return;
    const paragraphElements = [...readerCopy.querySelectorAll("[data-reader-paragraph]")];
    return observeParagraphExposures(articleId, paragraphElements, {
      onVisibleWords(words) {
        for (const word of words) exposedWords.current.add(word);
      },
    });
  }, [articleId, paragraphs]);

  useEffect(() => {
    if (!articleId) return;
    const startActiveSegment = () => {
      if (document.visibilityState === "visible" && activeSegmentStartedAt.current === null) {
        activeSegmentStartedAt.current = Date.now();
      }
    };
    const stopActiveSegment = () => {
      if (activeSegmentStartedAt.current === null) return;
      activeReadingMs.current += Date.now() - activeSegmentStartedAt.current;
      activeSegmentStartedAt.current = null;
    };
    const updateProgress = () => {
      const readerCopy = readerCopyRef.current;
      if (!readerCopy || readerCopy.clientHeight <= 0) return;
      const rect = readerCopy.getBoundingClientRect();
      const visibleEnd = Math.min(rect.height, Math.max(0, window.innerHeight - rect.top));
      maxReadingProgress.current = Math.max(maxReadingProgress.current, visibleEnd / rect.height);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") startActiveSegment();
      else stopActiveSegment();
    };

    startActiveSegment();
    updateProgress();
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      stopActiveSegment();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [articleId]);

  useEffect(() => {
    if (!selectedWord) return;
    const dismissOnPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (target?.closest(".reader-word") || definitionRef.current?.contains(target)) return;
      setSelectedWord(null);
    };
    const dismiss = () => setSelectedWord(null);
    const dismissOnKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    document.addEventListener("pointerdown", dismissOnPointerDown, true);
    window.addEventListener("scroll", dismiss, { passive: true });
    window.addEventListener("resize", dismiss);
    window.addEventListener("keydown", dismissOnKeyDown);
    return () => {
      document.removeEventListener("pointerdown", dismissOnPointerDown, true);
      window.removeEventListener("scroll", dismiss);
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("keydown", dismissOnKeyDown);
    };
  }, [selectedWord]);

  async function lookup(word: string, event: MouseEvent<HTMLButtonElement>) {
    const requestId = ++lookupRequestId.current;
    const lookupTimestamp = new Date().toISOString();
    const contextHash = lexicalContextHash(event.currentTarget.closest("[data-reader-paragraph]")?.textContent ?? word);
    setDefinitionPosition(positionDefinition(event.currentTarget.getBoundingClientRect()));
    setSelectedWord(word);
    setDefinition(null);
    setDefinitionLoading(true);
    sessionLookupCount.current += 1;
    try {
      const result = await dictionaryProvider.lookup(word);
      if (lookupRequestId.current === requestId) setDefinition(result);
      void recordLookup(id, word, {
        contextHash,
        dictionarySucceeded: result.source !== "fallback" && result.translation !== NO_CHINESE_DEFINITION,
        timestamp: lookupTimestamp,
      }).catch(() => {
        // A local persistence error should not block the definition from appearing.
      });
    } catch {
      void recordLookup(id, word, { contextHash, dictionarySucceeded: false, timestamp: lookupTimestamp }).catch(() => {
        // The failed UI interaction remains best-effort telemetry.
      });
    } finally {
      if (lookupRequestId.current === requestId) setDefinitionLoading(false);
    }
  }

  async function markFinished() {
    setFinishing(true);
    await finishArticle(id, readingOutcomeMetrics());
    await moveToNextArticle("finished");
  }

  async function skip() {
    setFinishing(true);
    await skipArticle(id, readingOutcomeMetrics());
    await moveToNextArticle("skipped");
  }

  async function moveToNextArticle(result: "finished" | "skipped") {
    try {
      const [candidates, profile, interestProfile, contentPreferences] = await Promise.all([
        listCandidateArticles(),
        getVocabularyProfile(),
        getInterestProfile(),
        getContentPreferences(),
      ]);
      const ranked = rankColdStartCandidates(candidates, profile, new Date(), interestProfile, contentPreferences);
      const next = ranked[0];
      if (next) {
        const nextArticle = await prepareCandidateArticle(next.candidate);
        const recommendation = await recordRecommendationSelection({
          candidate: next.candidate,
          articleId: nextArticle.id,
          entryPoint: "next_article",
          rank: 1,
          score: next.score,
          modelVersion: next.modelVersion,
          components: next.components,
          candidateSlate: recommendationSlate(ranked, next.candidate.id, nextArticle.id),
          rankingWeights: RANKING_WEIGHTS,
          vocabularyBand: next.vocabularyBand,
          targetDifficulty: next.targetDifficulty,
        });
        window.location.assign(`/read/${nextArticle.id}?entry=next_article&recommendation=${recommendation.id}`);
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

  function readingOutcomeMetrics() {
    return {
      readingTimeSeconds: sessionDurationSeconds(),
      activeReadingSeconds: currentActiveReadingSeconds(),
      maxReadingProgress: Number(Math.min(1, maxReadingProgress.current).toFixed(3)),
      lookupCount: sessionLookupCount.current,
      exposedUniqueWordCount: exposedWords.current.size,
      recommendationEventId,
      entryPoint,
    };
  }

  function currentActiveReadingSeconds() {
    const currentSegment = activeSegmentStartedAt.current === null ? 0 : Date.now() - activeSegmentStartedAt.current;
    return Math.max(0, Math.round((activeReadingMs.current + currentSegment) / 1000));
  }

  if (missing) {
    return <main className="reader-state"><p>未找到这篇文章</p><a href="/">返回阅读</a></main>;
  }

  if (!article) {
    return <main className="reader-state"><span className="reader-loading">J</span></main>;
  }

  return (
    <main className="reader-shell">
      <header className="reader-topbar">
        <a href="/" className="reader-brand" aria-label="返回当前阅读"><span className="brand-mark">J</span></a>
        <span className="reading-time">{readingMinutes(article.content)} MIN READ</span>
        <div className="reader-actions">
          <button className="skip-top" onClick={() => void skip()} disabled={finishing}>跳过</button>
        </div>
      </header>

      <article className="reader-article">
        <header className="reader-title">
          <p className="eyebrow">JUST READ</p>
          <h1>{article.title}</h1>
          <div className="reader-meta">
            {difficulty && (
              <p className={`difficulty-note ${difficulty.label}`}>
                {difficultyLabel(difficulty.label)}
              </p>
            )}
            {article.sourceUrl && (
              <a className="source-link" href={article.sourceUrl} target="_blank" rel="noreferrer">
                查看原文 ↗
              </a>
            )}
          </div>
          <div className="reader-rule"><span />点词查看释义</div>
        </header>

        <section className="reader-copy" aria-label="英文正文" ref={readerCopyRef}>
          {paragraphs.map((paragraph, paragraphIndex) => (
            <p data-reader-paragraph key={paragraphIndex}>
              {tokenizePreservingText(paragraph).map((token, tokenIndex) => token.type === "word" ? (
                <button
                  type="button"
                  className={selectedWord === token.normalized ? "reader-word selected" : "reader-word"}
                  data-word={token.normalized}
                  onClick={(event) => void lookup(token.normalized!, event)}
                  key={`${paragraphIndex}-${tokenIndex}`}
                >{token.value}</button>
              ) : <span key={`${paragraphIndex}-${tokenIndex}`}>{token.value}</span>)}
            </p>
          ))}
        </section>

        <footer className="finish-block">
          <span className="finish-ornament">J</span>
          <div className="difficulty-feedback" aria-label="文章难度反馈">
            <span>文章难度</span>
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
            {finishing ? "正在准备下一篇…" : "下一篇"} <span>→</span>
          </button>
        </footer>
      </article>

      <BottomNav active="read" />

      {selectedWord && definitionPosition && (
        <aside
          className={`definition-popover ${definitionPosition.placement}`}
          style={{ left: definitionPosition.left, top: definitionPosition.top } as CSSProperties}
          aria-live="polite"
          aria-label={`${selectedWord} 的释义`}
          ref={definitionRef}
        >
          <button className="definition-close" onClick={() => setSelectedWord(null)} aria-label="关闭释义">×</button>
          <div className="definition-word-row">
            <strong>{selectedWord}</strong>
            {compact?.partOfSpeech && (
              <span className="part-of-speech">{compact.partOfSpeech}</span>
            )}
          </div>
          {definitionLoading ? (
            <p className="definition-loading" aria-label="正在查找释义">···</p>
          ) : definition ? (
            <p className="translation">{compact?.meaning}</p>
          ) : null}
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

type DefinitionPosition = {
  left: number;
  top: number;
  placement: "above" | "below";
};

function positionDefinition(rect: DOMRect): DefinitionPosition {
  const width = Math.min(288, window.innerWidth - 24);
  const left = Math.min(window.innerWidth - width / 2 - 12, Math.max(width / 2 + 12, rect.left + rect.width / 2));
  const placement = rect.top > 150 ? "above" : "below";
  return {
    left,
    top: placement === "above" ? rect.top - 10 : rect.bottom + 10,
    placement,
  };
}
