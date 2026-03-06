// src/searchIndex/fileUtils.ts
import { createHash } from "crypto";
import { readdirSync, statSync, existsSync } from "fs";
import { join, relative } from "path";
import { parseMDXFile, getTitle } from "../mdxParser";
import type { SearchIndexEntry } from "./types";

export interface MDXFileMetadata {
  filePath: string;
  relativePath: string;
  size: number;
  mtimeMs: number;
}

function collectMDXFilesWithMetadata(
  dir: string,
  baseDir: string,
  files: MDXFileMetadata[]
): void {
  const entries = readdirSync(dir).sort((a, b) => a.localeCompare(b));

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      collectMDXFilesWithMetadata(fullPath, baseDir, files);
      continue;
    }

    if (entry.endsWith(".mdx")) {
      files.push({
        filePath: fullPath,
        relativePath: relative(baseDir, fullPath).replace(/\\/g, "/"),
        size: stat.size,
        mtimeMs: stat.mtimeMs,
      });
    }
  }
}

/**
 * Recursively find all .mdx files in a directory
 */
export function findMDXFilesWithMetadata(
  dir: string,
  baseDir: string
): MDXFileMetadata[] {
  const files: MDXFileMetadata[] = [];

  if (!existsSync(dir)) {
    console.error(`Directory not found: ${dir}`);
    return files;
  }

  collectMDXFilesWithMetadata(dir, baseDir, files);

  return files;
}

/**
 * Recursively find all .mdx file paths in a directory
 */
export function findMDXFiles(dir: string, baseDir: string): string[] {
  return findMDXFilesWithMetadata(dir, baseDir).map((file) => file.filePath);
}

/**
 * Compute a deterministic fingerprint of the docs corpus for cache invalidation
 */
export function getDocsFingerprint(files: MDXFileMetadata[]): string {
  const hash = createHash("sha1");
  const sortedFiles = [...files].sort((a, b) =>
    a.relativePath.localeCompare(b.relativePath)
  );

  for (const file of sortedFiles) {
    hash.update(file.relativePath);
    hash.update(":");
    hash.update(String(file.size));
    hash.update(":");
    hash.update(String(Math.trunc(file.mtimeMs)));
    hash.update("\n");
  }

  return hash.digest("hex");
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
      codeBlocks: parsed.codeBlocks,
      path: urlPath,
      filePath,
      frontmatter: parsed.frontmatter,
    };
  } catch (error) {
    console.error(`Failed to parse ${filePath}:`, error);
    return null;
  }
}
