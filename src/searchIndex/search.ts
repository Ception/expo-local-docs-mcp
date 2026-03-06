// src/searchIndex/search.ts
import type { SearchIndexEntry } from "./types";
import { getIndex } from "./state";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createWordRegex(word: string): RegExp {
  const escaped = escapeRegExp(word);
  const useWordBoundary = /^[a-z0-9_]+$/i.test(word);
  const pattern = useWordBoundary ? `\\b${escaped}\\b` : escaped;
  return new RegExp(pattern, "gi");
}

function countMatches(text: string, regex: RegExp): number {
  return text.match(regex)?.length ?? 0;
}

/**
 * Search the index with improved scoring algorithm
 */
export function searchInIndex(
  query: string,
  max = 20,
  options?: { section?: string }
): SearchIndexEntry[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  const words = normalizedQuery.split(/\s+/).filter(Boolean);
  const index = getIndex();
  const normalizedSection = options?.section
    ?.trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "");

  // Pre-compile regex patterns for better performance
  const wordRegexes = words.map((word) => createWordRegex(word));

  const scoredEntries: SearchIndexEntry[] = [];

  for (const entry of index) {
    if (
      normalizedSection &&
      !entry.path.toLowerCase().startsWith(`/${normalizedSection}/`)
    ) {
      continue;
    }

    const title = entry.title.toLowerCase();
    const description = (entry.description || "").toLowerCase();
    const content = entry.content.toLowerCase();
    const path = entry.path.toLowerCase();

    let score = 0;

    // Exact phrase matches
    if (title.includes(normalizedQuery)) score += 1000;
    if (description.includes(normalizedQuery)) score += 500;
    if (path.includes(normalizedQuery)) score += 300;
    if (content.includes(normalizedQuery)) score += 100;

    // Individual word matches using pre-compiled regexes
    for (let i = 0; i < words.length; i++) {
      const wordRegex = wordRegexes[i];

      score += countMatches(title, wordRegex) * 50;
      score += countMatches(description, wordRegex) * 25;
      score += countMatches(path, wordRegex) * 15;
      score += countMatches(content, wordRegex) * 1;
    }

    // Only add entries with positive scores
    if (score > 0) {
      scoredEntries.push({ ...entry, score });
    }
  }

  // Sort and limit results
  return scoredEntries
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, max);
}
