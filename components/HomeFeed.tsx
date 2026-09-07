"use client";

import { useState } from "react";
import { selectCandidateByFullText } from "@/lib/article-selection";
import { RANKING_WEIGHTS, rankColdStartCandidates, recommendationSlate } from "@/lib/feed-ranking";
import { eligibleContentPools, filterCandidatesForReadingStage } from "@/lib/content-pools";
import { selectSavedReadingArticle, unreadCandidates } from "@/lib/reading-entry";
import {
  getVocabularyProfile,
  getContentPreferences,
  getInterestProfile,
  getLatestRecommendationEventForArticle,
  getReadingComfortProfile,
  getWordStates,
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
      const [articles, profile, interestProfile, contentPreferences, savedCandidates, wordStates, readingComfort] = await Promise.all([
        listArticles(),
        getVocabularyProfile(),
        getInterestProfile(),
        getContentPreferences(),
        listCandidateArticles(),
        getWordStates(),
        getReadingComfortProfile(),
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
        const pools = eligibleContentPools(profile, readingComfort);
        const response = await fetch(`/api/feed?pools=${encodeURIComponent(pools.join(","))}`);
        const result = await response.json() as { candidates?: CandidateArticle[] };
        if (response.ok && result.candidates) {
          await upsertCandidateArticles(result.candidates);
          candidates = await listCandidateArticles();
        }
      } catch {
        // Existing candidates remain usable when a source refresh is unavailable.
      }

      const eligibleCandidates = filterCandidatesForReadingStage(unreadCandidates(candidates, articles), profile, readingComfort);
      const ranked = rankColdStartCandidates(eligibleCandidates, profile, new Date(), interestProfile, contentPreferences, readingComfort);
      const selected = await selectCandidateByFullText(ranked, profile, wordStates, readingComfort);
      const { article, rankedCandidate: item, difficulty } = selected;
      const recommendation = await recordRecommendationSelection({
        candidate: item.candidate,
        articleId: article.id,
        entryPoint: "feed",
        rank: selected.originalRank,
        score: item.score,
        modelVersion: item.modelVersion,
        components: item.components,
        candidateSlate: recommendationSlate(ranked, item.candidate.id, article.id, 15, difficulty.score),
        rankingWeights: RANKING_WEIGHTS,
        vocabularyBand: item.vocabularyBand,
        targetDifficulty: item.targetDifficulty,
        comfortableWords: item.comfortableWords,
        difficultyTolerance: item.difficultyTolerance,
        successPhase: item.successPhase,
      });
      window.location.assign(`/read/${article.id}?entry=feed&recommendation=${recommendation.id}`);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "文章加载失败");
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
          {opening ? "正在加载…" : failed ? "重试" : "开始阅读"}
        </button>
        {message && <p className="reading-start-message" role="alert">{message}</p>}
      </section>
      <BottomNav active="read" />
    </main>
  );
}
