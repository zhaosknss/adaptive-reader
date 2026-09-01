import { recordExposures } from "./storage.ts";
import { uniqueWords } from "./text.ts";

type ObserverLike = Pick<IntersectionObserver, "disconnect" | "observe" | "unobserve">;
type ObserverFactory = (
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit,
) => ObserverLike;

type VisibilityDocument = Pick<Document, "visibilityState" | "addEventListener" | "removeEventListener">;

type ExposureDependencies = {
  createObserver?: ObserverFactory;
  record?: typeof recordExposures;
  documentRef?: VisibilityDocument | null;
  visibilityDelayMs?: number;
  onVisibleWords?: (words: readonly string[]) => void;
};

const MIN_VISIBLE_RATIO = 0.2;
const DEFAULT_VISIBILITY_DELAY_MS = 700;

export function observeParagraphExposures(
  articleId: string,
  paragraphs: readonly Element[],
  dependencies: ExposureDependencies = {},
) {
  if (!paragraphs.length) return () => undefined;

  const createObserver = dependencies.createObserver
    ?? (typeof IntersectionObserver === "undefined"
      ? null
      : (callback: IntersectionObserverCallback, options: IntersectionObserverInit) => new IntersectionObserver(callback, options));
  if (!createObserver) return () => undefined;

  const record = dependencies.record ?? recordExposures;
  const documentRef = dependencies.documentRef === undefined
    ? (typeof document === "undefined" ? null : document)
    : dependencies.documentRef;
  const visibilityDelayMs = dependencies.visibilityDelayMs ?? DEFAULT_VISIBILITY_DELAY_MS;
  const completed = new WeakSet<Element>();
  const pending = new WeakSet<Element>();
  const visible = new Set<Element>();
  const timers = new Map<Element, ReturnType<typeof setTimeout>>();

  const isDocumentVisible = () => !documentRef || documentRef.visibilityState === "visible";
  const clearTimer = (paragraph: Element) => {
    const timer = timers.get(paragraph);
    if (timer !== undefined) clearTimeout(timer);
    timers.delete(paragraph);
  };

  const schedule = (paragraph: Element) => {
    if (completed.has(paragraph) || pending.has(paragraph) || timers.has(paragraph) || !isDocumentVisible()) return;
    timers.set(paragraph, setTimeout(() => {
      timers.delete(paragraph);
      if (!visible.has(paragraph) || completed.has(paragraph) || pending.has(paragraph) || !isDocumentVisible()) return;

      const words = uniqueWords(paragraph.textContent ?? "");
      if (!words.length) {
        completed.add(paragraph);
        observer.unobserve(paragraph);
        return;
      }

      dependencies.onVisibleWords?.(words);
      pending.add(paragraph);
      void record(articleId, words, lexicalContextHash(paragraph.textContent ?? "")).then(() => {
        pending.delete(paragraph);
        completed.add(paragraph);
        visible.delete(paragraph);
        observer.unobserve(paragraph);
      }).catch(() => {
        pending.delete(paragraph);
      });
    }, visibilityDelayMs));
  };

  const observer = createObserver((entries) => {
    for (const entry of entries) {
      const paragraph = entry.target;
      const intersectionRatio = Number.isFinite(entry.intersectionRatio) ? entry.intersectionRatio : 1;
      if (entry.isIntersecting && intersectionRatio >= MIN_VISIBLE_RATIO) {
        visible.add(paragraph);
        schedule(paragraph);
      } else {
        visible.delete(paragraph);
        clearTimer(paragraph);
      }
    }
  }, {
    root: null,
    rootMargin: "0px 0px -10% 0px",
    threshold: MIN_VISIBLE_RATIO,
  });

  const onVisibilityChange = () => {
    if (!isDocumentVisible()) {
      for (const paragraph of timers.keys()) clearTimer(paragraph);
      return;
    }
    for (const paragraph of visible) schedule(paragraph);
  };
  documentRef?.addEventListener("visibilitychange", onVisibilityChange);

  for (const paragraph of paragraphs) observer.observe(paragraph);
  return () => {
    for (const paragraph of timers.keys()) clearTimer(paragraph);
    documentRef?.removeEventListener("visibilitychange", onVisibilityChange);
    observer.disconnect();
  };
}

export function lexicalContextHash(text: string) {
  let hash = 2_166_136_261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return `ctx-${(hash >>> 0).toString(36)}`;
}
