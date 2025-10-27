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

  return index
    .map((entry): SearchIndexEntry => {
      const title = entry.title.toLowerCase();
      const description = (entry.description || "").toLowerCase();
      const content = entry.content.toLowerCase();
      const path = entry.path.toLowerCase();

      let score = 0;

      // Exact phrase match in title (highest priority)
      if (title.includes(normalizedQuery)) {
        score += 1000;
      }

      // Exact phrase match in description
      if (description.includes(normalizedQuery)) {
        score += 500;
      }

      // Exact phrase match in path
      if (path.includes(normalizedQuery)) {
        score += 300;
      }

      // Exact phrase match in content
      if (content.includes(normalizedQuery)) {
        score += 100;
      }

      // Individual word matches
      for (const word of words) {
        const wordRegex = new RegExp(`\\b${word}\\b`, "gi");

        // Title matches worth 50 points each
        const titleMatches = (title.match(wordRegex) || []).length;
        score += titleMatches * 50;

        // Description matches worth 25 points each
        const descMatches = (description.match(wordRegex) || []).length;
        score += descMatches * 25;

        // Path matches worth 15 points each
        const pathMatches = (path.match(wordRegex) || []).length;
        score += pathMatches * 15;

        // Content matches worth 1 point each
        const contentMatches = (content.match(wordRegex) || []).length;
        score += contentMatches * 1;
      }

      return { ...entry, score };
    })
    .filter((e) => (e.score ?? 0) > 0)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, max);
}
