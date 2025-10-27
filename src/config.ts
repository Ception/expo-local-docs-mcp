// src/config.ts
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

export interface ServerConfig {
  docsPath: string;
  cacheDir: string;
  maxResults: number;
  cacheMaxAge: number;
}

/**
 * Get the package root directory.
 * When installed via npm/npx, this resolves to node_modules/expo-local-docs-mcp/
 * When running locally, this resolves to the project root
 */
function getPackageRoot(): string {
  // Try to get the directory of this file
  let currentDir: string;

  try {
    // ESM way
    currentDir = dirname(fileURLToPath(import.meta.url));
  } catch {
    // Fallback for bundled code
    currentDir = __dirname;
  }

  // Walk up from src/ to find package root (where expo-sdk/ lives)
  // This handles both development (src/config.ts) and built (dist/server.js)
  let searchDir = currentDir;
  for (let i = 0; i < 3; i++) {
    const testPath = resolve(searchDir, "expo-sdk");
    if (existsSync(testPath)) {
      return searchDir;
    }
    searchDir = resolve(searchDir, "..");
  }

  // Fallback to current directory
  return process.cwd();
}

function getConfig(): ServerConfig {
  const packageRoot = getPackageRoot();

  return {
    // Path to the expo-sdk folder containing .mdx files
    // Default to package installation directory
    docsPath: process.env.EXPO_DOCS_PATH
      ? resolve(process.env.EXPO_DOCS_PATH)
      : resolve(packageRoot, "expo-sdk"),

    // Cache directory for search index
    // Use OS temp dir for npm installations, local for development
    cacheDir: process.env.EXPO_CACHE_DIR
      ? resolve(process.env.EXPO_CACHE_DIR)
      : resolve(packageRoot, ".expo-cache"),

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
