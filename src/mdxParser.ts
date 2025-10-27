// src/mdxParser.ts
import { readFileSync } from "fs";
import { resolve } from "path";

export interface MDXFrontmatter {
  title?: string;
  description?: string;
  sourceCodeUrl?: string;
  packageName?: string;
  platforms?: string[];
  hideTOC?: boolean;
  [key: string]: unknown;
}

export interface ParsedMDX {
  frontmatter: MDXFrontmatter;
  content: string;
  codeBlocks?: string[];
}

/**
 * Parse frontmatter from MDX content
 */
function parseFrontmatter(content: string): {
  frontmatter: MDXFrontmatter;
  content: string;
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, content };
  }

  const [, frontmatterStr, restContent] = match;
  const frontmatter: MDXFrontmatter = {};

  // Parse YAML-like frontmatter (simple key-value pairs)
  const lines = frontmatterStr.split("\n");
  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value: string | boolean | string[] = line.slice(colonIndex + 1).trim();

    // Remove quotes
    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      value = value.slice(1, -1);
    }

    // Parse boolean
    if (value === "true") value = true;
    if (value === "false") value = false;

    // Parse arrays (simple bracket notation)
    if (
      typeof value === "string" &&
      value.startsWith("[") &&
      value.endsWith("]")
    ) {
      value = value
        .slice(1, -1)
        .split(",")
        .map((v) => v.trim().replace(/^['"]|['"]$/g, ""));
    }

    frontmatter[key] = value;
  }

  return { frontmatter, content: restContent };
}

/**
 * Extract code blocks from MDX content
 */
function extractCodeBlocks(content: string): string[] {
  const codeBlockRegex = /```[\w]*[\s\S]*?\n([\s\S]*?)```/g;
  const blocks: string[] = [];
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const code = match[1].trim();
    if (code) {
      // Filter out MDX component syntax - these are not actual code examples
      // Real code blocks typically don't start with < or <!--
      if (!code.startsWith("<") && !code.startsWith("<!--")) {
        blocks.push(code);
      }
    }
  }

  return blocks;
}

/**
 * Strip MDX/JSX components and imports to get plain text
 */
function stripMDX(content: string): string {
  // Remove import statements
  let cleaned = content.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, "");

  // Remove JSX components (self-closing and with children)
  cleaned = cleaned.replace(/<[A-Z][a-zA-Z0-9]*[^>]*\/>/g, "");
  cleaned = cleaned.replace(
    /<[A-Z][a-zA-Z0-9]*[^>]*>[\s\S]*?<\/[A-Z][a-zA-Z0-9]*>/g,
    ""
  );

  // Remove HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, "");

  // Remove code fence content but keep the headers before them
  // This helps preserve context while reducing noise
  cleaned = cleaned.replace(/```[\s\S]*?```/g, "[code block]");

  // Remove inline code backticks but keep content
  cleaned = cleaned.replace(/`([^`]+)`/g, "$1");

  // Remove markdown links but keep text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");

  // Remove markdown images
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^\)]+\)/g, "");

  // Remove excessive whitespace
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, "\n\n");
  cleaned = cleaned.replace(/\s+/g, " ");

  return cleaned.trim();
}

/**
 * Parse an MDX file from disk
 */
export function parseMDXFile(filePath: string): ParsedMDX {
  const absolutePath = resolve(filePath);
  const rawContent = readFileSync(absolutePath, "utf-8");

  const { frontmatter, content } = parseFrontmatter(rawContent);
  const cleanedContent = stripMDX(content);
  const codeBlocks = extractCodeBlocks(content);

  return {
    frontmatter,
    content: cleanedContent,
    codeBlocks,
  };
}

/**
 * Get a readable title from frontmatter or filename
 */
export function getTitle(
  frontmatter: MDXFrontmatter,
  filePath: string
): string {
  if (frontmatter.title) {
    return frontmatter.title as string;
  }

  // Generate title from filename
  const filename = filePath.split("/").pop() || "";
  const name = filename.replace(/\.mdx?$/, "");
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
