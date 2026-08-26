import assert from "node:assert/strict";
import test from "node:test";
import { extractArticleFromHtml } from "../lib/article-extraction.ts";

test("Readability extracts a title and clean paragraph text", () => {
  const paragraph = "Reading real articles should feel calm and natural, with enough context to understand ideas without turning every sentence into a lesson.";
  const html = `<!doctype html><html><head><title>Quiet Reading</title></head><body><nav>Menu</nav><article><h1>Quiet Reading</h1><p>${paragraph}</p><p>${paragraph}</p><p>${paragraph}</p><p>${paragraph}</p><p>${paragraph}</p></article><footer>Footer</footer></body></html>`;
  const result = extractArticleFromHtml(html, "https://example.com/story");
  assert.equal(result.title, "Quiet Reading");
  assert.equal(result.site, "example.com");
  assert.equal(result.sourceUrl, "https://example.com/story");
  assert.ok(result.content.includes(paragraph));
  assert.ok(!result.content.includes("Menu"));
  assert.ok(!result.content.includes("Footer"));
});

test("article extraction rejects pages without substantial prose", () => {
  const html = "<html><head><title>Links</title></head><body><main><p>Too short.</p></main></body></html>";
  assert.throws(() => extractArticleFromHtml(html, "https://example.com/links"));
});
