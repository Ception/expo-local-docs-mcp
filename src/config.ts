// src/config.ts
import { resolve } from "path";

export interface ServerConfig {
  docsPath: string;
  cacheDir: string;
  maxResults: number;
  cacheMaxAge: number;
}

function getConfig(): ServerConfig {
  return {
    // Path to the expo-sdk folder containing .mdx files
    docsPath: resolve(process.env.EXPO_DOCS_PATH || "./expo-sdk"),
    // Cache directory for search index
    cacheDir: resolve(process.env.EXPO_CACHE_DIR || "./.expo-cache"),
    // Maximum search results to return
    maxResults: parseInt(process.env.EXPO_DOCS_MAX_RESULTS || "20", 10),
    // Cache max age: 24 hours (much longer since we're reading local files)
    cacheMaxAge: parseInt(
      process.env.EXPO_DOCS_CACHE_MAX_AGE || "86400000",
      10
    ),
  };
}

export const config = getConfig();
