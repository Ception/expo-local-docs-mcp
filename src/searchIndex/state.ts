// src/searchIndex/state.ts
import type { DiskCache } from "../diskCache";
import type { SearchIndexEntry } from "./types";

let index: SearchIndexEntry[] = [];
let indexLoaded = false;
let diskCache: DiskCache | null = null;

export function setDiskCache(cache: DiskCache): void {
  diskCache = cache;
}

export function getDiskCache(): DiskCache | null {
  return diskCache;
}

export function getIndex(): SearchIndexEntry[] {
  return index;
}

export function setIndex(newIndex: SearchIndexEntry[]): void {
  index = newIndex;
}

export function isIndexLoaded(): boolean {
  return indexLoaded;
}

export function setIndexLoaded(loaded: boolean): void {
  indexLoaded = loaded;
}

export function isIndexReady(): boolean {
  return indexLoaded && index.length > 0;
}

export function getIndexSize(): number {
  return index.length;
}
