// src/searchIndex.ts
import { readdirSync, statSync, existsSync } from "fs";
import { join, relative } from "path";
import { parseMDXFile, getTitle, type MDXFrontmatter } from "./mdxParser";
import type { DiskCache } from "./diskCache";

export interface SearchIndexEntry {
  title: string;
  description?: string;
  content: string;
  path: string;
  filePath: string;
  frontmatter: MDXFrontmatter;
  score?: number;
}

let index: SearchIndexEntry[] = [];
let indexLoaded = false;
let diskCache: DiskCache | null = null;

export function setDiskCache(cache: DiskCache): void {
  diskCache = cache;
}

/**
 * Recursively find all .mdx files in a directory
 */
function findMDXFiles(dir: string, baseDir: string): string[] {
  const files: string[] = [];

  if (!existsSync(dir)) {
    console.error(`Directory not found: ${dir}`);
    return files;
  }

  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Recursively search subdirectories
      files.push(...findMDXFiles(fullPath, baseDir));
    } else if (entry.endsWith(".mdx")) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Convert file path to URL path
 * e.g., /expo-sdk/get-started/introduction.mdx -> /get-started/introduction
 */
function filePathToURLPath(filePath: string, baseDir: string): string {
  const relativePath = relative(baseDir, filePath);
  // Remove .mdx extension and normalize
  const urlPath = "/" + relativePath.replace(/\.mdx$/, "").replace(/\\/g, "/");
  return urlPath;
}

/**
 * Parse an MDX file and create a search index entry
 */
function parseMDXFileForIndex(
  filePath: string,
  baseDir: string
): SearchIndexEntry | null {
  try {
    const parsed = parseMDXFile(filePath);
    const title = getTitle(parsed.frontmatter, filePath);
    const urlPath = filePathToURLPath(filePath, baseDir);

    return {
      title,
      description: parsed.frontmatter.description as string | undefined,
      content: parsed.content,
      path: urlPath,
      filePath,
      frontmatter: parsed.frontmatter,
    };
  } catch (error) {
    console.error(`Failed to parse ${filePath}:`, error);
    return null;
  }
}

/**
 * Build search index from local .mdx files
 */
export async function loadSearchIndex(
  docsPath: string
): Promise<SearchIndexEntry[]> {
  if (indexLoaded && index.length > 0) {
    console.error(
      `Using existing in-memory index with ${index.length} entries`
    );
    return index;
  }

  // Try to load from disk cache first
  if (diskCache) {
    console.error("Attempting to load search index from disk cache...");
    const cachedIndex = diskCache.loadSearchIndex();
    if (cachedIndex.length > 0) {
      index = cachedIndex;
      indexLoaded = true;
      console.error(
        `✓ Loaded ${index.length} entries from disk cache in ${Math.round(
          performance.now()
        )}ms`
      );
      return index;
    } else {
      console.error("No cached index found on disk, building from files...");
    }
  }

  // Build index from .mdx files
  const startTime = performance.now();
  console.error(`Building search index from ${docsPath}...`);

  const mdxFiles = findMDXFiles(docsPath, docsPath);
  console.error(`Found ${mdxFiles.length} .mdx files`);

  const entries: SearchIndexEntry[] = [];

  for (const filePath of mdxFiles) {
    const entry = parseMDXFileForIndex(filePath, docsPath);
    if (entry) {
      entries.push(entry);
    }
  }

  index = entries;
  indexLoaded = true;

  const duration = Math.round(performance.now() - startTime);

  // Save the complete index to disk cache
  if (diskCache) {
    diskCache.saveSearchIndex(entries);
  }

  console.error(`✓ Indexed ${index.length} documents in ${duration}ms`);
  return index;
}

/**
 * Search the index with improved scoring algorithm
 */
export function searchInIndex(query: string, max = 20): SearchIndexEntry[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  const words = normalizedQuery.split(/\s+/).filter(Boolean);

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

/**
 * Get document by exact path match
 */
export function getDocumentByPath(path: string): SearchIndexEntry | null {
  // Normalize path
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

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
  return index.filter((entry) =>
    entry.path.toLowerCase().startsWith(`/${normalizedSection}/`)
  );
}

export function getIndexSize(): number {
  return index.length;
}

export function isIndexReady(): boolean {
  return indexLoaded && index.length > 0;
}

export function clearIndex(): void {
  index = [];
  indexLoaded = false;
}
