import { Reader } from "@/components/Reader";
import type { ReadingEntryPoint } from "@/lib/types";

export default async function ReadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ entry?: string; recommendation?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  return (
    <Reader
      id={id}
      entryPoint={normalizeEntryPoint(query.entry)}
      recommendationEventId={query.recommendation ?? null}
    />
  );
}

function normalizeEntryPoint(value?: string): ReadingEntryPoint {
  return value === "feed" || value === "next_article" || value === "resume" || value === "history"
    ? value
    : "direct";
}
