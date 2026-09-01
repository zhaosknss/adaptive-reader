"use client";

import { useEffect, useRef, useState } from "react";
import { createArticle, findArticleBySourceUrl } from "@/lib/storage";
import type { ExtractedArticle } from "@/lib/types";

export function ArticleComposer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [importing, setImporting] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) titleRef.current?.focus(); }, [open]);

  if (!open) return null;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (title.trim().length < 2) return setError("请填写文章标题");
    if (content.trim().split(/\s+/).length < 10) return setError("正文太短了，请粘贴一段完整英文");
    const article = await createArticle(title, content);
    window.location.assign(`/read/${article.id}`);
  }

  async function importFromUrl(event: React.FormEvent) {
    event.preventDefault();
    setUrlError("");
    if (!/^https?:\/\//i.test(url.trim())) return setUrlError("请粘贴完整的 http 或 https 网址");
    setImporting(true);
    try {
      const requestedUrl = new URL(url.trim()).href;
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
    <div className="modal-layer">
      <button className="modal-dismiss" onClick={onClose} aria-label="关闭添加文章弹层" />
      <section className="composer" role="dialog" aria-modal="true" aria-labelledby="composer-title">
        <button className="close-button" onClick={onClose} aria-label="关闭">×</button>
        <p className="eyebrow">ADD CONTENT</p>
        <h2 id="composer-title">添加英文文章</h2>
        <p className="composer-hint">从公开网址提取正文，或者直接粘贴。内容和阅读记录只保存在这台设备上。</p>
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
  );
}

const SAMPLE_PLACEHOLDER = "Paste the English article here.\n\nKeep the original paragraphs. Punctuation and spacing will stay exactly where they belong.";
