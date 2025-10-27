// src/searchIndex/index.ts
export type { SearchIndexEntry } from "./types";
export { setDiskCache, isIndexReady, getIndexSize } from "./state";
export { loadSearchIndex } from "./loader";
export { searchInIndex } from "./search";
export { getDocumentByPath, getSections, getDocumentsBySection } from "./query";
