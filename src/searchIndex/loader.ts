// src/searchIndex/loader.ts
import type { SearchIndexEntry } from "./types";
import {
  findMDXFilesWithMetadata,
  getDocsFingerprint,
  parseMDXFileForIndex,
} from "./fileUtils";
import {
  getIndex,
  setIndex,
  isIndexLoaded,
  setIndexLoaded,
  getDiskCache,
} from "./state";

/**
 * Build search index from local .mdx files
 */
export async function loadSearchIndex(
  docsPath: string
): Promise<SearchIndexEntry[]> {
  const index = getIndex();

  if (isIndexLoaded() && index.length > 0) {
    console.error(
      `Using existing in-memory index with ${index.length} entries`
    );
    return index;
  }

  const startTime = performance.now();
  const mdxFilesMetadata = findMDXFilesWithMetadata(docsPath, docsPath);
  const mdxFiles = mdxFilesMetadata.map((file) => file.filePath);
  const docsFingerprint = getDocsFingerprint(mdxFilesMetadata);

  // Try to load from disk cache first
  const diskCache = getDiskCache();
  if (diskCache) {
    console.error("Attempting to load search index from disk cache...");
    const cachedIndex = diskCache.loadSearchIndex(docsFingerprint);
    if (cachedIndex.length > 0) {
      setIndex(cachedIndex);
      setIndexLoaded(true);
      console.error(
        `✓ Loaded ${cachedIndex.length} entries from disk cache in ${Math.round(
          performance.now() - startTime
        )}ms`
      );
      return cachedIndex;
    } else {
      console.error("No cached index found on disk, building from files...");
    }
  }

  // Build index from .mdx files
  console.error(`Building search index from ${docsPath}...`);
  console.error(`Found ${mdxFiles.length} .mdx files`);

  const entries: SearchIndexEntry[] = [];

  for (const filePath of mdxFiles) {
    const entry = parseMDXFileForIndex(filePath, docsPath);
    if (entry) {
      entries.push(entry);
    }
  }

  setIndex(entries);
  setIndexLoaded(true);

  const duration = Math.round(performance.now() - startTime);

  // Save the complete index to disk cache
  if (diskCache) {
    diskCache.saveSearchIndex(entries, docsFingerprint);
  }

  console.error(`✓ Indexed ${entries.length} documents in ${duration}ms`);
  return entries;
}
