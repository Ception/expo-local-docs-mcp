// src/searchIndex.ts
import axios from "axios";
import * as cheerio from "cheerio";

export interface SearchIndexEntry {
  title?: string;
  content?: string;
  path?: string;
  score?: number;
}

let index: SearchIndexEntry[] = [];

async function fetchSitemap(baseUrl: string): Promise<string[]> {
  try {
    // Try to fetch a sitemap or get all navigation links
    const { data } = await axios.get(baseUrl);
    const $ = cheerio.load(data);
    const paths = new Set<string>();

    // Look for navigation links, sidebars, or any links to doc pages
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("/_") &&
        !href.includes("?")
      ) {
        paths.add(href);
      }
    });

    return Array.from(paths).slice(0, 100); // Limit to 100 pages for initial version
  } catch (error) {
    console.error("Error fetching sitemap:", error);
    return [];
  }
}

async function fetchPageContent(
  baseUrl: string,
  path: string
): Promise<SearchIndexEntry | null> {
  try {
    const { data } = await axios.get(`${baseUrl}${path}`);
    const $ = cheerio.load(data);

    const title = $("h1").first().text().trim() || $("title").text().trim();
    const content = $("main, article, .markdown-body, .docs-content")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();

    if (!title && !content) return null;

    return {
      title,
      content,
      path,
    };
  } catch (error) {
    // Silently skip pages that can't be fetched
    return null;
  }
}

export async function loadSearchIndex(baseUrl: string) {
  if (index.length) return index;

  console.log("Building search index by scraping Expo docs...");
  const paths = await fetchSitemap(baseUrl);
  console.log(`Found ${paths.length} pages to index`);

  const entries: SearchIndexEntry[] = [];

  for (const path of paths) {
    const entry = await fetchPageContent(baseUrl, path);
    if (entry) {
      entries.push(entry);
    }
  }

  index = entries;
  console.log(`Loaded ${index.length} entries into search index`);
  return index;
}

export function searchInIndex(query: string, max = 10): SearchIndexEntry[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];

  return index
    .map((entry) => {
      const text = `${entry.title ?? ""} ${entry.content ?? ""}`.toLowerCase();
      const score = words.reduce(
        (s: number, w: string) => s + (text.includes(w) ? 1 : 0),
        0
      );
      return { ...entry, score };
    })
    .filter((e) => (e.score ?? 0) > 0)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, max);
}
