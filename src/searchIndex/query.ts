// src/searchIndex/query.ts
import type { SearchIndexEntry } from "./types";
import { getIndex } from "./state";

interface ParsedVersion {
  raw: string;
  major: number;
  minor: number;
  patch: number;
  prerelease: string | null;
}

function parseVersion(version: string): ParsedVersion | null {
  const match = version.match(/^v(\d+)\.(\d+)\.(\d+)(?:-([A-Za-z0-9.-]+))?$/);
  if (!match) {
    return null;
  }

  return {
    raw: version,
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ?? null,
  };
}

function compareVersions(a: ParsedVersion, b: ParsedVersion): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  if (a.patch !== b.patch) return a.patch - b.patch;

  // Stable releases are newer than prereleases of the same version.
  if (!a.prerelease && b.prerelease) return 1;
  if (a.prerelease && !b.prerelease) return -1;
  if (!a.prerelease && !b.prerelease) return 0;

  return a.prerelease!.localeCompare(b.prerelease!);
}

function findLatestVersion(index: SearchIndexEntry[]): string | null {
  const versions = new Map<string, ParsedVersion>();

  for (const entry of index) {
    const match = entry.path.match(
      /^\/versions\/(v\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?)(?=\/|$)/
    );
    if (!match) {
      continue;
    }

    const parsed = parseVersion(match[1]);
    if (parsed) {
      versions.set(parsed.raw, parsed);
    }
  }

  if (versions.size === 0) {
    return null;
  }

  return Array.from(versions.values()).sort(compareVersions).at(-1)?.raw ?? null;
}

function resolveLatestPathAlias(
  path: string,
  index: SearchIndexEntry[]
): string | null {
  if (!path.startsWith("/versions/latest")) {
    return null;
  }

  const latestVersion = findLatestVersion(index);
  if (!latestVersion) {
    return null;
  }

  return path.replace(/^\/versions\/latest(?=\/|$)/, `/versions/${latestVersion}`);
}

function isPathMatch(entryPath: string, targetPath: string): boolean {
  return (
    entryPath === targetPath ||
    entryPath === targetPath.replace(/\/$/, "") ||
    entryPath + "/" === targetPath
  );
}

/**
 * Get document by exact path match
 */
export function getDocumentByPath(path: string): SearchIndexEntry | null {
  // Normalize path
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const index = getIndex();
  const latestPathAlias = resolveLatestPathAlias(normalizedPath, index);

  return (
    index.find(
      (entry) =>
        isPathMatch(entry.path, normalizedPath) ||
        (latestPathAlias ? isPathMatch(entry.path, latestPathAlias) : false)
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
