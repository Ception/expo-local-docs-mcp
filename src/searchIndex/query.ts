// src/searchIndex/query.ts
import type { SearchIndexEntry } from "./types";
import { getIndex } from "./state";

/**
 * Get document by exact path match
 */
export function getDocumentByPath(path: string): SearchIndexEntry | null {
  // Normalize path
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const index = getIndex();

  return (
    index.find(
      (entry) =>
        entry.path === normalizedPath ||
        entry.path === normalizedPath.replace(/\/$/, "") ||
        entry.path + "/" === normalizedPath
    ) || null
  );
}

/**
 * Get all sections (top-level directories)
 */
export function getSections(): { name: string; count: number; path: string }[] {
  const sections = new Map<string, number>();
  const index = getIndex();

  for (const entry of index) {
    // Get first path segment
    const segments = entry.path.split("/").filter(Boolean);
    if (segments.length > 0) {
      const section = segments[0];
      sections.set(section, (sections.get(section) || 0) + 1);
    }
  }

  return Array.from(sections.entries())
    .map(([name, count]) => ({ name, count, path: `/${name}` }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get documents in a specific section
 */
export function getDocumentsBySection(section: string): SearchIndexEntry[] {
  const normalizedSection = section.toLowerCase();
  const index = getIndex();

  return index.filter((entry) =>
    entry.path.toLowerCase().startsWith(`/${normalizedSection}/`)
  );
}
