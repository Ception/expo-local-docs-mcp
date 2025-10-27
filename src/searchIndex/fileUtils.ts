// src/searchIndex/fileUtils.ts
import { readdirSync, statSync, existsSync } from "fs";
import { join, relative } from "path";
import { parseMDXFile, getTitle } from "../mdxParser";
import type { SearchIndexEntry } from "./types";

/**
 * Recursively find all .mdx files in a directory
 */
export function findMDXFiles(dir: string, baseDir: string): string[] {
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
export function filePathToURLPath(filePath: string, baseDir: string): string {
  const relativePath = relative(baseDir, filePath);
  // Remove .mdx extension and normalize
  const urlPath = "/" + relativePath.replace(/\.mdx$/, "").replace(/\\/g, "/");
  return urlPath;
}

/**
 * Parse an MDX file and create a search index entry
 */
export function parseMDXFileForIndex(
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
