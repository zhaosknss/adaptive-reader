"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createArticle, findArticleBySourceUrl, listArticles } from "@/lib/storage";
import { previewText, readingMinutes } from "@/lib/text";
import type { Article, ExtractedArticle } from "@/lib/types";

export function HomeFeed() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [importing, setImporting] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    void listArticles().then((saved) => {
      if (active) {
        setArticles(saved);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);
  useEffect(() => { if (showComposer) titleRef.current?.focus(); }, [showComposer]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (title.trim().length < 2) return setError("请填写文章标题");
    if (content.trim().split(/\s+/).length < 10) return setError("正文太短了，请粘贴一段完整英文");
    const article = await createArticle(title, content);
    window.location.href = `/read/${article.id}`;
  }

  async function importFromUrl(event: React.FormEvent) {
    event.preventDefault();
    setUrlError("");
    if (!/^https?:\/\//i.test(url.trim())) return setUrlError("请粘贴完整的 http 或 https 网址");
    setImporting(true);
    try {
      let requestedUrl: string;
      try {
        requestedUrl = new URL(url.trim()).href;
      } catch {
        throw new Error("请输入完整的 http 或 https 网址");
      }
      const alreadySaved = await findArticleBySourceUrl(requestedUrl);
      if (alreadySaved) {
        window.location.assign(`/read/${alreadySaved.id}`);
        return;
      }
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const result = await response.json() as ExtractedArticle | { error: string };
      if (!response.ok || "error" in result) throw new Error("error" in result ? result.error : "无法导入这个网页");
      const existing = await findArticleBySourceUrl(result.sourceUrl);
      const article = existing ?? await createArticle(result.title, result.content, result.sourceUrl);
      window.location.assign(`/read/${article.id}`);
    } catch (reason) {
      setUrlError(reason instanceof Error ? reason.message : "无法导入这个网页");
      setImporting(false);
    }
  }

  return (
    <main className="home-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Just Read 首页">
          <span className="brand-mark">J</span><span>Just Read</span>
        </Link>
        <button className="quiet-button" onClick={() => setShowComposer(true)}>添加文章 <span>+</span></button>
      </header>

      <section className="hero">
        <p className="eyebrow">ENGLISH READING</p>
        <h1>不用学。<br />只管读。</h1>
        <p>放进一篇你真正想读的英文。不懂的词点一下，其他时间只阅读。</p>
        <button className="primary-button" onClick={() => setShowComposer(true)}>添加一篇英文 <span>→</span></button>
      </section>

      <section className="library" aria-live="polite">
        <div className="section-heading">
          <h2>最近阅读</h2><span>{articles.length ? `${articles.length} 篇` : "本机保存"}</span>
        </div>
        {loading ? (
          <div className="loading-row" />
        ) : articles.length === 0 ? (
          <button className="empty-library" onClick={() => setShowComposer(true)}>
            <span className="empty-aa">Aa</span>
            <span><strong>还没有文章</strong><small>粘贴英文正文，开始第一次阅读。</small></span>
          </button>
        ) : (
          <div className="article-list">
            {articles.map((article) => (
              <Link className="article-row" href={`/read/${article.id}`} key={article.id}>
                <span className={`status-mark ${article.status}`} aria-label={statusLabel(article.status)} />
                <span className="article-row-main">
                  <strong>{article.title}</strong>
                  <small>{previewText(article.content)}</small>
                </span>
                <span className="article-row-meta">
                  {article.status === "finished" ? "已读完" : article.status === "skipped" ? "已跳过" : article.status === "reading" ? "继续读" : `${readingMinutes(article.content)} 分钟`}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {showComposer && (
        <div className="modal-layer">
          <button className="modal-dismiss" onClick={() => setShowComposer(false)} aria-label="关闭粘贴文章弹层" />
          <section className="composer" role="dialog" aria-modal="true" aria-labelledby="composer-title">
            <button className="close-button" onClick={() => setShowComposer(false)} aria-label="关闭">×</button>
            <p className="eyebrow">NEW ARTICLE</p>
            <h2 id="composer-title">添加英文文章</h2>
            <p className="composer-hint">可以从公开文章网址提取正文，也可以直接粘贴。保存后的文章和阅读记录只存在这台设备上。</p>
            <form className="url-import" onSubmit={(event) => void importFromUrl(event)}>
              <label>文章网址<input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/article" inputMode="url" /></label>
              {urlError && <p className="form-error" role="alert">{urlError}</p>}
              <button className="secondary-button full-width" type="submit" disabled={importing}>
                {importing ? "正在提取正文…" : "从网址导入"}
              </button>
            </form>
            <div className="composer-divider"><span>或者直接粘贴</span></div>
            <form onSubmit={(event) => void save(event)}>
              <label>标题<input ref={titleRef} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="The title of the article" /></label>
              <label>正文<textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder={SAMPLE_PLACEHOLDER} /></label>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="primary-button full-width" type="submit">保存并开始阅读 <span>→</span></button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

function statusLabel(status: Article["status"]) {
  return status === "finished" ? "已读完" : status === "skipped" ? "已跳过" : status === "reading" ? "阅读中" : "未读";
}

const SAMPLE_PLACEHOLDER = "Paste the English article here.\n\nKeep the original paragraphs. Punctuation and spacing will stay exactly where they belong.";
