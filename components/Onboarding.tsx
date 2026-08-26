"use client";

import { useMemo, useState } from "react";
import {
  assessmentWords,
  MAX_ASSESSMENT_ROUNDS,
  startAssessment,
  submitAssessmentRound,
  vocabularyProfileFromAssessment,
  WORDS_PER_ROUND,
  type AssessmentAnswer,
} from "@/lib/assessment";
import { saveVocabularyProfile } from "@/lib/storage";

type OnboardingProps = {
  allowContinue: boolean;
  onComplete: () => void;
  onContinue: () => void;
};

export function Onboarding({ allowContinue, onComplete, onContinue }: OnboardingProps) {
  const [started, setStarted] = useState(false);
  const [session, setSession] = useState(startAssessment);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [saving, setSaving] = useState(false);
  const words = useMemo(() => assessmentWords(session), [session]);
  const currentWord = words[answers.length];
  const answeredCount = session.roundIndex * WORDS_PER_ROUND + answers.length;
  const totalCount = MAX_ASSESSMENT_ROUNDS * WORDS_PER_ROUND;

  async function answer(value: AssessmentAnswer) {
    if (saving) return;
    const nextAnswers = [...answers, value];
    if (nextAnswers.length < WORDS_PER_ROUND) {
      setAnswers(nextAnswers);
      return;
    }

    const nextSession = submitAssessmentRound(session, nextAnswers);
    if (!nextSession.completed) {
      setSession(nextSession);
      setAnswers([]);
      return;
    }

    setSaving(true);
    await saveVocabularyProfile(vocabularyProfileFromAssessment(nextSession));
    onComplete();
  }

  if (!started) {
    return (
      <main className="onboarding-shell">
        <header className="onboarding-topbar">
          <span className="brand"><span className="brand-mark">J</span><span>Just Read</span></span>
        </header>
        <section className="welcome-card">
          <p className="eyebrow">A BETTER START</p>
          <h1>先找到你读起来<br />舒服的位置。</h1>
          <p>看一小组英文单词，凭第一感觉选择认识、不确定或不认识。不是考试，也不会给你一个夸张的“准确词汇量”。</p>
          <div className="welcome-actions">
            <button className="primary-button" onClick={() => setStarted(true)}>开始，大约 2 分钟 <span>→</span></button>
            {allowContinue && <button className="quiet-button" onClick={onContinue}>先继续阅读已有文章</button>}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="onboarding-shell assessment-shell">
      <header className="onboarding-topbar assessment-topbar">
        <span className="brand"><span className="brand-mark">J</span><span>Just Read</span></span>
        <span className="assessment-count">{Math.min(answeredCount + 1, totalCount)} / {totalCount}</span>
      </header>
      <div className="assessment-progress" aria-hidden="true"><span style={{ width: `${(answeredCount / totalCount) * 100}%` }} /></div>
      <section className="assessment-card" aria-live="polite">
        <p className="assessment-prompt">你认识这个词吗？</p>
        <h1>{currentWord}</h1>
        <div className="assessment-options">
          {ANSWER_OPTIONS.map((option) => (
            <button key={option.value} onClick={() => void answer(option.value)} disabled={saving}>
              <strong>{option.label}</strong><span>{option.hint}</span>
            </button>
          ))}
        </div>
        <p className="assessment-hint">不要猜太久，按第一感觉就好。</p>
      </section>
    </main>
  );
}

const ANSWER_OPTIONS: Array<{ value: AssessmentAnswer; label: string; hint: string }> = [
  { value: "known", label: "认识", hint: "我知道它的大概意思" },
  { value: "unsure", label: "不确定", hint: "眼熟，但说不准" },
  { value: "unknown", label: "不认识", hint: "没关系，继续就好" },
];
