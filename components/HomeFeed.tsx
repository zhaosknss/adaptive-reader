"use client";

import { useState } from "react";
import { prepareCandidateArticle } from "@/lib/candidate-import";
import { RANKING_WEIGHTS, rankColdStartCandidates, recommendationSlate } from "@/lib/feed-ranking";
import { selectSavedReadingArticle } from "@/lib/reading-entry";
import {
  getVocabularyProfile,
  getContentPreferences,
  getInterestProfile,
  getLatestRecommendationEventForArticle,
  listArticles,
  listCandidateArticles,
  recordRecommendationSelection,
  upsertCandidateArticles,
} from "@/lib/storage";
import type { CandidateArticle } from "@/lib/types";
import { BottomNav } from "./BottomNav";

export function HomeFeed() {
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [opening, setOpening] = useState(false);

  async function openNextArticle() {
    if (opening) return;
    setOpening(true);
    setFailed(false);
    setMessage("");
    try {
      const [articles, profile, interestProfile, contentPreferences, savedCandidates] = await Promise.all([
        listArticles(),
        getVocabularyProfile(),
        getInterestProfile(),
        getContentPreferences(),
        listCandidateArticles(),
      ]);

      const savedNext = selectSavedReadingArticle(articles);
      if (savedNext) {
        const recommendation = await getLatestRecommendationEventForArticle(savedNext.id);
        const recommendationQuery = recommendation ? `&recommendation=${recommendation.id}` : "";
        window.location.assign(`/read/${savedNext.id}?entry=resume${recommendationQuery}`);
        return;
      }

      let candidates = savedCandidates;
      try {
        const response = await fetch("/api/feed");
        const result = await response.json() as { candidates?: CandidateArticle[] };
        if (response.ok && result.candidates) {
          await upsertCandidateArticles(result.candidates);
          candidates = await listCandidateArticles();
        }
      } catch {
        // Existing candidates remain usable when a source refresh is unavailable.
      }

      const ranked = rankColdStartCandidates(candidates, profile, new Date(), interestProfile, contentPreferences);
      let lastError = "暂时没有可读的新文章";
      for (const [index, item] of ranked.entries()) {
        try {
          const article = await prepareCandidateArticle(item.candidate);
          const recommendation = await recordRecommendationSelection({
            candidate: item.candidate,
            articleId: article.id,
            entryPoint: "feed",
            rank: index + 1,
            score: item.score,
            modelVersion: item.modelVersion,
            components: item.components,
            candidateSlate: recommendationSlate(ranked, item.candidate.id, article.id),
            rankingWeights: RANKING_WEIGHTS,
            vocabularyBand: item.vocabularyBand,
            targetDifficulty: item.targetDifficulty,
          });
          window.location.assign(`/read/${article.id}?entry=feed&recommendation=${recommendation.id}`);
          return;
        } catch (reason) {
          lastError = reason instanceof Error ? reason.message : lastError;
        }
      }

      setMessage(lastError);
      setFailed(true);
      setOpening(false);
    } catch {
      setMessage("暂时无法准备文章，请稍后重试");
      setFailed(true);
      setOpening(false);
    }
  }

  return (
    <main className="profile-shell reading-home">
      <header className="profile-topbar">
        <h1 className="brand"><span className="brand-mark">J</span><span>阅读</span></h1>
      </header>
      <section className="reading-start" aria-live="polite">
        <span className="reading-start-mark" aria-hidden="true">Aa</span>
        <button
          className="primary-button start-reading-button"
          type="button"
          onClick={() => void openNextArticle()}
          disabled={opening}
        >
          {opening ? "正在准备…" : failed ? "再试一次" : "开始阅读"}
        </button>
        {message && <p className="reading-start-message" role="alert">{message}</p>}
      </section>
      <BottomNav active="read" />
    </main>
  );
}
