// src/searchIndex/search.ts
import type { SearchIndexEntry } from "./types";
import { getIndex } from "./state";

/**
 * Search the index with improved scoring algorithm
 */
export function searchInIndex(query: string, max = 20): SearchIndexEntry[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  const words = normalizedQuery.split(/\s+/).filter(Boolean);
  const index = getIndex();

  // Pre-compile regex patterns for better performance
  const wordRegexes = words.map((word) => new RegExp(`\\b${word}\\b`, "gi"));

  return index
    .map((entry): SearchIndexEntry => {
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

        score += (title.match(wordRegex) || []).length * 50;
        score += (description.match(wordRegex) || []).length * 25;
        score += (path.match(wordRegex) || []).length * 15;
        score += (content.match(wordRegex) || []).length * 1;
      }

      return { ...entry, score };
    })
    .filter((e) => (e.score ?? 0) > 0)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, max);
}
