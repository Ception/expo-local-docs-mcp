// src/diskCache.ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { SearchIndexEntry } from "./searchIndex/types";

interface CachedSearchIndex {
  entries: SearchIndexEntry[];
  timestamp: number;
  version: string;
}

export class DiskCache {
  private maxAge: number;
  private baseDir: string;
  private readonly CACHE_VERSION: string;

  constructor(
    baseDir: string,
    maxAge: number = 86400000,
    version: string = "0.0.0"
  ) {
    this.maxAge = maxAge;
    this.baseDir = baseDir;
    this.CACHE_VERSION = version; // Version from package.json
    this.ensureCacheDir();
  }

  private ensureCacheDir(): void {
    if (!existsSync(this.baseDir)) {
      mkdirSync(this.baseDir, { recursive: true });
      console.error(`Created cache directory: ${this.baseDir}`);
    }
  }

  private getIndexPath(): string {
    return join(this.baseDir, "search-index.json");
  }

  /**
   * Load the search index from disk cache
   */
  loadSearchIndex(): SearchIndexEntry[] {
    try {
      const indexPath = this.getIndexPath();
      if (!existsSync(indexPath)) {
        return [];
      }

      const content = readFileSync(indexPath, "utf-8");
      const cached: CachedSearchIndex = JSON.parse(content);

      // Check version compatibility
      if (cached.version !== this.CACHE_VERSION) {
        console.error(
          `Cache version mismatch (expected ${this.CACHE_VERSION}, got ${cached.version}). Rebuilding index...`
        );
        return [];
      }

      // Check if cache is expired
      const age = Date.now() - cached.timestamp;
      if (age > this.maxAge) {
        console.error(
          `Cache expired (age: ${Math.round(
            age / 1000 / 60
          )} minutes). Rebuilding index...`
        );
        return [];
      }

      console.error(
        `[DISK CACHE] Loaded ${
          cached.entries.length
        } entries (age: ${Math.round(age / 1000)}s)`
      );
      return cached.entries;
    } catch (error) {
      console.error("[DISK CACHE] Failed to load search index:", error);
      return [];
    }
  }

  /**
   * Save the search index to disk cache
   */
  saveSearchIndex(entries: SearchIndexEntry[]): void {
    try {
      const indexPath = this.getIndexPath();
      const cached: CachedSearchIndex = {
        entries,
        timestamp: Date.now(),
        version: this.CACHE_VERSION,
      };

      writeFileSync(indexPath, JSON.stringify(cached));

      const sizeKB = Math.round(
        Buffer.byteLength(JSON.stringify(cached)) / 1024
      );
      console.error(
        `[DISK CACHE] Saved ${entries.length} entries (~${sizeKB}KB)`
      );
    } catch (error) {
      console.error("[DISK CACHE] Failed to save search index:", error);
    }
  }

  /**
   * Check if cache exists and is valid
   */
  isValid(): boolean {
    const indexPath = this.getIndexPath();
    if (!existsSync(indexPath)) {
      return false;
    }

    try {
      const content = readFileSync(indexPath, "utf-8");
      const cached: CachedSearchIndex = JSON.parse(content);

      // Check version and age
      if (cached.version !== this.CACHE_VERSION) {
        return false;
      }

      const age = Date.now() - cached.timestamp;
      return age <= this.maxAge;
    } catch {
      return false;
    }
  }
}
