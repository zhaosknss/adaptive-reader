"use client";

import { useEffect, useState } from "react";
import { getVocabularyProfile, listArticles } from "@/lib/storage";
import { HomeFeed } from "./HomeFeed";
import { Onboarding } from "./Onboarding";

export function AppShell() {
  const [loading, setLoading] = useState(true);
  const [needsAssessment, setNeedsAssessment] = useState(false);
  const [hasExistingArticles, setHasExistingArticles] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([getVocabularyProfile(), listArticles()]).then(([profile, articles]) => {
      if (!active) return;
      setNeedsAssessment(!profile);
      setHasExistingArticles(articles.length > 0);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  if (loading) {
    return <main className="onboarding-shell onboarding-loading"><span className="reader-loading">J</span></main>;
  }

  if (needsAssessment) {
    return (
      <Onboarding
        allowContinue={hasExistingArticles}
        onComplete={() => setNeedsAssessment(false)}
        onContinue={() => setNeedsAssessment(false)}
      />
    );
  }

  return <HomeFeed />;
}
