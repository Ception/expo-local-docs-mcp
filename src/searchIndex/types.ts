// src/searchIndex/types.ts
import type { MDXFrontmatter } from "../mdxParser";

export interface SearchIndexEntry {
  title: string;
  description?: string;
  content: string;
  path: string;
  filePath: string;
  frontmatter: MDXFrontmatter;
  score?: number;
}
