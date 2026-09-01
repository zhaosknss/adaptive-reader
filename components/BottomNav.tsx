"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- Vinext's production Link prefetch currently throws during setup. */

export function BottomNav({ active }: { active: "read" | "me" }) {
  return (
    <nav className="bottom-nav" aria-label="主要导航">
      <a className={active === "read" ? "active" : ""} href="/" aria-current={active === "read" ? "page" : undefined}>
        <span className="bottom-nav-mark">Aa</span>
        <span>阅读</span>
      </a>
      <a className={active === "me" ? "active" : ""} href="/me" aria-current={active === "me" ? "page" : undefined}>
        <span className="bottom-nav-mark">J</span>
        <span>我的</span>
      </a>
    </nav>
  );
}
